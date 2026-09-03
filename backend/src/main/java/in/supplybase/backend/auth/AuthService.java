package in.supplybase.backend.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import in.supplybase.backend.auth.dto.AuthResponse;
import in.supplybase.backend.auth.dto.LoginRequest;
import in.supplybase.backend.auth.dto.RegisterRequest;
import in.supplybase.backend.auth.dto.UserResponse;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;

import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.InMemoryRateLimiter;
import in.supplybase.backend.common.PhoneNumbers;
import in.supplybase.backend.config.AppProperties;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    // Brute-force protection on login: generous enough that mistyping a
    // password twice never locks anyone out, tight enough to slow guessing.
    private static final int LOGIN_MAX = 10;
    private static final Duration LOGIN_WINDOW = Duration.ofMinutes(15);
    // Registration abuse (account-creation bots). Keyed by IP when the
    // controller can supply one.
    private static final int REGISTER_MAX = 10;
    private static final Duration REGISTER_WINDOW = Duration.ofHours(1);
    // Refresh happens automatically in the background of a normal session, so
    // this stays generous — it exists only to blunt a runaway or malicious client.
    private static final int REFRESH_MAX = 30;
    private static final Duration REFRESH_WINDOW = Duration.ofHours(1);
    // Forgot-password sends an email; this keeps it from being used to spam
    // an inbox or to fish for which identifiers have accounts.
    private static final int FORGOT_PASSWORD_MAX = 5;
    private static final Duration FORGOT_PASSWORD_WINDOW = Duration.ofHours(1);

    private static final Duration PASSWORD_RESET_TOKEN_LIFETIME = Duration.ofHours(1);
    private static final Duration EMAIL_VERIFICATION_TOKEN_LIFETIME = Duration.ofHours(24);

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordResetTokenRepository passwordResetTokens;
    private final EmailVerificationTokenRepository emailVerificationTokens;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GoogleTokenVerifier googleVerifier;
    private final InMemoryRateLimiter rateLimiter;
    private final AppProperties props;
    private final ObjectProvider<JavaMailSender> mailSender;

    public AuthService(UserRepository users,
                       RefreshTokenRepository refreshTokens,
                       PasswordResetTokenRepository passwordResetTokens,
                       EmailVerificationTokenRepository emailVerificationTokens,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       GoogleTokenVerifier googleVerifier,
                       InMemoryRateLimiter rateLimiter,
                       AppProperties props,
                       ObjectProvider<JavaMailSender> mailSender) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.passwordResetTokens = passwordResetTokens;
        this.emailVerificationTokens = emailVerificationTokens;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleVerifier = googleVerifier;
        this.rateLimiter = rateLimiter;
        this.props = props;
        this.mailSender = mailSender;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request, String clientIp) {
        // Keyed by IP rather than by the email/phone being registered — those
        // are exactly what a signup bot varies on every attempt, so keying on
        // them would not slow it down at all.
        if (!rateLimiter.tryAcquire("register:" + (clientIp == null ? "unknown" : clientIp),
                REGISTER_MAX, REGISTER_WINDOW)) {
            throw ApiException.tooManyRequests("Too many attempts. Please wait a while and try again.");
        }

        String email = normalise(request.email());
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account already exists with that email. Try signing in instead.");
        }

        String phone = PhoneNumbers.normalise(request.phone());
        if (phone != null && users.existsByPhone(phone)) {
            throw ApiException.conflict(
                    "An account already exists with that phone number. Try signing in instead.");
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .phone(phone)
                // Self-registration always produces a CLIENT. Staff roles are
                // granted by an admin, never claimed by the person signing up.
                // Self-registration always produces a CUSTOMER. Staff and
                // professional roles are granted by an admin, never claimed.
                .role(Role.CUSTOMER)
                .enabled(true)
                .build();

        User saved = users.save(user);
        // Password sign-ups start unverified; Google sign-ups arrive already
        // verified (see loginWithGoogle) and must not get this email too.
        sendVerificationEmail(saved.getId());
        return issueTokens(saved);
    }

    /**
     * Signs in with an email address or a ten-digit mobile number.
     *
     * Which one it is comes from the value itself, not from a toggle the
     * person has to set correctly before typing: an email has an @ and a phone
     * number does not.
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        String identifierKey = request.identifier() == null ? "" : request.identifier().trim().toLowerCase();
        if (!rateLimiter.tryAcquire("login:" + identifierKey, LOGIN_MAX, LOGIN_WINDOW)) {
            throw ApiException.tooManyRequests("Too many attempts. Please wait a while and try again.");
        }

        User user = findByIdentifier(request.identifier())
                // hasPassword() first: a Google-only account has a null hash, and
                // BCrypt.matches would throw on it rather than simply say no.
                .filter(User::hasPassword)
                .filter(candidate -> passwordEncoder.matches(request.password(), candidate.getPasswordHash()))
                // One message for "no such email" and for "wrong password", so
                // the endpoint cannot be used to discover who has an account.
                .orElseThrow(() -> ApiException.unauthorized(
                        "Wrong details. Please check and try again."));

        if (!user.isEnabled()) {
            throw ApiException.forbidden("This account has been switched off. Please contact us.");
        }
        return issueTokens(user);
    }

    /**
     * Signs in with a verified Google token, creating the account if needed.
     *
     * Three cases, in this order:
     *   1. we already know this google_sub    -> sign in
     *   2. we know the email but not the sub  -> link Google to that account
     *   3. neither                            -> create a new CLIENT
     *
     * Case 2 is the one worth care. Linking on a verified Google email is safe
     * because Google has proven ownership of the address; without it, a client
     * who registered with a password and later clicks the Google button would
     * silently get a second, empty account and wonder where their project went.
     */
    @Transactional
    public AuthResponse loginWithGoogle(String credential) {
        GoogleIdToken.Payload payload = googleVerifier.verify(credential);

        String googleSub = payload.getSubject();
        String email = normalise(payload.getEmail());
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");

        User user = users.findByGoogleSub(googleSub)
                .or(() -> users.findByEmailIgnoreCase(email))
                .orElse(null);

        if (user == null) {
            user = User.builder()
                    .email(email)
                    .passwordHash(null)
                    .googleSub(googleSub)
                    .fullName(name == null || name.isBlank() ? email.split("@")[0] : name.trim())
                    .emailVerified(true)
                    .pictureUrl(picture)
                    .role(Role.CUSTOMER)
                    .enabled(true)
                    .build();
        } else {
            if (user.getGoogleSub() == null) {
                user.setGoogleSub(googleSub);
            }
            user.setEmailVerified(true);
            // Refresh the picture, but never overwrite a name the client has
            // set on their own account with whatever Google currently holds.
            if (picture != null) {
                user.setPictureUrl(picture);
            }
        }

        if (!user.isEnabled()) {
            throw ApiException.forbidden("This account has been switched off. Please contact us.");
        }
        return issueTokens(users.save(user));
    }

    @Transactional
    public AuthResponse refresh(String presentedToken) {
        if (!rateLimiter.tryAcquire("refresh:" + presentedToken, REFRESH_MAX, REFRESH_WINDOW)) {
            throw ApiException.tooManyRequests("Too many attempts. Please wait a while and try again.");
        }

        RefreshToken stored = refreshTokens.findByTokenHash(jwtService.hashRefreshToken(presentedToken))
                .orElseThrow(() -> ApiException.unauthorized("Your session has expired. Please sign in again."));

        if (!stored.isUsable()) {
            throw ApiException.unauthorized("Your session has expired. Please sign in again.");
        }

        // Rotation: the presented token dies as the new one is born, so a
        // stolen refresh token is usable at most once before it is worthless.
        stored.setRevoked(true);
        refreshTokens.save(stored);

        return issueTokens(stored.getUser());
    }

    @Transactional
    public void logout(String presentedToken) {
        refreshTokens.findByTokenHash(jwtService.hashRefreshToken(presentedToken))
                .ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokens.save(token);
                });
    }

    @Transactional
    public void logoutEverywhere(Long userId) {
        refreshTokens.revokeAllForUser(userId);
    }

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {
        return users.findById(userId)
                .map(UserResponse::from)
                .orElseThrow(() -> ApiException.notFound("That account"));
    }

    /* ---------------------------------------------------------- password reset */

    /**
     * Looks the identifier up and, if it resolves to a password-holding
     * account, emails a reset link. Returns successfully either way — a
     * "not found" response here would let this endpoint be used to discover
     * which emails and phone numbers have accounts, which is the one thing
     * a forgot-password flow must never do.
     */
    @Transactional
    public void forgotPassword(String identifier) {
        String identifierKey = identifier == null ? "" : identifier.trim().toLowerCase();
        if (!rateLimiter.tryAcquire("forgot-password:" + identifierKey,
                FORGOT_PASSWORD_MAX, FORGOT_PASSWORD_WINDOW)) {
            throw ApiException.tooManyRequests("Too many attempts. Please wait a while and try again.");
        }

        Optional<User> maybeUser = findByIdentifier(identifier).filter(User::hasPassword);
        if (maybeUser.isEmpty()) {
            // Silently do nothing for "no such account" and "Google-only
            // account" alike — same reasoning as login()'s single error message.
            return;
        }
        User user = maybeUser.get();

        // Any earlier, still-unused link becomes dead the moment a new one is
        // requested, so only the most recent email is ever usable.
        passwordResetTokens.deleteByUserIdAndUsedAtIsNull(user.getId());

        String rawToken = jwtService.generateRefreshToken();
        passwordResetTokens.save(PasswordResetToken.builder()
                .user(user)
                .tokenHash(jwtService.hashRefreshToken(rawToken))
                .expiresAt(Instant.now().plus(PASSWORD_RESET_TOKEN_LIFETIME))
                .build());

        String link = props.frontendUrl() + "/reset-password?token=" + rawToken;
        sendBestEffort(user.getEmail(), "Reset your SupplyBase password",
                "We received a request to reset your SupplyBase password.\n\n"
                        + "Reset it here: " + link + "\n\n"
                        + "This link expires in one hour. If you did not request this, you can ignore this email.");
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken stored = passwordResetTokens.findByTokenHash(jwtService.hashRefreshToken(token))
                .filter(PasswordResetToken::isUsable)
                .orElseThrow(() -> ApiException.badRequest(
                        "This reset link is invalid or has expired. Please request a new one."));

        User user = stored.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        users.save(user);

        stored.setUsedAt(Instant.now());
        passwordResetTokens.save(stored);

        // A password reset is exactly the moment every existing session
        // should die — if the reset was because the account was compromised,
        // this is what actually locks the previous holder out.
        logoutEverywhere(user.getId());
    }

    /* ------------------------------------------------------ email verification */

    @Transactional
    public void sendVerificationEmail(Long userId) {
        User user = users.findById(userId)
                .orElseThrow(() -> ApiException.notFound("That account"));
        if (user.isEmailVerified()) {
            return;
        }

        emailVerificationTokens.deleteByUserIdAndUsedAtIsNull(user.getId());

        String rawToken = jwtService.generateRefreshToken();
        emailVerificationTokens.save(EmailVerificationToken.builder()
                .user(user)
                .tokenHash(jwtService.hashRefreshToken(rawToken))
                .expiresAt(Instant.now().plus(EMAIL_VERIFICATION_TOKEN_LIFETIME))
                .build());

        String link = props.frontendUrl() + "/verify-email?token=" + rawToken;
        sendBestEffort(user.getEmail(), "Verify your SupplyBase email address",
                "Please verify your email address to finish setting up your SupplyBase account.\n\n"
                        + "Verify it here: " + link + "\n\n"
                        + "This link expires in 24 hours.");
    }

    @Transactional
    public void verifyEmail(String token) {
        EmailVerificationToken stored = emailVerificationTokens.findByTokenHash(jwtService.hashRefreshToken(token))
                .filter(EmailVerificationToken::isUsable)
                .orElseThrow(() -> ApiException.badRequest(
                        "This verification link is invalid or has expired. Please request a new one."));

        User user = stored.getUser();
        user.setEmailVerified(true);
        users.save(user);

        stored.setUsedAt(Instant.now());
        emailVerificationTokens.save(stored);
    }

    /* ------------------------------------------------------------- admin */

    @Transactional(readOnly = true)
    public Page<UserResponse> listUsers(Role role, String q, Pageable pageable) {
        String query = (q == null || q.isBlank()) ? null : q.trim();
        return users.search(role, query, pageable).map(UserResponse::from);
    }

    @Transactional
    public UserResponse updateRole(Long targetId, Role newRole, Long callerId) {
        if (targetId.equals(callerId)) {
            throw ApiException.badRequest("You cannot change your own role.");
        }
        User user = users.findById(targetId)
                .orElseThrow(() -> ApiException.notFound("That account"));
        user.setRole(newRole);
        return UserResponse.from(users.save(user));
    }

    @Transactional
    public UserResponse updateStatus(Long targetId, boolean enabled, Long callerId) {
        if (targetId.equals(callerId)) {
            throw ApiException.badRequest("You cannot disable your own account.");
        }
        User user = users.findById(targetId)
                .orElseThrow(() -> ApiException.notFound("That account"));
        user.setEnabled(enabled);
        return UserResponse.from(users.save(user));
    }

    private AuthResponse issueTokens(User user) {
        String refreshValue = jwtService.generateRefreshToken();
        refreshTokens.save(RefreshToken.builder()
                .user(user)
                .tokenHash(jwtService.hashRefreshToken(refreshValue))
                .expiresAt(Instant.now().plus(jwtService.refreshTokenLifetime()))
                .revoked(false)
                .build());

        return AuthResponse.of(
                jwtService.issueAccessToken(user),
                refreshValue,
                jwtService.accessTokenLifetime().toSeconds(),
                UserResponse.from(user));
    }

    /** Resolves whichever of the two identifiers was typed. */
    private java.util.Optional<User> findByIdentifier(String identifier) {
        String trimmed = identifier == null ? "" : identifier.trim();
        if (PhoneNumbers.looksLikeEmail(trimmed)) {
            return users.findByEmailIgnoreCase(trimmed.toLowerCase());
        }
        // normaliseOrNull, not normalise: a malformed number here is simply a
        // failed sign-in, not a 400. The generic "wrong details" message keeps
        // this endpoint from confirming which accounts exist.
        String phone = PhoneNumbers.normaliseOrNull(trimmed);
        return phone == null ? java.util.Optional.empty() : users.findByPhone(phone);
    }

    /** Best-effort, like BookingService.notifyStaff: never lets an email failure fail the request. */
    private void sendBestEffort(String to, String subject, String body) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            sender.send(message);
        } catch (Exception ex) {
            log.warn("Could not send email to {} — continuing regardless", to, ex);
        }
    }

    private static String normalise(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    // NOTE: Google sign-up leaves phone null — Google does not give us one, and
    // asking for it mid-flow would break the one-click promise of that button.
    // The dashboard can collect it later.
}

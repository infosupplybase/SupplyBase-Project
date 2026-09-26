package in.supplybase.backend.auth;

import java.security.SecureRandom;
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

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;

import in.supplybase.backend.auth.dto.AuthResponse;
import in.supplybase.backend.auth.dto.LoginRequest;
import in.supplybase.backend.auth.dto.RegisterRequest;
import in.supplybase.backend.auth.dto.SendOtpRequest;
import in.supplybase.backend.auth.dto.UpdateProfileRequest;
import in.supplybase.backend.auth.dto.UserResponse;
import in.supplybase.backend.auth.dto.VerifyOtpRequest;
import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.InMemoryRateLimiter;
import in.supplybase.backend.common.PhoneNumbers;
import in.supplybase.backend.config.AppProperties;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    // Brute-force protection on login.
    private static final int LOGIN_MAX = 10;
    private static final Duration LOGIN_WINDOW = Duration.ofMinutes(15);

    // Registration abuse protection.
    private static final int REGISTER_MAX = 10;
    private static final Duration REGISTER_WINDOW = Duration.ofHours(1);

    // Refresh token abuse protection.
    private static final int REFRESH_MAX = 30;
    private static final Duration REFRESH_WINDOW = Duration.ofHours(1);

    // Forgot-password protection.
    private static final int FORGOT_PASSWORD_MAX = 5;
    private static final Duration FORGOT_PASSWORD_WINDOW = Duration.ofHours(1);

    private static final Duration PASSWORD_RESET_TOKEN_LIFETIME =
            Duration.ofHours(1);

    private static final Duration EMAIL_VERIFICATION_TOKEN_LIFETIME =
            Duration.ofHours(24);

    // OTP settings.
    private static final Duration OTP_LIFETIME =
            Duration.ofMinutes(5);

    private static final Duration OTP_RESEND_COOLDOWN =
            Duration.ofSeconds(60);

    private static final int OTP_MAX_ATTEMPTS = 5;

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
    private final EmailOtpRepository emailOtps;

    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
            UserRepository users,
            RefreshTokenRepository refreshTokens,
            PasswordResetTokenRepository passwordResetTokens,
            EmailVerificationTokenRepository emailVerificationTokens,
            EmailOtpRepository emailOtps,
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
        this.emailOtps = emailOtps;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleVerifier = googleVerifier;
        this.rateLimiter = rateLimiter;
        this.props = props;
        this.mailSender = mailSender;
    }

    /* --------------------------------------------------------------- OTP */

    @Transactional
    public void sendOtp(String email) {

        String normalizedEmail = normalise(email);

        Instant now = Instant.now();

        // Prevent sending another OTP too quickly.
        Optional<EmailOtp> previous =
                emailOtps.findTopByEmailAndUsedAtIsNullOrderByCreatedAtDesc(
                        normalizedEmail);

        if (previous.isPresent()) {

            Instant nextAllowed =
                    previous.get()
                            .getCreatedAt()
                            .plus(OTP_RESEND_COOLDOWN);

            if (now.isBefore(nextAllowed)) {
                throw ApiException.tooManyRequests(
                        "Please wait before requesting another OTP.");
            }
        }

        // Invalidate previous OTPs.
        emailOtps.deleteByEmailAndUsedAtIsNull(normalizedEmail);

        // Generate six-digit OTP.
        int otpNumber =
                100000 + secureRandom.nextInt(900000);

        String otp = String.valueOf(otpNumber);

        EmailOtp emailOtp = new EmailOtp();

        emailOtp.setEmail(normalizedEmail);

        // Store only the hashed OTP.
        emailOtp.setOtpHash(
                passwordEncoder.encode(otp));

        emailOtp.setExpiresAt(
                now.plus(OTP_LIFETIME));

        emailOtp.setAttempts(0);
        emailOtp.setCreatedAt(now);

        emailOtps.save(emailOtp);

        sendBestEffort(
                normalizedEmail,
                "Your SupplyBase verification OTP",
                "Your SupplyBase verification code is: "
                        + otp
                        + "\n\n"
                        + "This OTP expires in 5 minutes."
                        + "\n\n"
                        + "If you did not request this code, "
                        + "you can ignore this email."
        );
    }

    @Transactional
    public AuthResponse verifyOtp(String email, String otp) {

        String normalizedEmail = normalise(email);

        EmailOtp stored = emailOtps
                .findTopByEmailAndUsedAtIsNullOrderByCreatedAtDesc(
                        normalizedEmail)
                .orElseThrow(() ->
                        ApiException.badRequest(
                                "OTP is invalid or has expired."));

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw ApiException.badRequest(
                    "OTP has expired. Please request a new OTP.");
        }

        if (stored.getAttempts() >= OTP_MAX_ATTEMPTS) {
            throw ApiException.tooManyRequests(
                    "Too many incorrect attempts. Please request a new OTP.");
        }

        // Count this attempt before checking the OTP.
        stored.setAttempts(
                stored.getAttempts() + 1);

        emailOtps.save(stored);

        if (!passwordEncoder.matches(
                otp,
                stored.getOtpHash())) {

            throw ApiException.badRequest(
                    "Incorrect OTP.");
        }

        // OTP is now successfully used.
        stored.setUsedAt(Instant.now());

        emailOtps.save(stored);

        User user = users
                .findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() ->
                        ApiException.badRequest(
                                "Account not found."));

        user.setEmailVerified(true);

        users.save(user);

        // Login only after successful OTP verification.
        return issueTokens(user);
    }

    /* ---------------------------------------------------------- register */

    /**
     * Existing registration flow.
     *
     * This method is intentionally kept returning AuthResponse because
     * PartnerService depends on it when creating partner applications.
     */
    @Transactional
    public AuthResponse register(
            RegisterRequest request,
            String clientIp) {

        // Keyed by IP rather than by the email/phone being registered.
        if (!rateLimiter.tryAcquire(
                "register:"
                        + (clientIp == null
                                ? "unknown"
                                : clientIp),
                REGISTER_MAX,
                REGISTER_WINDOW)) {

            throw ApiException.tooManyRequests(
                    "Too many attempts. Please wait a while and try again.");
        }

        String email =
                normalise(request.email());

        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict(
                    "An account already exists with that email. "
                            + "Try signing in instead.");
        }

        String phone =
                PhoneNumbers.normalise(request.phone());

        if (phone != null
                && users.existsByPhone(phone)) {

            throw ApiException.conflict(
                    "An account already exists with that phone number. "
                            + "Try signing in instead.");
        }

        User user = User.builder()
                .email(email)
                .passwordHash(
                        passwordEncoder.encode(
                                request.password()))
                .fullName(
                        request.fullName().trim())
                .phone(phone)

                // Existing registration behavior.
                .role(Role.CUSTOMER)
                .enabled(true)
                .build();

        User saved = users.save(user);

        // Keep the existing registration flow working.
        sendVerificationEmail(saved.getId());

        return issueTokens(saved);
    }

    /**
     * Customer registration flow using OTP.
     *
     * Creates the account and sends an OTP, but does NOT issue JWT tokens.
     * The customer receives tokens only after successful OTP verification.
     */
    @Transactional
    public void registerForOtp(
            RegisterRequest request,
            String clientIp) {

        // Registration abuse protection.
        if (!rateLimiter.tryAcquire(
                "register:"
                        + (clientIp == null
                                ? "unknown"
                                : clientIp),
                REGISTER_MAX,
                REGISTER_WINDOW)) {

            throw ApiException.tooManyRequests(
                    "Too many attempts. Please wait a while and try again.");
        }

        String email =
                normalise(request.email());

        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict(
                    "An account already exists with that email. "
                            + "Try signing in instead.");
        }

        String phone =
                PhoneNumbers.normalise(request.phone());

        if (phone != null
                && users.existsByPhone(phone)) {

            throw ApiException.conflict(
                    "An account already exists with that phone number. "
                            + "Try signing in instead.");
        }

        User user = User.builder()
                .email(email)
                .passwordHash(
                        passwordEncoder.encode(
                                request.password()))
                .fullName(
                        request.fullName().trim())
                .phone(phone)
                .role(Role.CUSTOMER)
                .enabled(true)
                .build();

        User saved = users.save(user);

        // Send OTP instead of automatically logging the customer in.
        sendOtp(saved.getEmail());
    }

    /* --------------------------------------------------------------- login */

    /**
     * Signs in with an email address or a ten-digit mobile number.
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {

        String identifierKey =
                request.identifier() == null
                        ? ""
                        : request.identifier()
                                .trim()
                                .toLowerCase();

        if (!rateLimiter.tryAcquire(
                "login:" + identifierKey,
                LOGIN_MAX,
                LOGIN_WINDOW)) {

            throw ApiException.tooManyRequests(
                    "Too many attempts. Please wait a while and try again.");
        }

        User user = findByIdentifier(
                request.identifier())

                .filter(User::hasPassword)

                .filter(candidate ->
                        passwordEncoder.matches(
                                request.password(),
                                candidate.getPasswordHash()))

                .orElseThrow(() ->
                        ApiException.unauthorized(
                                "Wrong details. Please check and try again."));

        if (!user.isEnabled()) {
            throw ApiException.forbidden(
                    "This account has been switched off. "
                            + "Please contact us.");
        }

        return issueTokens(user);
    }

    /* --------------------------------------------------------- Google login */

    /**
     * Signs in with a verified Google token, creating the account if needed.
     */
    @Transactional
    public AuthResponse loginWithGoogle(String credential) {

        GoogleIdToken.Payload payload =
                googleVerifier.verify(credential);

        String googleSub =
                payload.getSubject();

        String email =
                normalise(payload.getEmail());

        String name =
                (String) payload.get("name");

        String picture =
                (String) payload.get("picture");

        User user = users
                .findByGoogleSub(googleSub)
                .or(() ->
                        users.findByEmailIgnoreCase(email))
                .orElse(null);

        if (user == null) {

            user = User.builder()
                    .email(email)
                    .passwordHash(null)
                    .googleSub(googleSub)
                    .fullName(
                            name == null || name.isBlank()
                                    ? email.split("@")[0]
                                    : name.trim())
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

            // Refresh picture but never overwrite
            // a name the customer has set.
            if (picture != null) {
                user.setPictureUrl(picture);
            }
        }

        if (!user.isEnabled()) {
            throw ApiException.forbidden(
                    "This account has been switched off. "
                            + "Please contact us.");
        }

        return issueTokens(
                users.save(user));
    }

    /* ------------------------------------------------------------- refresh */

    @Transactional
    public AuthResponse refresh(
            String presentedToken) {

        if (!rateLimiter.tryAcquire(
                "refresh:" + presentedToken,
                REFRESH_MAX,
                REFRESH_WINDOW)) {

            throw ApiException.tooManyRequests(
                    "Too many attempts. Please wait a while and try again.");
        }

        RefreshToken stored =
                refreshTokens
                        .findByTokenHash(
                                jwtService.hashRefreshToken(
                                        presentedToken))
                        .orElseThrow(() ->
                                ApiException.unauthorized(
                                        "Your session has expired. "
                                                + "Please sign in again."));

        if (!stored.isUsable()) {
            throw ApiException.unauthorized(
                    "Your session has expired. "
                            + "Please sign in again.");
        }

        // Rotate refresh token.
        stored.setRevoked(true);

        refreshTokens.save(stored);

        return issueTokens(
                stored.getUser());
    }

    /* ---------------------------------------------------------------- logout */

    @Transactional
    public void logout(String presentedToken) {

        refreshTokens
                .findByTokenHash(
                        jwtService.hashRefreshToken(
                                presentedToken))
                .ifPresent(token -> {

                    token.setRevoked(true);

                    refreshTokens.save(token);
                });
    }

    @Transactional
    public void logoutEverywhere(Long userId) {

        refreshTokens.revokeAllForUser(userId);
    }

    /* ------------------------------------------------------------------ me */

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {

        return users.findById(userId)
                .map(UserResponse::from)
                .orElseThrow(() ->
                        ApiException.notFound(
                                "That account"));
    }

    /* --------------------------------------------------------- profile */

    /**
     * Self-service edit — name, phone, gender, address.
     */
    @Transactional
    public UserResponse updateProfile(
            Long userId,
            UpdateProfileRequest request) {

        User user =
                users.findById(userId)
                        .orElseThrow(() ->
                                ApiException.notFound(
                                        "That account"));

        String phone =
                PhoneNumbers.normalise(
                        request.phone());

        if (phone != null
                && !phone.equals(user.getPhone())
                && users.existsByPhone(phone)) {

            throw ApiException.conflict(
                    "Another account already uses that phone number.");
        }

        user.setFullName(
                request.fullName().trim());

        user.setPhone(phone);

        user.setGender(
                blankToNull(request.gender()));

        user.setAddressLine1(
                blankToNull(request.addressLine1()));

        user.setAddressLine2(
                blankToNull(request.addressLine2()));

        user.setCity(
                blankToNull(request.city()));

        user.setPinCode(
                blankToNull(request.pinCode()));

        user.setLandmark(
                blankToNull(request.landmark()));

        return UserResponse.from(
                users.save(user));
    }

    /* ------------------------------------------------------ password reset */

    @Transactional
    public void forgotPassword(String identifier) {

        String identifierKey =
                identifier == null
                        ? ""
                        : identifier.trim()
                                .toLowerCase();

        if (!rateLimiter.tryAcquire(
                "forgot-password:" + identifierKey,
                FORGOT_PASSWORD_MAX,
                FORGOT_PASSWORD_WINDOW)) {

            throw ApiException.tooManyRequests(
                    "Too many attempts. Please wait a while and try again.");
        }

        Optional<User> maybeUser =
                findByIdentifier(identifier)
                        .filter(User::hasPassword);

        if (maybeUser.isEmpty()) {
            return;
        }

        User user = maybeUser.get();

        passwordResetTokens
                .deleteByUserIdAndUsedAtIsNull(
                        user.getId());

        String rawToken =
                jwtService.generateRefreshToken();

        passwordResetTokens.save(
                PasswordResetToken.builder()
                        .user(user)
                        .tokenHash(
                                jwtService.hashRefreshToken(
                                        rawToken))
                        .expiresAt(
                                Instant.now()
                                        .plus(PASSWORD_RESET_TOKEN_LIFETIME))
                        .build());

        String link =
                props.frontendUrl()
                        + "/reset-password?token="
                        + rawToken;

        sendBestEffort(
                user.getEmail(),
                "Reset your SupplyBase password",
                "We received a request to reset your SupplyBase password.\n\n"
                        + "Reset it here: "
                        + link
                        + "\n\n"
                        + "This link expires in one hour. "
                        + "If you did not request this, "
                        + "you can ignore this email.");
    }

    @Transactional
    public void resetPassword(
            String token,
            String newPassword) {

        PasswordResetToken stored =
                passwordResetTokens
                        .findByTokenHash(
                                jwtService.hashRefreshToken(
                                        token))
                        .filter(
                                PasswordResetToken::isUsable)
                        .orElseThrow(() ->
                                ApiException.badRequest(
                                        "This reset link is invalid "
                                                + "or has expired. "
                                                + "Please request a new one."));

        User user =
                stored.getUser();

        user.setPasswordHash(
                passwordEncoder.encode(
                        newPassword));

        users.save(user);

        stored.setUsedAt(
                Instant.now());

        passwordResetTokens.save(stored);

        // Kill all existing sessions.
        logoutEverywhere(
                user.getId());
    }

    /* ------------------------------------------------ email verification */

    @Transactional
    public void sendVerificationEmail(
            Long userId) {

        User user =
                users.findById(userId)
                        .orElseThrow(() ->
                                ApiException.notFound(
                                        "That account"));

        if (user.isEmailVerified()) {
            return;
        }

        emailVerificationTokens
                .deleteByUserIdAndUsedAtIsNull(
                        user.getId());

        String rawToken =
                jwtService.generateRefreshToken();

        emailVerificationTokens.save(
                EmailVerificationToken.builder()
                        .user(user)
                        .tokenHash(
                                jwtService.hashRefreshToken(
                                        rawToken))
                        .expiresAt(
                                Instant.now()
                                        .plus(EMAIL_VERIFICATION_TOKEN_LIFETIME))
                        .build());

        String link =
                props.frontendUrl()
                        + "/verify-email?token="
                        + rawToken;

        sendBestEffort(
                user.getEmail(),
                "Verify your SupplyBase email address",
                "Please verify your email address to finish "
                        + "setting up your SupplyBase account.\n\n"
                        + "Verify it here: "
                        + link
                        + "\n\n"
                        + "This link expires in 24 hours.");
    }

    @Transactional
    public void verifyEmail(String token) {

        EmailVerificationToken stored =
                emailVerificationTokens
                        .findByTokenHash(
                                jwtService.hashRefreshToken(
                                        token))
                        .filter(
                                EmailVerificationToken::isUsable)
                        .orElseThrow(() ->
                                ApiException.badRequest(
                                        "This verification link is invalid "
                                                + "or has expired. "
                                                + "Please request a new one."));

        User user =
                stored.getUser();

        user.setEmailVerified(true);

        users.save(user);

        stored.setUsedAt(
                Instant.now());

        emailVerificationTokens.save(stored);
    }

    /* ------------------------------------------------------------- admin */

    @Transactional(readOnly = true)
    public Page<UserResponse> listUsers(
            Role role,
            String q,
            Pageable pageable) {

        String query =
                (q == null || q.isBlank())
                        ? null
                        : q.trim();

        return users.search(
                role,
                query,
                pageable)
                .map(UserResponse::from);
    }

    @Transactional
    public UserResponse updateRole(
            Long targetId,
            Role newRole,
            Long callerId) {

        if (targetId.equals(callerId)) {
            throw ApiException.badRequest(
                    "You cannot change your own role.");
        }

        User user =
                users.findById(targetId)
                        .orElseThrow(() ->
                                ApiException.notFound(
                                        "That account"));

        user.setRole(newRole);

        return UserResponse.from(
                users.save(user));
    }

    @Transactional
    public UserResponse updateStatus(
            Long targetId,
            boolean enabled,
            Long callerId) {

        if (targetId.equals(callerId)) {
            throw ApiException.badRequest(
                    "You cannot disable your own account.");
        }

        User user =
                users.findById(targetId)
                        .orElseThrow(() ->
                                ApiException.notFound(
                                        "That account"));

        user.setEnabled(enabled);

        return UserResponse.from(
                users.save(user));
    }

    /* --------------------------------------------------------- JWT tokens */

    private AuthResponse issueTokens(User user) {

        String refreshValue =
                jwtService.generateRefreshToken();

        refreshTokens.save(
                RefreshToken.builder()
                        .user(user)
                        .tokenHash(
                                jwtService.hashRefreshToken(
                                        refreshValue))
                        .expiresAt(
                                Instant.now()
                                        .plus(
                                                jwtService.refreshTokenLifetime()))
                        .revoked(false)
                        .build());

        return AuthResponse.of(
                jwtService.issueAccessToken(user),
                refreshValue,
                jwtService.accessTokenLifetime()
                        .toSeconds(),
                UserResponse.from(user));
    }

    /* ------------------------------------------------------- identifier */

    /**
     * Resolves whichever of the two identifiers was typed.
     */
    private java.util.Optional<User> findByIdentifier(
            String identifier) {

        String trimmed =
                identifier == null
                        ? ""
                        : identifier.trim();

        if (PhoneNumbers.looksLikeEmail(trimmed)) {

            return users.findByEmailIgnoreCase(
                    trimmed.toLowerCase());
        }

        String phone =
                PhoneNumbers.normaliseOrNull(trimmed);

        return phone == null
                ? java.util.Optional.empty()
                : users.findByPhone(phone);
    }

    /* ------------------------------------------------------------ email */

    /**
     * Best-effort email sending.
     *
     * Email failures never fail the API request.
     */
    private void sendBestEffort(
            String to,
            String subject,
            String body) {

        JavaMailSender sender =
                mailSender.getIfAvailable();

        if (sender == null) {
            return;
        }

        try {

            SimpleMailMessage message =
                    new SimpleMailMessage();

            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);

            sender.send(message);

        } catch (Exception ex) {

            log.warn(
                    "Could not send email to {} — continuing regardless",
                    to,
                    ex);
        }
    }

    /* ----------------------------------------------------------- helpers */

    private static String normalise(String email) {

        return email == null
                ? ""
                : email.trim().toLowerCase();
    }

    private static String blankToNull(
            String value) {

        return value == null || value.isBlank()
                ? null
                : value.trim();
    }

    // Google sign-up leaves phone null because Google does not provide it.
}
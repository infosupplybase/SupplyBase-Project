package in.supplybase.backend.auth;

import java.time.Instant;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import in.supplybase.backend.auth.dto.AuthResponse;
import in.supplybase.backend.auth.dto.LoginRequest;
import in.supplybase.backend.auth.dto.RegisterRequest;
import in.supplybase.backend.auth.dto.UserResponse;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;

import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.PhoneNumbers;

@Service
public class AuthService {

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GoogleTokenVerifier googleVerifier;

    public AuthService(UserRepository users,
                       RefreshTokenRepository refreshTokens,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       GoogleTokenVerifier googleVerifier) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleVerifier = googleVerifier;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
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
                .role(Role.CLIENT)
                .enabled(true)
                .build();

        return issueTokens(users.save(user));
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
                    .role(Role.CLIENT)
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

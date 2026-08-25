package in.supplybase.backend.auth;

import java.time.Instant;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import in.supplybase.backend.auth.dto.AuthResponse;
import in.supplybase.backend.auth.dto.LoginRequest;
import in.supplybase.backend.auth.dto.RegisterRequest;
import in.supplybase.backend.auth.dto.UserResponse;
import in.supplybase.backend.common.ApiException;

@Service
public class AuthService {

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository users,
                       RefreshTokenRepository refreshTokens,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalise(request.email());
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account already exists with that email. Try signing in instead.");
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .phone(blankToNull(request.phone()))
                // Self-registration always produces a CLIENT. Staff roles are
                // granted by an admin, never claimed by the person signing up.
                .role(Role.CLIENT)
                .enabled(true)
                .build();

        return issueTokens(users.save(user));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = users.findByEmailIgnoreCase(normalise(request.email()))
                .filter(candidate -> passwordEncoder.matches(request.password(), candidate.getPasswordHash()))
                // One message for "no such email" and for "wrong password", so
                // the endpoint cannot be used to discover who has an account.
                .orElseThrow(() -> ApiException.unauthorized("Wrong email or password. Please try again."));

        if (!user.isEnabled()) {
            throw ApiException.forbidden("This account has been switched off. Please contact us.");
        }
        return issueTokens(user);
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

    private static String normalise(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}

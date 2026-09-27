package in.supplybase.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;

import in.supplybase.backend.auth.dto.AuthResponse;
import in.supplybase.backend.auth.dto.LoginRequest;
import in.supplybase.backend.auth.dto.RegisterRequest;
import in.supplybase.backend.auth.dto.UserResponse;
import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.InMemoryRateLimiter;
import in.supplybase.backend.config.AppProperties;

/**
 * Every collaborator is a mock: no database, no real JWTs, no real BCrypt.
 * The rate limiter and password encoder default to "allow"/"match" in
 * {@link #setUp()} so each test only has to override the one thing it cares
 * about.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceTest {

    @Mock
    private UserRepository users;
    @Mock
    private RefreshTokenRepository refreshTokens;
    @Mock
    private PasswordResetTokenRepository passwordResetTokens;
    @Mock
    private EmailVerificationTokenRepository emailVerificationTokens;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private GoogleTokenVerifier googleVerifier;
    @Mock
    private InMemoryRateLimiter rateLimiter;
    @Mock
    private ObjectProvider<JavaMailSender> mailSender;

    private AppProperties props;
    private AuthService service;

    @BeforeEach
    void setUp() {
        props = new AppProperties(List.of(), null, null, null, null,
                "https://supplybase.example", null, null, null);
        service = new AuthService(users, refreshTokens, passwordResetTokens, emailVerificationTokens,
                passwordEncoder, jwtService, googleVerifier, rateLimiter, props, mailSender);

        when(rateLimiter.tryAcquire(anyString(), anyInt(), any(Duration.class))).thenReturn(true);
        when(jwtService.generateRefreshToken()).thenReturn("raw-refresh-token");
        when(jwtService.hashRefreshToken(anyString())).thenReturn("hashed-token");
        when(jwtService.issueAccessToken(any(User.class))).thenReturn("access-token");
        when(jwtService.accessTokenLifetime()).thenReturn(Duration.ofMinutes(15));
        when(jwtService.refreshTokenLifetime()).thenReturn(Duration.ofDays(30));
        when(passwordEncoder.encode(anyString())).thenReturn("bcrypt-hash");
        // A freshly built User (as register() builds one) has no id yet; give
        // it one on "save", the way an IDENTITY column would, and make
        // findById echo back whatever was last saved — register() immediately
        // re-reads the user by id to send the verification email.
        when(users.save(any(User.class))).thenAnswer(inv -> {
            User saved = inv.getArgument(0);
            if (saved.getId() == null) {
                saved.setId(1L);
            }
            lastSavedUser = saved;
            return saved;
        });
        when(users.findById(any())).thenAnswer(inv -> Optional.ofNullable(lastSavedUser));
        when(refreshTokens.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mailSender.getIfAvailable()).thenReturn(null);
    }

    /** Tracks whatever {@code users.save(...)} last received, for the findById echo above. */
    private User lastSavedUser;

    private User customer(long id) {
        return User.builder()
                .id(id)
                .email("existing@example.com")
                .fullName("Existing User")
                .passwordHash("bcrypt-hash")
                .phone("9820011223")
                .role(Role.CUSTOMER)
                .enabled(true)
                .build();
    }

    @Nested
    @DisplayName("register")
    class Register {

        private RegisterRequest request() {
            return new RegisterRequest("Jane Doe", "jane@example.com", "9820011223", "password123");
        }

        @Test
        @DisplayName("creates a CUSTOMER, emails verification, and issues tokens")
        void success() {
            AuthResponse response = service.register(request(), "1.2.3.4");

            assertThat(response.accessToken()).isEqualTo("access-token");
            assertThat(response.refreshToken()).isEqualTo("raw-refresh-token");
            assertThat(response.user().role()).isEqualTo(Role.CUSTOMER);

            ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
            verify(users).save(captor.capture());
            assertThat(captor.getValue().getRole()).isEqualTo(Role.CUSTOMER);
            assertThat(captor.getValue().isEnabled()).isTrue();

            verify(emailVerificationTokens).save(any(EmailVerificationToken.class));
        }

        @Test
        @DisplayName("is rejected once the per-IP registration rate limit is hit")
        void rateLimited() {
            when(rateLimiter.tryAcquire(anyString(), anyInt(), any(Duration.class))).thenReturn(false);

            assertThatThrownBy(() -> service.register(request(), "1.2.3.4"))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
            verify(users, never()).save(any());
        }

        @Test
        @DisplayName("refuses a duplicate email")
        void duplicateEmail() {
            when(users.existsByEmailIgnoreCase("jane@example.com")).thenReturn(true);

            assertThatThrownBy(() -> service.register(request(), "1.2.3.4"))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.CONFLICT);
            verify(users, never()).save(any());
        }

        @Test
        @DisplayName("refuses a duplicate phone number")
        void duplicatePhone() {
            when(users.existsByPhone("9820011223")).thenReturn(true);

            assertThatThrownBy(() -> service.register(request(), "1.2.3.4"))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.CONFLICT);
            verify(users, never()).save(any());
        }
    }

    @Nested
    @DisplayName("login")
    class Login {

        @Test
        @DisplayName("signs in with the right password")
        void success() {
            User user = customer(1L);
            when(users.findByEmailIgnoreCase("existing@example.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("password123", "bcrypt-hash")).thenReturn(true);

            AuthResponse response = service.login(new LoginRequest("existing@example.com", "password123"));

            assertThat(response.user().email()).isEqualTo("existing@example.com");
            verify(refreshTokens).save(any(RefreshToken.class));
        }

        @Test
        @DisplayName("refuses the wrong password with a generic message")
        void wrongPassword() {
            User user = customer(1L);
            when(users.findByEmailIgnoreCase("existing@example.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("wrong", "bcrypt-hash")).thenReturn(false);

            assertThatThrownBy(() -> service.login(new LoginRequest("existing@example.com", "wrong")))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.UNAUTHORIZED);
        }

        @Test
        @DisplayName("gives the same generic message for an identifier nobody has")
        void unknownIdentifier() {
            when(users.findByEmailIgnoreCase("ghost@example.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.login(new LoginRequest("ghost@example.com", "whatever1")))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.UNAUTHORIZED);
        }

        @Test
        @DisplayName("blocks a disabled account after the password checks out")
        void disabledAccount() {
            User user = customer(1L);
            user.setEnabled(false);
            when(users.findByEmailIgnoreCase("existing@example.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("password123", "bcrypt-hash")).thenReturn(true);

            assertThatThrownBy(() -> service.login(new LoginRequest("existing@example.com", "password123")))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.FORBIDDEN);
        }

        @Test
        @DisplayName("is rejected once the per-identifier login rate limit is hit")
        void rateLimited() {
            when(rateLimiter.tryAcquire(anyString(), anyInt(), any(Duration.class))).thenReturn(false);

            assertThatThrownBy(() -> service.login(new LoginRequest("existing@example.com", "password123")))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        }
    }

    @Nested
    @DisplayName("loginWithGoogle")
    class GoogleLogin {

        private GoogleIdToken.Payload payload(String sub, String email) {
            GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
            payload.setSubject(sub);
            payload.setEmail(email);
            payload.set("name", "Jane Doe");
            payload.set("picture", "https://example.com/pic.png");
            return payload;
        }

        @Test
        @DisplayName("creates a new CUSTOMER when neither the sub nor the email is known")
        void newAccount() {
            when(googleVerifier.verify("credential")).thenReturn(payload("google-sub-1", "new@example.com"));
            when(users.findByGoogleSub("google-sub-1")).thenReturn(Optional.empty());
            when(users.findByEmailIgnoreCase("new@example.com")).thenReturn(Optional.empty());

            AuthResponse response = service.loginWithGoogle("credential");

            ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
            verify(users).save(captor.capture());
            User saved = captor.getValue();
            assertThat(saved.getGoogleSub()).isEqualTo("google-sub-1");
            assertThat(saved.getRole()).isEqualTo(Role.CUSTOMER);
            assertThat(saved.isEmailVerified()).isTrue();
            assertThat(response.user().email()).isEqualTo("new@example.com");
        }

        @Test
        @DisplayName("links a verified Google email to an existing password account")
        void linksExistingEmailAccount() {
            User existing = customer(5L);
            existing.setGoogleSub(null);
            when(googleVerifier.verify("credential"))
                    .thenReturn(payload("google-sub-2", existing.getEmail()));
            when(users.findByGoogleSub("google-sub-2")).thenReturn(Optional.empty());
            when(users.findByEmailIgnoreCase(existing.getEmail())).thenReturn(Optional.of(existing));

            service.loginWithGoogle("credential");

            assertThat(existing.getGoogleSub()).isEqualTo("google-sub-2");
            assertThat(existing.isEmailVerified()).isTrue();
            verify(users).save(existing);
        }

        @Test
        @DisplayName("signs straight in when the Google sub is already linked")
        void alreadyLinkedSub() {
            User existing = customer(5L);
            existing.setGoogleSub("google-sub-3");
            when(googleVerifier.verify("credential"))
                    .thenReturn(payload("google-sub-3", existing.getEmail()));
            when(users.findByGoogleSub("google-sub-3")).thenReturn(Optional.of(existing));

            service.loginWithGoogle("credential");

            verify(users, never()).findByEmailIgnoreCase(anyString());
            verify(users).save(existing);
        }

        @Test
        @DisplayName("blocks sign-in for a disabled linked account")
        void disabledAccount() {
            User existing = customer(5L);
            existing.setEnabled(false);
            existing.setGoogleSub("google-sub-4");
            when(googleVerifier.verify("credential"))
                    .thenReturn(payload("google-sub-4", existing.getEmail()));
            when(users.findByGoogleSub("google-sub-4")).thenReturn(Optional.of(existing));

            assertThatThrownBy(() -> service.loginWithGoogle("credential"))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.FORBIDDEN);
        }
    }

    @Nested
    @DisplayName("refresh")
    class Refresh {

        @Test
        @DisplayName("rotates the presented token and issues a fresh pair")
        void successRotatesToken() {
            User user = customer(1L);
            RefreshToken stored = RefreshToken.builder()
                    .id(10L).user(user).tokenHash("hashed-token")
                    .expiresAt(Instant.now().plusSeconds(3600)).revoked(false).build();
            when(refreshTokens.findByTokenHash("hashed-token")).thenReturn(Optional.of(stored));

            AuthResponse response = service.refresh("raw-refresh-token");

            assertThat(stored.isRevoked()).isTrue();
            assertThat(response.accessToken()).isEqualTo("access-token");
            verify(refreshTokens, times(2)).save(any(RefreshToken.class));
        }

        @Test
        @DisplayName("refuses a token that is not on record")
        void notFound() {
            when(refreshTokens.findByTokenHash("hashed-token")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.refresh("raw-refresh-token"))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.UNAUTHORIZED);
        }

        @Test
        @DisplayName("refuses an expired or already-revoked token")
        void expiredOrRevoked() {
            RefreshToken stored = RefreshToken.builder()
                    .id(10L).user(customer(1L)).tokenHash("hashed-token")
                    .expiresAt(Instant.now().minusSeconds(60)).revoked(false).build();
            when(refreshTokens.findByTokenHash("hashed-token")).thenReturn(Optional.of(stored));

            assertThatThrownBy(() -> service.refresh("raw-refresh-token"))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.UNAUTHORIZED);
        }

        @Test
        @DisplayName("is rejected once the refresh rate limit is hit")
        void rateLimited() {
            when(rateLimiter.tryAcquire(anyString(), anyInt(), any(Duration.class))).thenReturn(false);

            assertThatThrownBy(() -> service.refresh("raw-refresh-token"))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        }
    }

    @Nested
    @DisplayName("logout")
    class Logout {

        @Test
        @DisplayName("revokes the token when it is found")
        void revokesFoundToken() {
            RefreshToken stored = RefreshToken.builder().id(1L).tokenHash("hashed-token").revoked(false).build();
            when(refreshTokens.findByTokenHash("hashed-token")).thenReturn(Optional.of(stored));

            service.logout("raw-refresh-token");

            assertThat(stored.isRevoked()).isTrue();
            verify(refreshTokens).save(stored);
        }

        @Test
        @DisplayName("does nothing when the token is unknown")
        void noOpWhenNotFound() {
            when(refreshTokens.findByTokenHash("hashed-token")).thenReturn(Optional.empty());

            service.logout("raw-refresh-token");

            verify(refreshTokens, never()).save(any());
        }
    }

    @Test
    @DisplayName("logoutEverywhere revokes every refresh token for the user")
    void logoutEverywhereDelegatesToRepo() {
        service.logoutEverywhere(42L);
        verify(refreshTokens).revokeAllForUser(42L);
    }

    @Nested
    @DisplayName("me")
    class Me {

        @Test
        @DisplayName("returns the account when it exists")
        void found() {
            when(users.findById(1L)).thenReturn(Optional.of(customer(1L)));
            UserResponse response = service.me(1L);
            assertThat(response.email()).isEqualTo("existing@example.com");
        }

        @Test
        @DisplayName("404s when it does not")
        void notFound() {
            when(users.findById(99L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.me(99L))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.NOT_FOUND);
        }
    }

    @Nested
    @DisplayName("forgotPassword")
    class ForgotPassword {

        @Test
        @DisplayName("emails a reset token to an existing password-holding account")
        void existingUserSendsToken() {
            User user = customer(1L);
            when(users.findByEmailIgnoreCase("existing@example.com")).thenReturn(Optional.of(user));

            service.forgotPassword("existing@example.com");

            verify(passwordResetTokens).deleteByUserIdAndUsedAtIsNull(1L);
            verify(passwordResetTokens).save(any(PasswordResetToken.class));
        }

        @Test
        @DisplayName("silently does nothing for an identifier nobody has")
        void unknownIdentifierSilent() {
            when(users.findByEmailIgnoreCase("ghost@example.com")).thenReturn(Optional.empty());

            service.forgotPassword("ghost@example.com");

            verify(passwordResetTokens, never()).save(any());
        }

        @Test
        @DisplayName("silently does nothing for a Google-only account")
        void googleOnlyAccountSilent() {
            User googleOnly = customer(1L);
            googleOnly.setPasswordHash(null);
            when(users.findByEmailIgnoreCase("existing@example.com")).thenReturn(Optional.of(googleOnly));

            service.forgotPassword("existing@example.com");

            verify(passwordResetTokens, never()).save(any());
        }

        @Test
        @DisplayName("is rejected once the forgot-password rate limit is hit")
        void rateLimited() {
            when(rateLimiter.tryAcquire(anyString(), anyInt(), any(Duration.class))).thenReturn(false);

            assertThatThrownBy(() -> service.forgotPassword("existing@example.com"))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        }
    }

    @Nested
    @DisplayName("resetPassword")
    class ResetPassword {

        @Test
        @DisplayName("sets the new password and logs every session out")
        void successLogsOutEverywhere() {
            User user = customer(1L);
            PasswordResetToken stored = PasswordResetToken.builder()
                    .id(1L).user(user).tokenHash("hashed-token")
                    .expiresAt(Instant.now().plusSeconds(3600)).build();
            when(passwordResetTokens.findByTokenHash("hashed-token")).thenReturn(Optional.of(stored));

            service.resetPassword("raw-token", "newPassword1");

            assertThat(user.getPasswordHash()).isEqualTo("bcrypt-hash");
            assertThat(stored.getUsedAt()).isNotNull();
            verify(refreshTokens).revokeAllForUser(1L);
        }

        @Test
        @DisplayName("refuses an invalid, expired or already-used token")
        void invalidOrExpiredToken() {
            when(passwordResetTokens.findByTokenHash("hashed-token")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.resetPassword("raw-token", "newPassword1"))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.BAD_REQUEST);
            verify(refreshTokens, never()).revokeAllForUser(any());
        }
    }

    @Nested
    @DisplayName("sendVerificationEmail")
    class SendVerificationEmail {

        @Test
        @DisplayName("creates a token and emails it when unverified")
        void createsToken() {
            User user = customer(1L);
            user.setEmailVerified(false);
            when(users.findById(1L)).thenReturn(Optional.of(user));

            service.sendVerificationEmail(1L);

            verify(emailVerificationTokens).deleteByUserIdAndUsedAtIsNull(1L);
            verify(emailVerificationTokens).save(any(EmailVerificationToken.class));
        }

        @Test
        @DisplayName("does nothing when the account is already verified")
        void alreadyVerifiedNoOp() {
            User user = customer(1L);
            user.setEmailVerified(true);
            when(users.findById(1L)).thenReturn(Optional.of(user));

            service.sendVerificationEmail(1L);

            verify(emailVerificationTokens, never()).save(any());
        }

        @Test
        @DisplayName("404s for an unknown user id")
        void userNotFound() {
            when(users.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.sendVerificationEmail(1L))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.NOT_FOUND);
        }
    }

    @Nested
    @DisplayName("verifyEmail")
    class VerifyEmail {

        @Test
        @DisplayName("marks the account verified and the token used")
        void success() {
            User user = customer(1L);
            user.setEmailVerified(false);
            EmailVerificationToken stored = EmailVerificationToken.builder()
                    .id(1L).user(user).tokenHash("hashed-token")
                    .expiresAt(Instant.now().plusSeconds(3600)).build();
            when(emailVerificationTokens.findByTokenHash("hashed-token")).thenReturn(Optional.of(stored));

            service.verifyEmail("raw-token");

            assertThat(user.isEmailVerified()).isTrue();
            assertThat(stored.getUsedAt()).isNotNull();
        }

        @Test
        @DisplayName("refuses an invalid, expired or already-used token")
        void invalidOrExpiredToken() {
            when(emailVerificationTokens.findByTokenHash("hashed-token")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.verifyEmail("raw-token"))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.BAD_REQUEST);
        }
    }

    @Test
    @DisplayName("listUsers delegates straight to the repository search")
    void listUsersDelegatesToRepository() {
        Page<User> page = new PageImpl<>(List.of(customer(1L)));
        when(users.search(Role.CUSTOMER, "jane", PageRequest.of(0, 20))).thenReturn(page);

        Page<UserResponse> result = service.listUsers(Role.CUSTOMER, "jane", PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).email()).isEqualTo("existing@example.com");
    }

    @Nested
    @DisplayName("updateRole")
    class UpdateRole {

        @Test
        @DisplayName("promotes a different user")
        void success() {
            User target = customer(2L);
            when(users.findById(2L)).thenReturn(Optional.of(target));

            UserResponse response = service.updateRole(2L, Role.PROFESSIONAL, 1L);

            assertThat(response.role()).isEqualTo(Role.PROFESSIONAL);
        }

        @Test
        @DisplayName("refuses to let a caller change their own role")
        void selfChangeBlocked() {
            assertThatThrownBy(() -> service.updateRole(1L, Role.ADMIN, 1L))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.BAD_REQUEST);
            verify(users, never()).findById(any());
        }

        @Test
        @DisplayName("404s for an unknown target")
        void notFound() {
            when(users.findById(2L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.updateRole(2L, Role.ADMIN, 1L))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.NOT_FOUND);
        }
    }

    @Nested
    @DisplayName("updateStatus")
    class UpdateStatus {

        @Test
        @DisplayName("disables a different user")
        void success() {
            User target = customer(2L);
            when(users.findById(2L)).thenReturn(Optional.of(target));

            UserResponse response = service.updateStatus(2L, false, 1L);

            assertThat(response.hasPassword()).isTrue();
            assertThat(target.isEnabled()).isFalse();
        }

        @Test
        @DisplayName("refuses to let a caller disable their own account")
        void selfDisableBlocked() {
            assertThatThrownBy(() -> service.updateStatus(1L, false, 1L))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.BAD_REQUEST);
            verify(users, never()).findById(any());
        }

        @Test
        @DisplayName("404s for an unknown target")
        void notFound() {
            when(users.findById(2L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.updateStatus(2L, false, 1L))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.NOT_FOUND);
        }
    }
}

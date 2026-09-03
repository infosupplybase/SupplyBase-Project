package in.supplybase.backend.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import in.supplybase.backend.auth.dto.AuthResponse;
import in.supplybase.backend.auth.dto.ForgotPasswordRequest;
import in.supplybase.backend.auth.dto.GoogleLoginRequest;
import in.supplybase.backend.auth.dto.LoginRequest;
import in.supplybase.backend.auth.dto.RefreshRequest;
import in.supplybase.backend.auth.dto.RegisterRequest;
import in.supplybase.backend.auth.dto.ResetPasswordRequest;
import in.supplybase.backend.auth.dto.UpdateUserRoleRequest;
import in.supplybase.backend.auth.dto.UpdateUserStatusRequest;
import in.supplybase.backend.auth.dto.UserResponse;
import in.supplybase.backend.auth.dto.VerifyEmailRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final CurrentUser currentUser;

    public AuthController(AuthService authService, CurrentUser currentUser) {
        this.authService = authService;
        this.currentUser = currentUser;
    }

    @PostMapping("/api/auth/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request,
                                                 HttpServletRequest httpRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.register(request, httpRequest.getRemoteAddr()));
    }

    @PostMapping("/api/auth/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/api/auth/google")
    public AuthResponse google(@Valid @RequestBody GoogleLoginRequest request) {
        return authService.loginWithGoogle(request.credential());
    }

    @PostMapping("/api/auth/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request.refreshToken());
    }

    @PostMapping("/api/auth/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshRequest request) {
        authService.logout(request.refreshToken());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/auth/me")
    public UserResponse me() {
        return authService.me(currentUser.require().id());
    }

    /**
     * Always 200, regardless of whether the identifier resolves to an
     * account — the shape of this endpoint is the whole point of it. Any
     * unexpected failure is logged and swallowed rather than surfaced, so it
     * can never be used to tell a caller apart from a genuine "email sent".
     */
    @PostMapping("/api/auth/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            authService.forgotPassword(request.identifier());
        } catch (Exception ex) {
            log.warn("forgot-password failed for a request — responding 200 regardless", ex);
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/auth/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/auth/send-verification")
    public ResponseEntity<Void> sendVerification() {
        authService.sendVerificationEmail(currentUser.require().id());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/auth/verify-email")
    public ResponseEntity<Void> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(request.token());
        return ResponseEntity.noContent().build();
    }

    /* ----------------------------------------------------------- staff */

    @GetMapping("/api/admin/users")
    public Page<UserResponse> listUsers(@RequestParam(required = false) Role role,
                                        @RequestParam(required = false) String q,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size) {
        return authService.listUsers(role, q, PageRequest.of(page, Math.min(size, 100)));
    }

    @PatchMapping("/api/admin/users/{id}/role")
    public UserResponse updateRole(@PathVariable Long id, @Valid @RequestBody UpdateUserRoleRequest request) {
        return authService.updateRole(id, request.role(), currentUser.require().id());
    }

    @PatchMapping("/api/admin/users/{id}/status")
    public UserResponse updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateUserStatusRequest request) {
        return authService.updateStatus(id, request.enabled(), currentUser.require().id());
    }
}

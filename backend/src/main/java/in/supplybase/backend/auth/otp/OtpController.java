package in.supplybase.backend.auth.otp;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import in.supplybase.backend.auth.AuthService;
import in.supplybase.backend.auth.dto.AuthResponse;
import in.supplybase.backend.common.PhoneNumbers;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Login with a code sent by SMS (2Factor.in).
 *
 *   POST /api/auth/otp/send    {phone}                      -> 204, code sent
 *   POST /api/auth/otp/verify  {phone, code}                -> AuthResponse, or
 *                              {"needsDetails": true} when no account has this number
 *   POST /api/auth/otp/verify  {phone, code, fullName, email} -> creates the account, AuthResponse
 */
@RestController
public class OtpController {

    private final PhoneOtpService otp;
    private final AuthService authService;

    public OtpController(PhoneOtpService otp, AuthService authService) {
        this.otp = otp;
        this.authService = authService;
    }

    public record SendRequest(@NotBlank(message = "Please enter your mobile number") String phone) {
    }

    public record VerifyRequest(
            @NotBlank(message = "Please enter your mobile number") String phone,
            @NotBlank(message = "Please enter the code") String code,
            @Size(max = 120, message = "That name is too long") String fullName,
            @Email(message = "That email address does not look right")
            @Size(max = 190, message = "That email address is too long") String email) {
    }

    /** Lets the site hide the OTP option while no 2Factor key is set. */
    @GetMapping("/api/auth/otp/status")
    public Map<String, Boolean> status() {
        return Map.of("enabled", otp.enabled());
    }

    @PostMapping("/api/auth/otp/send")
    public ResponseEntity<Void> send(@Valid @RequestBody SendRequest request, HttpServletRequest http) {
        otp.send(PhoneNumbers.normalise(request.phone()), http.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/auth/otp/verify")
    public ResponseEntity<?> verify(@Valid @RequestBody VerifyRequest request) {
        String phone = PhoneNumbers.normalise(request.phone());
        otp.verify(phone, request.code() == null ? null : request.code().trim());
        AuthResponse auth = authService.loginWithVerifiedPhone(phone, request.fullName(), request.email());
        if (auth == null) {
            return ResponseEntity.ok(Map.of("needsDetails", true));
        }
        otp.consume(phone);
        return ResponseEntity.ok(auth);
    }
}

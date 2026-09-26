package in.supplybase.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyOtpRequest(
        @NotBlank
        @Email
        String email,

        @NotBlank
        @Pattern(regexp = "\\d{6}", message = "OTP must be 6 digits")
        String otp
) {
}
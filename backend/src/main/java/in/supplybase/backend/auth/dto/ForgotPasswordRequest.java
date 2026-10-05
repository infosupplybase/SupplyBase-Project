package in.supplybase.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;

/** Request for a password reset link. */
public record ForgotPasswordRequest(
        @NotBlank(message = "Please enter your email or phone number") String identifier,
        String app) {
}
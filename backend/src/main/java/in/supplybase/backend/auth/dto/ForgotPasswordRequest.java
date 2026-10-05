package in.supplybase.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Same `identifier` shape as {@link LoginRequest} — an email or a phone number.
 * `app` is "partner" from the partners site, so its reset link opens there.
 */
public record ForgotPasswordRequest(
        @NotBlank(message = "Please enter your email or phone number") String identifier,
        String app) {
}

package in.supplybase.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * `identifier` rather than `email` because either will do — the field on the
 * sign-in form accepts an email address or a ten-digit mobile number, and
 * naming it `email` would be a lie in half the requests.
 */
public record LoginRequest(
        @NotBlank(message = "Please enter your email or phone number") String identifier,
        @NotBlank(message = "Please enter your password") String password) {
}

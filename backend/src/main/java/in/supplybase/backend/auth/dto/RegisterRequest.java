package in.supplybase.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Please enter your name")
        @Size(max = 120, message = "That name is too long")
        String fullName,

        @NotBlank(message = "Please enter your email")
        @Email(message = "That email address does not look right")
        @Size(max = 190, message = "That email address is too long")
        String email,

        @Pattern(regexp = "^$|^[0-9+\\-\\s()]{7,20}$", message = "That phone number does not look right")
        String phone,

        @NotBlank(message = "Please choose a password")
        @Size(min = 8, max = 72, message = "Use between 8 and 72 characters")
        // 72 is BCrypt's hard limit: it silently ignores anything beyond the
        // 72nd byte, so a longer password would give a false sense of strength.
        String password) {
}

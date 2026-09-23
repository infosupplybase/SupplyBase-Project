package in.supplybase.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "That reset link is missing its token") String token,

        @NotBlank(message = "Please choose a password")
        @Size(min = 8, max = 72, message = "Use between 8 and 72 characters")
        // 72 is BCrypt's hard limit: it silently ignores anything beyond the
        // 72nd byte, so a longer password would give a false sense of strength.
        String newPassword) {
}

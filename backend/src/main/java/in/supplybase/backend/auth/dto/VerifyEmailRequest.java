package in.supplybase.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyEmailRequest(
        @NotBlank(message = "That verification link is missing its token") String token) {
}

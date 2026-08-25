package in.supplybase.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Please enter your email") String email,
        @NotBlank(message = "Please enter your password") String password) {
}

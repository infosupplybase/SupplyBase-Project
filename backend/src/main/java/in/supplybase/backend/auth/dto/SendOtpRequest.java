package in.supplybase.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record SendOtpRequest(
        @NotBlank
        @Email
        String email
) {
}
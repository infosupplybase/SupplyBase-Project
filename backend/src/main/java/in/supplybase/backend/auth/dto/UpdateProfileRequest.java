package in.supplybase.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Self-service profile edit — name and phone only. Email and role change through other flows. */
public record UpdateProfileRequest(
        @NotBlank(message = "Please enter your name")
        @Size(max = 120, message = "That name is too long")
        String fullName,

        @NotBlank(message = "Please enter your phone number")
        @Pattern(regexp = "^[0-9+\\-\\s()]{7,20}$", message = "That phone number does not look right")
        String phone) {
}

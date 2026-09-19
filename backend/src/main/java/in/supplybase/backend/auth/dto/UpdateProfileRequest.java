package in.supplybase.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Self-service profile edit. Email and role change through other flows. */
public record UpdateProfileRequest(
        @NotBlank(message = "Please enter your name")
        @Size(max = 120, message = "That name is too long")
        String fullName,

        @NotBlank(message = "Please enter your phone number")
        @Pattern(regexp = "^[0-9+\\-\\s()]{7,20}$", message = "That phone number does not look right")
        String phone,

        String gender,

        @NotBlank(message = "Please enter your address")
        @Size(max = 200, message = "Address Line 1 is too long")
        String addressLine1,

        @Size(max = 200, message = "Address Line 2 is too long")
        String addressLine2,

        @NotBlank(message = "Please enter your city")
        @Size(max = 100, message = "City name is too long")
        String city,

        @NotBlank(message = "Please enter your PIN code")
        @Pattern(regexp = "^[0-9]{6}$", message = "Enter a valid 6-digit PIN code")
        String pinCode,

        @Size(max = 150, message = "Landmark is too long")
        String landmark) {
}
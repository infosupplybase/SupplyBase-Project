package in.supplybase.backend.enquiry.dto;

import in.supplybase.backend.enquiry.EnquirySource;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Mirrors the fields of the site's quote form, so the React form can post its
 * state almost verbatim.
 */
public record CreateEnquiryRequest(
        @NotBlank(message = "Please enter your name")
        @Size(max = 120, message = "That name is too long")
        String name,

        @NotBlank(message = "Please enter your phone number")
        @Pattern(regexp = "^[0-9+\\-\\s()]{7,20}$", message = "That phone number does not look right")
        String phone,

        @Email(message = "That email address does not look right")
        @Size(max = 190)
        String email,

        @Size(max = 60) String projectType,
        @Size(max = 60) String service,
        @Size(max = 160) String location,
        @Size(max = 60) String budget,

        @Size(max = 5000, message = "Please keep the description under 5000 characters")
        String description,

        EnquirySource source) {
}

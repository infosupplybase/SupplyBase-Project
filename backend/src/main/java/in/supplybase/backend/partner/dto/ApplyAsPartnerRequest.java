package in.supplybase.backend.partner.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * A professional applying to work with SupplyBase. Creates the login and the
 * application in one step; there is no role field, because nobody applying
 * gets to choose what they are approved as.
 */
public record ApplyAsPartnerRequest(
        @NotBlank(message = "Please enter your name")
        @Size(max = 120, message = "That name is too long")
        String fullName,

        @NotBlank(message = "Please enter your email")
        @Email(message = "That email address does not look right")
        @Size(max = 190, message = "That email address is too long")
        String email,

        @NotBlank(message = "Please enter your phone number")
        @Pattern(regexp = "^[0-9+\\-\\s()]{7,20}$", message = "That phone number does not look right")
        String phone,

        @NotBlank(message = "Please choose a password")
        @Size(min = 8, max = 72, message = "Use between 8 and 72 characters")
        String password,

        @NotBlank(message = "Please choose the work you do")
        @Size(max = 60, message = "That trade does not look right")
        String primaryTrade,

        @NotNull(message = "Please enter your years of experience")
        @Min(value = 0, message = "Experience cannot be negative")
        @Max(value = 60, message = "That looks too high — please check")
        Integer experienceYears,

        @NotBlank(message = "Please enter your city")
        @Size(max = 100, message = "That city name is too long")
        String city,

        @Size(max = 300, message = "Please keep the areas under 300 characters")
        String serviceAreas,

        @Size(max = 120, message = "Please keep the languages under 120 characters")
        String languages) {
}

package in.supplybase.backend.partner.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * A signed-in customer applying to work with SupplyBase on the account they
 * already have: the work details of {@link ApplyAsPartnerRequest}, without
 * the name, email, phone and password the account already holds.
 */
public record ApplyWithAccountRequest(
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

package in.supplybase.backend.booking.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * What a customer may change on their own booking after placing it — contact
 * details and the visit address. Not the service items or price: those are
 * locked in at booking time (see BookingService.storeAnswers) and changing
 * them here would leave a paid or reserved amount out of sync with the cart.
 */
public record UpdateMyBookingRequest(
        @NotBlank(message = "Please enter your name") @Size(max = 120) String name,
        @NotBlank(message = "Please enter your mobile number") String phone,
        String whatsapp,
        @Email(message = "That email address does not look right") @Size(max = 190) String email,

        @NotBlank(message = "Please enter your address") @Size(max = 400) String address,
        @NotBlank(message = "Please enter your city") @Size(max = 80) String city,

        @Pattern(regexp = "^[1-9][0-9]{5}$", message = "Enter a 6-digit pincode")
        String pincode) {
}

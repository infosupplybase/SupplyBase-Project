package in.supplybase.backend.booking.dto;

import jakarta.validation.constraints.Size;

/** A customer cancelling their own booking; the reason is optional. */
public record CancelMyBookingRequest(
        @Size(max = 250, message = "Please keep the reason under 250 characters") String reason) {
}

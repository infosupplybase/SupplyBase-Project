package in.supplybase.backend.booking.dto;

import in.supplybase.backend.booking.BookingStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateBookingRequest(
        @NotNull(message = "A status is required") BookingStatus status,
        @Size(max = 4000) String adminNotes) {
}

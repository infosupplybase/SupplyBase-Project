package in.supplybase.backend.booking.dto;

import in.supplybase.backend.booking.BookingStatus;
import jakarta.validation.constraints.NotNull;

public record AdvanceBookingStatusRequest(
        @NotNull(message = "A status is required") BookingStatus status) {
}

package in.supplybase.backend.appointment.dto;

import java.time.LocalDate;
import java.util.List;

public record DayAvailabilityResponse(
        LocalDate date, boolean open, String closedReason, List<SlotResponse> slots) {
}

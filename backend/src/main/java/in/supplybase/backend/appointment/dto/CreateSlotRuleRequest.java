package in.supplybase.backend.appointment.dto;

import java.time.LocalTime;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * endTime.isAfter(startTime) is a cross-field check and is validated in
 * AppointmentService, not here.
 */
public record CreateSlotRuleRequest(
        Long categoryId,
        @Min(1) @Max(7) int dayOfWeek,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        @Min(5) int slotMinutes,
        @Min(1) int maxBookings) {
}

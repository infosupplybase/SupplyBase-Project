package in.supplybase.backend.appointment.dto;

import java.time.LocalTime;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Same shape as CreateSlotRuleRequest. A separate type rather than reusing it
 * so the two endpoints can drift independently later (e.g. a PATCH-style
 * partial update) without one forcing a change on the other.
 */
public record UpdateSlotRuleRequest(
        Long categoryId,
        @Min(1) @Max(7) int dayOfWeek,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        @Min(5) int slotMinutes,
        @Min(1) int maxBookings) {
}

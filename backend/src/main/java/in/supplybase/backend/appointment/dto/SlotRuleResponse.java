package in.supplybase.backend.appointment.dto;

import java.time.LocalTime;

import in.supplybase.backend.appointment.AppointmentSlotRule;

public record SlotRuleResponse(
        Long id, Long categoryId, int dayOfWeek,
        LocalTime startTime, LocalTime endTime,
        int slotMinutes, int maxBookings, boolean active) {

    public static SlotRuleResponse from(AppointmentSlotRule r) {
        return new SlotRuleResponse(
                r.getId(), r.getCategoryId(), r.getDayOfWeek(),
                r.getStartTime(), r.getEndTime(),
                r.getSlotMinutes(), r.getMaxBookings(), r.isActive());
    }
}

package in.supplybase.backend.appointment.dto;

import java.time.LocalDate;

import in.supplybase.backend.appointment.AppointmentBlackout;

public record BlackoutResponse(Long id, LocalDate day, String reason) {

    public static BlackoutResponse from(AppointmentBlackout b) {
        return new BlackoutResponse(b.getId(), b.getDay(), b.getReason());
    }
}

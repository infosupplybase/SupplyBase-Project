package in.supplybase.backend.appointment.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateBlackoutRequest(
        @NotNull LocalDate day,
        @Size(max = 160) String reason) {
}

package in.supplybase.backend.booking.dto;

import jakarta.validation.constraints.NotNull;

public record AssignProfessionalRequest(
        @NotNull(message = "A professional is required") Long professionalId) {
}

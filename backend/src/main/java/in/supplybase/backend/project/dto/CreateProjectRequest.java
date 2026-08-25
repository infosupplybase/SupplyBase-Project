package in.supplybase.backend.project.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateProjectRequest(
        @NotBlank(message = "A project name is required")
        @Size(max = 160) String name,

        Long clientUserId,

        @Size(max = 40) String category,
        @Size(max = 160) String location,
        @Size(max = 60) String area,
        String description,

        @DecimalMin(value = "0.00", message = "A contract value cannot be negative")
        BigDecimal contractValue,

        LocalDate startDate,
        LocalDate expectedEndDate) {
}

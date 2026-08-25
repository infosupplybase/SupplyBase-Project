package in.supplybase.backend.project.dto;

import java.time.LocalDate;

import in.supplybase.backend.project.StageStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpsertStageRequest(
        @Min(value = 1, message = "Stage numbers start at 1") int stageNo,
        @NotBlank(message = "A stage title is required") @Size(max = 120) String title,
        String description,
        @NotNull StageStatus status,
        LocalDate startedOn,
        LocalDate completedOn) {
}

package in.supplybase.backend.project.dto;

import java.time.LocalDate;

import in.supplybase.backend.project.ProjectStage;
import in.supplybase.backend.project.StageStatus;

public record StageResponse(
        Long id, int stageNo, String title, String description,
        StageStatus status, LocalDate startedOn, LocalDate completedOn) {

    public static StageResponse from(ProjectStage s) {
        return new StageResponse(s.getId(), s.getStageNo(), s.getTitle(), s.getDescription(),
                s.getStatus(), s.getStartedOn(), s.getCompletedOn());
    }
}

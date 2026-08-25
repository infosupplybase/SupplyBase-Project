package in.supplybase.backend.project.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import in.supplybase.backend.common.Money;
import in.supplybase.backend.project.Project;
import in.supplybase.backend.project.ProjectStatus;

public record ProjectResponse(
        Long id, String code, String name, String category, String location, String area,
        String description, ProjectStatus status,
        BigDecimal contractValue, LocalDate startDate, LocalDate expectedEndDate,
        String clientName, List<StageResponse> stages) {

    public static ProjectResponse from(Project p, List<StageResponse> stages) {
        return new ProjectResponse(p.getId(), p.getCode(), p.getName(), p.getCategory(),
                p.getLocation(), p.getArea(), p.getDescription(), p.getStatus(),
                Money.paiseToRupees(p.getContractValuePaise()), p.getStartDate(),
                p.getExpectedEndDate(),
                p.getClient() == null ? null : p.getClient().getFullName(),
                stages);
    }
}

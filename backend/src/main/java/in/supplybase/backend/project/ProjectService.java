package in.supplybase.backend.project;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import in.supplybase.backend.auth.AuthenticatedUser;
import in.supplybase.backend.auth.UserRepository;
import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.Money;
import in.supplybase.backend.common.Reference;
import in.supplybase.backend.project.dto.CreateProjectRequest;
import in.supplybase.backend.project.dto.ProjectResponse;
import in.supplybase.backend.project.dto.StageResponse;
import in.supplybase.backend.project.dto.UpsertStageRequest;

@Service
public class ProjectService {

    private final ProjectRepository projects;
    private final UserRepository users;

    public ProjectService(ProjectRepository projects, UserRepository users) {
        this.projects = projects;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> myProjects(Long clientId) {
        return projects.findByClientIdOrderByCreatedAtDesc(clientId).stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Reads one project, enforcing ownership.
     *
     * A client asking for a project that is not theirs gets 404, not 403.
     * 403 would confirm the project exists, which is itself information they
     * are not entitled to.
     */
    @Transactional(readOnly = true)
    public ProjectResponse get(Long projectId, AuthenticatedUser viewer) {
        Project project = projects.findWithStagesById(projectId)
                .orElseThrow(() -> ApiException.notFound("That project"));

        if (!viewer.isStaff()
                && (project.getClient() == null || !project.getClient().getId().equals(viewer.id()))) {
            throw ApiException.notFound("That project");
        }
        return toResponse(project);
    }

    @Transactional(readOnly = true)
    public Page<ProjectResponse> listAll(Pageable pageable) {
        return projects.findAllByOrderByCreatedAtDesc(pageable).map(this::toResponse);
    }

    @Transactional
    public ProjectResponse create(CreateProjectRequest request) {
        Project project = Project.builder()
                .code(uniqueCode())
                .name(request.name().trim())
                .category(request.category())
                .location(request.location())
                .area(request.area())
                .description(request.description())
                .status(ProjectStatus.PLANNING)
                .contractValuePaise(request.contractValue() == null
                        ? 0L : Money.rupeesToPaise(request.contractValue()))
                .startDate(request.startDate())
                .expectedEndDate(request.expectedEndDate())
                .build();

        if (request.clientUserId() != null) {
            project.setClient(users.findById(request.clientUserId())
                    .orElseThrow(() -> ApiException.badRequest("That client account does not exist.")));
        }
        return toResponse(projects.save(project));
    }

    @Transactional
    public ProjectResponse upsertStage(Long projectId, UpsertStageRequest request) {
        Project project = projects.findWithStagesById(projectId)
                .orElseThrow(() -> ApiException.notFound("That project"));

        ProjectStage stage = project.getStages().stream()
                .filter(s -> s.getStageNo() == request.stageNo())
                .findFirst()
                .orElse(null);

        if (stage == null) {
            stage = ProjectStage.builder().stageNo(request.stageNo()).build();
            project.addStage(stage);
        }
        stage.setTitle(request.title().trim());
        stage.setDescription(request.description());
        stage.setStatus(request.status());
        stage.setStartedOn(request.startedOn());
        stage.setCompletedOn(request.completedOn());

        return toResponse(projects.save(project));
    }

    @Transactional
    public ProjectResponse setStatus(Long projectId, ProjectStatus status) {
        Project project = projects.findWithStagesById(projectId)
                .orElseThrow(() -> ApiException.notFound("That project"));
        project.setStatus(status);
        return toResponse(projects.save(project));
    }

    private ProjectResponse toResponse(Project project) {
        List<StageResponse> stages = project.getStages().stream()
                .map(StageResponse::from)
                .toList();
        return ProjectResponse.from(project, stages);
    }

    /** Retries rather than trusting randomness — the codes are only 4 characters. */
    private String uniqueCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            String code = Reference.forProject();
            if (!projects.existsByCode(code)) {
                return code;
            }
        }
        throw new IllegalStateException("Could not allocate a unique project code");
    }
}

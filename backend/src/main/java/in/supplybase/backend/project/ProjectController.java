package in.supplybase.backend.project;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import in.supplybase.backend.auth.CurrentUser;
import in.supplybase.backend.project.dto.CreateProjectRequest;
import in.supplybase.backend.project.dto.ProjectResponse;
import in.supplybase.backend.project.dto.UpsertStageRequest;
import jakarta.validation.Valid;

@RestController
public class ProjectController {

    private final ProjectService service;
    private final CurrentUser currentUser;

    public ProjectController(ProjectService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    /** What the client dashboard calls. Returns only the caller's projects. */
    @GetMapping("/api/projects/mine")
    public List<ProjectResponse> mine() {
        return service.myProjects(currentUser.require().id());
    }

    @GetMapping("/api/projects/{id}")
    public ProjectResponse get(@PathVariable Long id) {
        return service.get(id, currentUser.require());
    }

    /* ----------------------------------------------------------- staff */

    @GetMapping("/api/admin/projects")
    public Page<ProjectResponse> list(@RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size) {
        return service.listAll(PageRequest.of(page, Math.min(size, 100)));
    }

    @PostMapping("/api/admin/projects")
    public ResponseEntity<ProjectResponse> create(@Valid @RequestBody CreateProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/api/admin/projects/{id}/stages")
    public ProjectResponse upsertStage(@PathVariable Long id,
                                       @Valid @RequestBody UpsertStageRequest request) {
        return service.upsertStage(id, request);
    }

    @PatchMapping("/api/admin/projects/{id}/status")
    public ProjectResponse setStatus(@PathVariable Long id, @RequestParam ProjectStatus status) {
        return service.setStatus(id, status);
    }
}

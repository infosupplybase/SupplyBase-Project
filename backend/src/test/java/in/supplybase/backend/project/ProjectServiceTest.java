package in.supplybase.backend.project;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

import in.supplybase.backend.auth.AuthenticatedUser;
import in.supplybase.backend.auth.Role;
import in.supplybase.backend.auth.User;
import in.supplybase.backend.auth.UserRepository;
import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.FileStorageService;
import in.supplybase.backend.project.dto.CreateProjectRequest;
import in.supplybase.backend.project.dto.ProjectDocumentResponse;
import in.supplybase.backend.project.dto.ProjectResponse;
import in.supplybase.backend.project.dto.UpsertStageRequest;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock private ProjectRepository projects;
    @Mock private UserRepository users;
    @Mock private ProjectDocumentRepository documents;
    @Mock private FileStorageService storage;

    private ProjectService service;

    private final AuthenticatedUser admin = new AuthenticatedUser(1L, "admin@supplybase.in", Role.ADMIN);
    private final AuthenticatedUser owner = new AuthenticatedUser(7L, "owner@example.com", Role.CUSTOMER);
    private final AuthenticatedUser stranger = new AuthenticatedUser(8L, "stranger@example.com", Role.CUSTOMER);

    @BeforeEach
    void setUp() {
        service = new ProjectService(projects, users, documents, storage);
    }

    @Nested
    @DisplayName("myProjects")
    class MyProjects {

        @Test
        void returnsOnlyThatClientsProjects() {
            when(projects.findByClientIdOrderByCreatedAtDesc(7L))
                    .thenReturn(List.of(Project.builder().id(1L).code("PRJ-1").build()));

            assertThat(service.myProjects(7L)).extracting(ProjectResponse::id).containsExactly(1L);
        }
    }

    @Nested
    @DisplayName("get")
    class Get {

        @Test
        void ownerCanReadTheirOwnProject() {
            Project project = Project.builder().id(1L).client(User.builder().id(7L).build()).build();
            when(projects.findWithStagesById(1L)).thenReturn(Optional.of(project));

            assertThat(service.get(1L, owner).id()).isEqualTo(1L);
        }

        @Test
        void staffCanReadAnyProject() {
            Project project = Project.builder().id(1L).client(User.builder().id(7L).build()).build();
            when(projects.findWithStagesById(1L)).thenReturn(Optional.of(project));

            assertThat(service.get(1L, admin).id()).isEqualTo(1L);
        }

        @Test
        @DisplayName("a non-owner client gets 404, not 403 — existence is not theirs to know")
        void nonOwnerGetsNotFoundNotForbidden() {
            Project project = Project.builder().id(1L).client(User.builder().id(7L).build()).build();
            when(projects.findWithStagesById(1L)).thenReturn(Optional.of(project));

            assertThatThrownBy(() -> service.get(1L, stranger))
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.NOT_FOUND);
        }

        @Test
        @DisplayName("a project with no client at all is staff-only")
        void projectWithNoClientIsStaffOnly() {
            Project project = Project.builder().id(1L).build();
            when(projects.findWithStagesById(1L)).thenReturn(Optional.of(project));

            assertThatThrownBy(() -> service.get(1L, owner))
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.NOT_FOUND);
        }

        @Test
        void missingProjectIsNotFound() {
            when(projects.findWithStagesById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.get(99L, admin))
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.NOT_FOUND);
        }
    }

    @Test
    void listAllDelegatesToRepository() {
        Page<Project> page = new PageImpl<>(List.of(Project.builder().id(1L).build()));
        when(projects.findAllByOrderByCreatedAtDesc(any())).thenReturn(page);

        Page<ProjectResponse> result = service.listAll(PageRequest.of(0, 20));

        assertThat(result.getContent()).extracting(ProjectResponse::id).containsExactly(1L);
    }

    @Nested
    @DisplayName("create")
    class Create {

        @Test
        void createsAProjectWithAGeneratedCode() {
            when(projects.existsByCode(any())).thenReturn(false);
            when(projects.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

            CreateProjectRequest request = new CreateProjectRequest(
                    "New Villa", null, "construction", "Pune", "2400 sqft",
                    "A new build", new BigDecimal("500000.00"), null, null);

            ProjectResponse response = service.create(request);

            assertThat(response.name()).isEqualTo("New Villa");
            assertThat(response.contractValue()).isEqualByComparingTo("500000.00");
            assertThat(response.clientName()).isNull();
            verifyNoInteractions(users);
        }

        @Test
        void attachesTheNamedClient() {
            when(projects.existsByCode(any())).thenReturn(false);
            when(projects.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));
            User client = User.builder().id(7L).fullName("Asha Rao").build();
            when(users.findById(7L)).thenReturn(Optional.of(client));

            CreateProjectRequest request = new CreateProjectRequest(
                    "New Villa", 7L, null, null, null, null, null, null, null);

            ProjectResponse response = service.create(request);

            assertThat(response.clientName()).isEqualTo("Asha Rao");
        }

        @Test
        void rejectsAnUnknownClient() {
            CreateProjectRequest request = new CreateProjectRequest(
                    "New Villa", 404L, null, null, null, null, null, null, null);
            when(users.findById(404L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.create(request))
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.BAD_REQUEST);

            verify(projects, never()).save(any());
        }
    }

    @Nested
    @DisplayName("upsertStage")
    class UpsertStage {

        @Test
        @DisplayName("a new stage number is appended")
        void addsANewStage() {
            Project project = Project.builder().id(1L).build();
            when(projects.findWithStagesById(1L)).thenReturn(Optional.of(project));
            when(projects.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

            UpsertStageRequest request = new UpsertStageRequest(
                    1, "Foundation", "Digging and footing", StageStatus.IN_PROGRESS, null, null);

            ProjectResponse response = service.upsertStage(1L, request);

            assertThat(response.stages()).hasSize(1);
            assertThat(response.stages().get(0).title()).isEqualTo("Foundation");
            assertThat(project.getStages()).hasSize(1);
            assertThat(project.getStages().get(0).getProject()).isSameAs(project);
        }

        @Test
        @DisplayName("an existing stage number is updated in place, not duplicated")
        void updatesAnExistingStageByNumber() {
            ProjectStage existing = ProjectStage.builder().id(10L).stageNo(1)
                    .title("Old title").status(StageStatus.PENDING).build();
            Project project = Project.builder().id(1L).build();
            project.addStage(existing);
            when(projects.findWithStagesById(1L)).thenReturn(Optional.of(project));
            when(projects.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

            UpsertStageRequest request = new UpsertStageRequest(
                    1, "Foundation done", "Completed", StageStatus.DONE, null, null);

            ProjectResponse response = service.upsertStage(1L, request);

            assertThat(project.getStages()).hasSize(1);
            assertThat(response.stages()).hasSize(1);
            assertThat(response.stages().get(0).id()).isEqualTo(10L);
            assertThat(response.stages().get(0).title()).isEqualTo("Foundation done");
            assertThat(response.stages().get(0).status()).isEqualTo(StageStatus.DONE);
        }

        @Test
        void missingProjectIsNotFound() {
            when(projects.findWithStagesById(99L)).thenReturn(Optional.empty());

            UpsertStageRequest request = new UpsertStageRequest(1, "x", null, StageStatus.PENDING, null, null);

            assertThatThrownBy(() -> service.upsertStage(99L, request))
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.NOT_FOUND);
        }
    }

    @Test
    void setStatusUpdatesAndSaves() {
        Project project = Project.builder().id(1L).status(ProjectStatus.PLANNING).build();
        when(projects.findWithStagesById(1L)).thenReturn(Optional.of(project));
        when(projects.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

        ProjectResponse response = service.setStatus(1L, ProjectStatus.IN_PROGRESS);

        assertThat(response.status()).isEqualTo(ProjectStatus.IN_PROGRESS);
    }

    @Nested
    @DisplayName("documents")
    class Documents {

        @Test
        void uploadStoresAndRecordsTheDocument() {
            Project project = Project.builder().id(1L).build();
            when(projects.findById(1L)).thenReturn(Optional.of(project));
            FileStorageService.StoredFile stored =
                    new FileStorageService.StoredFile("projects/1/plan.pdf", "plan.pdf", "application/pdf", 2048L);
            MockMultipartFile upload =
                    new MockMultipartFile("file", "plan.pdf", "application/pdf", new byte[] { 1, 2, 3 });
            when(storage.store(upload, "projects/1")).thenReturn(stored);
            when(documents.save(any(ProjectDocument.class))).thenAnswer(inv -> {
                ProjectDocument d = inv.getArgument(0);
                d.setId(20L);
                return d;
            });

            ProjectDocumentResponse response =
                    service.uploadDocument(1L, "Floor Plan", DocumentType.DRAWING, upload);

            assertThat(response.id()).isEqualTo(20L);
            assertThat(response.docType()).isEqualTo(DocumentType.DRAWING);
        }

        @Test
        void ownerCanListTheirOwnDocuments() {
            Project project = Project.builder().id(1L).client(User.builder().id(7L).build()).build();
            when(projects.findById(1L)).thenReturn(Optional.of(project));
            when(documents.findByProjectIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());

            assertThat(service.listDocuments(1L, owner)).isEmpty();
        }

        @Test
        @DisplayName("a non-owner client gets 404, matching get()'s ownership rule")
        void nonOwnerCannotListDocuments() {
            Project project = Project.builder().id(1L).client(User.builder().id(7L).build()).build();
            when(projects.findById(1L)).thenReturn(Optional.of(project));

            assertThatThrownBy(() -> service.listDocuments(1L, stranger))
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.NOT_FOUND);
        }

        @Test
        void downloadReadsTheStoredBytes() {
            Project project = Project.builder().id(1L).client(User.builder().id(7L).build()).build();
            ProjectDocument document = ProjectDocument.builder().id(20L).project(project)
                    .title("Floor Plan").fileUrl("projects/1/plan.pdf").contentType("application/pdf").build();
            when(projects.findById(1L)).thenReturn(Optional.of(project));
            when(documents.findById(20L)).thenReturn(Optional.of(document));
            when(storage.load("projects/1/plan.pdf")).thenReturn(new byte[] { 5, 6 });

            var downloaded = service.downloadDocument(1L, 20L, admin);

            assertThat(downloaded.filename()).isEqualTo("Floor Plan");
            assertThat(downloaded.content()).containsExactly(5, 6);
        }

        @Test
        @DisplayName("a document id belonging to a different project is not found")
        void downloadRejectsDocumentFromAnotherProject() {
            Project project = Project.builder().id(1L).client(User.builder().id(7L).build()).build();
            Project otherProject = Project.builder().id(2L).build();
            ProjectDocument document = ProjectDocument.builder().id(20L).project(otherProject).build();
            when(projects.findById(1L)).thenReturn(Optional.of(project));
            when(documents.findById(20L)).thenReturn(Optional.of(document));

            assertThatThrownBy(() -> service.downloadDocument(1L, 20L, owner))
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.NOT_FOUND);

            verifyNoInteractions(storage);
        }
    }
}

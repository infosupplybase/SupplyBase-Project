package in.supplybase.backend.project;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import in.supplybase.backend.auth.AuthenticatedUser;
import in.supplybase.backend.auth.Role;
import in.supplybase.backend.project.dto.ProjectDocumentResponse;
import in.supplybase.backend.project.dto.ProjectResponse;
import in.supplybase.backend.support.WebSecurityTestConfig;

/**
 * {@code @WebMvcTest} slice mirroring {@code BookingControllerTest}'s
 * approach: the service is mocked, and the real
 * {@link in.supplybase.backend.config.SecurityConfig} is imported via
 * {@link WebSecurityTestConfig} so {@code /api/admin/projects/**} role
 * enforcement runs for real.
 */
@WebMvcTest(ProjectController.class)
@Import(WebSecurityTestConfig.class)
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProjectService service;

    private static RequestPostProcessor asUser(long id, Role role) {
        AuthenticatedUser principal = new AuthenticatedUser(id, "user" + id + "@example.com", role);
        var auth = new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority(role.authority())));
        return authentication(auth);
    }

    private static ProjectResponse sampleProject(long id) {
        return new ProjectResponse(id, "PRJ-260906-ABCD", "New Villa", "construction",
                "Pune", "2400 sqft", "A new build", ProjectStatus.PLANNING,
                new java.math.BigDecimal("500000.00"), null, null, "Asha Rao", List.of());
    }

    @Nested
    @DisplayName("GET /api/projects/mine")
    class Mine {

        @Test
        void anonymousIsUnauthorized() throws Exception {
            mockMvc.perform(get("/api/projects/mine"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void authenticatedClientSeesTheirProjects() throws Exception {
            when(service.myProjects(7L)).thenReturn(List.of());

            mockMvc.perform(get("/api/projects/mine").with(asUser(7L, Role.CUSTOMER)))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("GET /api/projects/{id}")
    class Get {

        @Test
        void anonymousIsUnauthorized() throws Exception {
            mockMvc.perform(get("/api/projects/1"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void authenticatedUserGetsTheProject() throws Exception {
            when(service.get(eq(1L), any())).thenReturn(sampleProject(1L));

            mockMvc.perform(get("/api/projects/1").with(asUser(7L, Role.CUSTOMER)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("New Villa"));
        }
    }

    @Nested
    @DisplayName("/api/admin/projects/** — staff only")
    class AdminProjects {

        @Test
        void listIsUnauthorizedAnonymously() throws Exception {
            mockMvc.perform(get("/api/admin/projects"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void listIsForbiddenForACustomer() throws Exception {
            mockMvc.perform(get("/api/admin/projects").with(asUser(7L, Role.CUSTOMER)))
                    .andExpect(status().isForbidden());
        }

        @Test
        void listIsForbiddenForAProfessional() throws Exception {
            mockMvc.perform(get("/api/admin/projects").with(asUser(5L, Role.PROFESSIONAL)))
                    .andExpect(status().isForbidden());
        }

        @Test
        void listSucceedsForAnAdmin() throws Exception {
            Page<ProjectResponse> page = new PageImpl<>(List.of(sampleProject(1L)));
            when(service.listAll(any())).thenReturn(page);

            mockMvc.perform(get("/api/admin/projects").with(asUser(1L, Role.ADMIN)))
                    .andExpect(status().isOk());
        }

        @Test
        void createSucceedsForAnAdmin() throws Exception {
            when(service.create(any())).thenReturn(sampleProject(1L));

            mockMvc.perform(post("/api/admin/projects")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"name": "New Villa", "category": "construction"}
                                    """)
                            .with(asUser(1L, Role.ADMIN)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.name").value("New Villa"));
        }

        @Test
        void createIsForbiddenForACustomer() throws Exception {
            mockMvc.perform(post("/api/admin/projects")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"name": "New Villa"}
                                    """)
                            .with(asUser(7L, Role.CUSTOMER)))
                    .andExpect(status().isForbidden());
        }

        @Test
        void createIsUnauthorizedAnonymously() throws Exception {
            mockMvc.perform(post("/api/admin/projects")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"name": "New Villa"}
                                    """))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void upsertStageSucceedsForAnAdmin() throws Exception {
            when(service.upsertStage(eq(1L), any())).thenReturn(sampleProject(1L));

            mockMvc.perform(put("/api/admin/projects/1/stages")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"stageNo": 1, "title": "Foundation", "status": "PENDING"}
                                    """)
                            .with(asUser(1L, Role.ADMIN)))
                    .andExpect(status().isOk());
        }

        @Test
        void upsertStageIsForbiddenForAProfessional() throws Exception {
            mockMvc.perform(put("/api/admin/projects/1/stages")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"stageNo": 1, "title": "Foundation", "status": "PENDING"}
                                    """)
                            .with(asUser(5L, Role.PROFESSIONAL)))
                    .andExpect(status().isForbidden());
        }

        @Test
        void setStatusSucceedsForAnAdmin() throws Exception {
            when(service.setStatus(eq(1L), eq(ProjectStatus.IN_PROGRESS))).thenReturn(sampleProject(1L));

            mockMvc.perform(patch("/api/admin/projects/1/status")
                            .param("status", "IN_PROGRESS")
                            .with(asUser(1L, Role.ADMIN)))
                    .andExpect(status().isOk());
        }

        @Test
        void setStatusIsUnauthorizedAnonymously() throws Exception {
            mockMvc.perform(patch("/api/admin/projects/1/status").param("status", "IN_PROGRESS"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("multipart document upload is admin-only and binds the file part")
        void uploadDocumentSucceedsForAnAdmin() throws Exception {
            MockMultipartFile file =
                    new MockMultipartFile("file", "plan.pdf", "application/pdf", new byte[] { 1, 2, 3 });
            when(service.uploadDocument(eq(1L), eq("Floor Plan"), eq(DocumentType.DRAWING), any()))
                    .thenReturn(new ProjectDocumentResponse(1L, "Floor Plan", DocumentType.DRAWING,
                            "application/pdf", 3L, null));

            mockMvc.perform(multipart("/api/admin/projects/1/documents")
                            .file(file)
                            .param("title", "Floor Plan")
                            .param("docType", "DRAWING")
                            .with(asUser(1L, Role.ADMIN)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.title").value("Floor Plan"));
        }

        @Test
        void uploadDocumentIsForbiddenForACustomer() throws Exception {
            MockMultipartFile file =
                    new MockMultipartFile("file", "plan.pdf", "application/pdf", new byte[] { 1 });

            mockMvc.perform(multipart("/api/admin/projects/1/documents")
                            .file(file)
                            .param("title", "Floor Plan")
                            .param("docType", "DRAWING")
                            .with(asUser(7L, Role.CUSTOMER)))
                    .andExpect(status().isForbidden());
        }

        @Test
        void uploadDocumentIsUnauthorizedAnonymously() throws Exception {
            MockMultipartFile file =
                    new MockMultipartFile("file", "plan.pdf", "application/pdf", new byte[] { 1 });

            mockMvc.perform(multipart("/api/admin/projects/1/documents")
                            .file(file)
                            .param("title", "Floor Plan")
                            .param("docType", "DRAWING"))
                    .andExpect(status().isUnauthorized());
        }
    }
}

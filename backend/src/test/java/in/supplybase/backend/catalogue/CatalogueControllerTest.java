package in.supplybase.backend.catalogue;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import in.supplybase.backend.auth.JwtAuthenticationFilter;
import in.supplybase.backend.auth.JwtService;
import in.supplybase.backend.auth.UserRepository;
import in.supplybase.backend.catalogue.dto.CategoryResponse;
import in.supplybase.backend.catalogue.dto.QuestionResponse;
import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.RestAccessDeniedHandler;
import in.supplybase.backend.common.RestAuthenticationEntryPoint;
import in.supplybase.backend.config.AppProperties;
import in.supplybase.backend.config.SecurityConfig;

/**
 * A slice test for the catalogue endpoints: {@link CatalogueService} is
 * mocked out. See {@code AuthControllerTest} for why {@link SecurityConfig}
 * and its dependencies are explicitly imported here rather than relying on
 * {@code @WebMvcTest}'s default component scan, which skips plain
 * {@code @Component}/{@code @Service} beans.
 */
@WebMvcTest(CatalogueController.class)
@Import({ SecurityConfig.class, JwtAuthenticationFilter.class, RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class, CatalogueControllerTest.SecurityTestConfig.class })
class CatalogueControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CatalogueService catalogueService;
    @MockitoBean
    private JwtService jwtService;
    @MockitoBean
    private UserRepository userRepository;

    @TestConfiguration
    static class SecurityTestConfig {
        @Bean
        AppProperties appProperties() {
            return new AppProperties(
                    List.of("http://localhost:5173"),
                    new AppProperties.Jwt("test-secret-key-at-least-32-bytes-long!!", 15, 30, "supplybase"),
                    new AppProperties.Razorpay(null, null, null, "INR"),
                    new AppProperties.Google(null),
                    new AppProperties.Notifications(null),
                    "http://localhost:5173",
                    new AppProperties.Bootstrap(null, null),
                    new AppProperties.Booking(48),
                    "/tmp/storage");
        }
    }

    private CategoryResponse sampleCategory() {
        return new CategoryResponse("plumbing", null, "Plumbing", "Taps to tanks", "Description",
                "wrench", "hero.png", new BigDecimal("25.00"), "₹25.00", null, null, 1, true);
    }

    @Nested
    @DisplayName("GET /api/catalogue/services")
    class ListServices {

        @Test
        @DisplayName("200s for an anonymous caller — the booking form needs this before sign-in")
        void publicAndAnonymousAllowed() throws Exception {
            when(catalogueService.listCategories()).thenReturn(List.of(sampleCategory()));

            mockMvc.perform(get("/api/catalogue/services"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].slug").value("plumbing"));
        }
    }

    @Nested
    @DisplayName("GET /api/catalogue/services/{slug}/form")
    class Form {

        @Test
        @DisplayName("200s with the form for a known slug")
        void found() throws Exception {
            when(catalogueService.form("plumbing"))
                    .thenReturn(new in.supplybase.backend.catalogue.dto.ServiceFormResponse(sampleCategory(), List.of()));

            mockMvc.perform(get("/api/catalogue/services/plumbing/form"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.category.slug").value("plumbing"));
        }

        @Test
        @DisplayName("404s for an unknown slug")
        void notFound() throws Exception {
            when(catalogueService.form("ghost")).thenThrow(ApiException.notFound("That service"));

            mockMvc.perform(get("/api/catalogue/services/ghost/form"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("/api/admin/catalogue/categories role-based access")
    class AdminCategoriesAccess {

        @Test
        @DisplayName("401s an anonymous caller")
        void anonymousIsUnauthorized() throws Exception {
            mockMvc.perform(get("/api/admin/catalogue/categories")).andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("403s a signed-in customer")
        @WithMockUser(roles = "CUSTOMER")
        void customerIsForbidden() throws Exception {
            mockMvc.perform(get("/api/admin/catalogue/categories")).andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("200s an admin, including inactive categories")
        @WithMockUser(roles = "ADMIN")
        void adminIsAllowed() throws Exception {
            when(catalogueService.listAllCategories()).thenReturn(List.of(sampleCategory()));

            mockMvc.perform(get("/api/admin/catalogue/categories"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].slug").value("plumbing"));
        }
    }

    @Nested
    @DisplayName("POST /api/admin/catalogue/categories")
    class CreateCategory {

        private String validBody() {
            return """
                    {"slug":"electrician","name":"Electrician","tagline":"Wired right",
                     "description":"desc","icon":"bolt","heroImage":"hero.png",
                     "visitFee":30.00,"sortOrder":1}
                    """;
        }

        @Test
        @DisplayName("201s for an admin with a valid body")
        @WithMockUser(roles = "ADMIN")
        void success() throws Exception {
            when(catalogueService.createCategory(any())).thenReturn(sampleCategory());

            mockMvc.perform(post("/api/admin/catalogue/categories")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validBody()))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.slug").value("plumbing"));
        }

        @Test
        @DisplayName("400s a slug with uppercase letters")
        @WithMockUser(roles = "ADMIN")
        void invalidSlugPattern() throws Exception {
            mockMvc.perform(post("/api/admin/catalogue/categories")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"slug":"Not Valid!","name":"Electrician","sortOrder":1}
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors.slug").exists());
        }

        @Test
        @DisplayName("400s a missing name")
        @WithMockUser(roles = "ADMIN")
        void missingName() throws Exception {
            mockMvc.perform(post("/api/admin/catalogue/categories")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"slug":"electrician","sortOrder":1}
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors.name").exists());
        }

        @Test
        @DisplayName("409s a slug that already exists")
        @WithMockUser(roles = "ADMIN")
        void duplicateSlugConflict() throws Exception {
            when(catalogueService.createCategory(any()))
                    .thenThrow(ApiException.conflict("A service with that slug already exists."));

            mockMvc.perform(post("/api/admin/catalogue/categories")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validBody()))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("403s a non-admin")
        @WithMockUser(roles = "CUSTOMER")
        void nonAdminForbidden() throws Exception {
            mockMvc.perform(post("/api/admin/catalogue/categories")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validBody()))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("PUT /api/admin/catalogue/categories/{slug}")
    class UpdateCategory {

        @Test
        @DisplayName("200s a valid update")
        @WithMockUser(roles = "ADMIN")
        void success() throws Exception {
            when(catalogueService.updateCategory(eq("plumbing"), any())).thenReturn(sampleCategory());

            mockMvc.perform(put("/api/admin/catalogue/categories/plumbing")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"name":"Plumbing","sortOrder":1}
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.slug").value("plumbing"));
        }

        @Test
        @DisplayName("404s an unknown slug")
        @WithMockUser(roles = "ADMIN")
        void notFound() throws Exception {
            when(catalogueService.updateCategory(eq("ghost"), any()))
                    .thenThrow(ApiException.notFound("That service"));

            mockMvc.perform(put("/api/admin/catalogue/categories/ghost")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"name":"Ghost","sortOrder":1}
                                    """))
                    .andExpect(status().isNotFound());
        }
    }

    @Test
    @DisplayName("DELETE /api/admin/catalogue/categories/{slug} 204s an admin's soft delete")
    @WithMockUser(roles = "ADMIN")
    void deleteCategorySuccess() throws Exception {
        mockMvc.perform(delete("/api/admin/catalogue/categories/plumbing"))
                .andExpect(status().isNoContent());
    }

    @Nested
    @DisplayName("POST /api/admin/catalogue/categories/{slug}/questions")
    class CreateQuestion {

        @Test
        @DisplayName("201s a valid question")
        @WithMockUser(roles = "ADMIN")
        void success() throws Exception {
            QuestionResponse response = new QuestionResponse(1, "issue", "What is the issue?", "TEXT", true, List.of());
            when(catalogueService.createQuestion(eq("plumbing"), any())).thenReturn(response);

            mockMvc.perform(post("/api/admin/catalogue/categories/plumbing/questions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"stepNo":1,"questionKey":"issue","questionText":"What is the issue?",
                                     "inputType":"TEXT","required":true}
                                    """))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.key").value("issue"));
        }

        @Test
        @DisplayName("400s an unrecognised inputType")
        @WithMockUser(roles = "ADMIN")
        void invalidInputType() throws Exception {
            mockMvc.perform(post("/api/admin/catalogue/categories/plumbing/questions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"stepNo":1,"questionKey":"issue","questionText":"What is the issue?",
                                     "inputType":"WEIRD","required":true}
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors.inputType").exists());
        }

        @Test
        @DisplayName("404s an unknown category slug")
        @WithMockUser(roles = "ADMIN")
        void categoryNotFound() throws Exception {
            when(catalogueService.createQuestion(eq("ghost"), any()))
                    .thenThrow(ApiException.notFound("That service"));

            mockMvc.perform(post("/api/admin/catalogue/categories/ghost/questions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"stepNo":1,"questionKey":"issue","questionText":"What?",
                                     "inputType":"TEXT","required":false}
                                    """))
                    .andExpect(status().isNotFound());
        }
    }

    @Test
    @DisplayName("DELETE .../{slug}/questions/{questionKey} 204s an admin's soft delete")
    @WithMockUser(roles = "ADMIN")
    void deleteQuestionSuccess() throws Exception {
        mockMvc.perform(delete("/api/admin/catalogue/categories/plumbing/questions/issue"))
                .andExpect(status().isNoContent());
    }
}

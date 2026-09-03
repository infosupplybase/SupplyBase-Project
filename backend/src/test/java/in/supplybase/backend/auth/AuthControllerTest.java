package in.supplybase.backend.auth;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import in.supplybase.backend.auth.dto.AuthResponse;
import in.supplybase.backend.auth.dto.UserResponse;
import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.RestAccessDeniedHandler;
import in.supplybase.backend.common.RestAuthenticationEntryPoint;
import in.supplybase.backend.config.AppProperties;
import in.supplybase.backend.config.SecurityConfig;

/**
 * A slice test for the auth endpoints: {@link AuthService} is mocked out, so
 * this only checks request validation, response shape and — for the
 * {@code /api/admin/**} routes — role-based access.
 *
 * {@code @WebMvcTest} does not scan {@code @Component}/{@code @Service}
 * beans, only controllers and controller advice, so exercising the real
 * {@link SecurityConfig} filter chain (rather than disabling security
 * entirely) means explicitly importing it plus everything its constructor
 * needs: {@link JwtAuthenticationFilter} (with its own {@link JwtService} and
 * {@link UserRepository} mocked out — {@code @WithMockUser} seeds the
 * security context directly before the filter chain runs, and the filter's
 * own early-exit check means those two mocks are never actually invoked) and
 * the two REST error handlers. A tiny {@link TestConfiguration} supplies a
 * real, hand-built {@link AppProperties} since nothing here binds
 * `application.yml`.
 */
@WebMvcTest(AuthController.class)
@Import({ SecurityConfig.class, JwtAuthenticationFilter.class, RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class, AuthControllerTest.SecurityTestConfig.class })
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;
    @MockitoBean
    private CurrentUser currentUser;
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

    private UserResponse sampleUser() {
        return new UserResponse(1L, "Jane Doe", "jane@example.com", "9820011223", Role.CUSTOMER, null, true);
    }

    private AuthResponse sampleAuthResponse() {
        return AuthResponse.of("access-token", "refresh-token", 900, sampleUser());
    }

    @Nested
    @DisplayName("POST /api/auth/register")
    class Register {

        @Test
        @DisplayName("201s with an auth payload on a valid request")
        void success() throws Exception {
            when(authService.register(any(), any())).thenReturn(sampleAuthResponse());

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"fullName":"Jane Doe","email":"jane@example.com","phone":"9820011223","password":"password123"}
                                    """))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.accessToken").value("access-token"))
                    .andExpect(jsonPath("$.user.email").value("jane@example.com"));
        }

        @Test
        @DisplayName("400s with field errors when required fields are missing")
        void missingFieldsReturns400() throws Exception {
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors.email").value("Please enter your email"))
                    .andExpect(jsonPath("$.fieldErrors.password").exists());
        }

        @Test
        @DisplayName("400s on a malformed email even though the field is present")
        void malformedEmailReturns400() throws Exception {
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"fullName":"Jane Doe","email":"not-an-email","phone":"9820011223","password":"password123"}
                                    """))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/auth/login")
    class Login {

        @Test
        @DisplayName("200s with an auth payload on valid credentials")
        void success() throws Exception {
            when(authService.login(any())).thenReturn(sampleAuthResponse());

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"identifier":"jane@example.com","password":"password123"}
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.user.email").value("jane@example.com"));
        }

        @Test
        @DisplayName("400s when the identifier is blank")
        void blankIdentifierReturns400() throws Exception {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"identifier":"","password":"password123"}
                                    """))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("401s wrong credentials, surfacing the service's message")
        void wrongCredentialsReturns401() throws Exception {
            when(authService.login(any()))
                    .thenThrow(ApiException.unauthorized("Wrong details. Please check and try again."));

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"identifier":"jane@example.com","password":"wrong"}
                                    """))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Wrong details. Please check and try again."));
        }
    }

    @Nested
    @DisplayName("GET /api/auth/me")
    class Me {

        @Test
        @DisplayName("401s for an anonymous caller")
        void anonymousIsUnauthorized() throws Exception {
            mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("200s and returns the caller's own profile when signed in")
        @WithMockUser(roles = "CUSTOMER")
        void signedInReturnsProfile() throws Exception {
            when(currentUser.require()).thenReturn(new AuthenticatedUser(1L, "jane@example.com", Role.CUSTOMER));
            when(authService.me(1L)).thenReturn(sampleUser());

            mockMvc.perform(get("/api/auth/me"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.email").value("jane@example.com"));
        }
    }

    @Nested
    @DisplayName("POST /api/auth/forgot-password")
    class ForgotPassword {

        @Test
        @DisplayName("always 200s, even for an unknown identifier")
        void alwaysReturns200() throws Exception {
            mockMvc.perform(post("/api/auth/forgot-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"identifier":"ghost@example.com"}
                                    """))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("swallows a thrown exception and still returns 200")
        void swallowsServiceException() throws Exception {
            doThrow(new RuntimeException("boom")).when(authService).forgotPassword(any());

            mockMvc.perform(post("/api/auth/forgot-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"identifier":"ghost@example.com"}
                                    """))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("400s when the identifier is blank")
        void blankIdentifierReturns400() throws Exception {
            mockMvc.perform(post("/api/auth/forgot-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"identifier\":\"\"}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("/api/admin/users role-based access")
    class AdminUsers {

        @Test
        @DisplayName("401s an anonymous caller")
        void anonymousIsUnauthorized() throws Exception {
            mockMvc.perform(get("/api/admin/users")).andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("403s a signed-in customer")
        @WithMockUser(roles = "CUSTOMER")
        void customerIsForbidden() throws Exception {
            mockMvc.perform(get("/api/admin/users")).andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("403s a signed-in professional")
        @WithMockUser(roles = "PROFESSIONAL")
        void professionalIsForbidden() throws Exception {
            mockMvc.perform(get("/api/admin/users")).andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("200s an admin")
        @WithMockUser(roles = "ADMIN")
        void adminIsAllowed() throws Exception {
            when(authService.listUsers(any(), any(), any()))
                    .thenReturn(new PageImpl<>(List.of(sampleUser())));

            mockMvc.perform(get("/api/admin/users"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].email").value("jane@example.com"));
        }

        @Test
        @DisplayName("400s an admin trying to change their own role")
        @WithMockUser(roles = "ADMIN")
        void selfRoleChangeIsBadRequest() throws Exception {
            when(currentUser.require()).thenReturn(new AuthenticatedUser(1L, "admin@example.com", Role.ADMIN));
            when(authService.updateRole(eq(1L), any(), eq(1L)))
                    .thenThrow(ApiException.badRequest("You cannot change your own role."));

            mockMvc.perform(patch("/api/admin/users/1/role")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"role\":\"ADMIN\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("400s a role update with no role in the body")
        @WithMockUser(roles = "ADMIN")
        void updateRoleMissingRoleReturns400() throws Exception {
            mockMvc.perform(patch("/api/admin/users/1/role")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("403s a non-admin trying to update a role")
        @WithMockUser(roles = "CUSTOMER")
        void nonAdminCannotUpdateRole() throws Exception {
            mockMvc.perform(patch("/api/admin/users/1/role")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"role\":\"ADMIN\"}"))
                    .andExpect(status().isForbidden());
        }
    }
}

package in.supplybase.backend.partner;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import in.supplybase.backend.auth.AuthenticatedUser;
import in.supplybase.backend.auth.Role;
import in.supplybase.backend.auth.dto.AuthResponse;
import in.supplybase.backend.auth.dto.UserResponse;
import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.booking.dto.PartnerEarningsResponse;
import in.supplybase.backend.partner.dto.PartnerDetailResponse;
import in.supplybase.backend.partner.dto.PartnerProfileResponse;
import in.supplybase.backend.partner.dto.PartnerSummaryResponse;
import in.supplybase.backend.support.WebSecurityTestConfig;

/**
 * {@code @WebMvcTest} slice with the real security rules: the apply endpoint
 * is public, a partner's own view needs a sign-in, and everything under
 * {@code /api/admin/partners} is admin-only.
 */
@WebMvcTest(PartnerController.class)
@Import(WebSecurityTestConfig.class)
class PartnerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PartnerService service;

    private static RequestPostProcessor asUser(long id, Role role) {
        AuthenticatedUser principal = new AuthenticatedUser(id, "user" + id + "@example.com", role);
        var auth = new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority(role.authority())));
        return authentication(auth);
    }

    private static final String APPLY_JSON = """
            {"fullName":"Ravi Kumar","email":"ravi@example.com","phone":"9820011223",
             "password":"password123","primaryTrade":"electrical","experienceYears":6,
             "city":"Thane","serviceAreas":"Thane West","languages":"Hindi, Marathi"}
            """;

    private static PartnerSummaryResponse sampleSummary() {
        return new PartnerSummaryResponse(5L, "Ravi Kumar", "ravi@example.com", "9820011223", true,
                PartnerStatus.PENDING, "electrical", "Electrical", 6, "Thane", 0, 0, Instant.now());
    }

    private static PartnerDetailResponse sampleDetail(PartnerStatus status) {
        return new PartnerDetailResponse(5L, "Ravi Kumar", "ravi@example.com", "9820011223", true, false,
                Role.PROFESSIONAL, status, "electrical", "Electrical", 6, "Thane", null, null,
                null, null, Instant.now(), 0, 0,
                PartnerEarningsResponse.from(List.of(), Instant.now()), List.of());
    }

    @Nested
    @DisplayName("POST /api/partners/apply — public")
    class Apply {

        @Test
        @DisplayName("201s with tokens, without being signed in")
        void worksAnonymously() throws Exception {
            var user = new UserResponse(7L, "Ravi Kumar", "ravi@example.com", "9820011223", null, null, null,
                    null, null, null, Role.CUSTOMER, null, true, true, false);
            when(service.apply(any(), any())).thenReturn(AuthResponse.of("access", "refresh", 900, user));

            mockMvc.perform(post("/api/partners/apply").contentType(MediaType.APPLICATION_JSON).content(APPLY_JSON))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.accessToken").value("access"))
                    .andExpect(jsonPath("$.user.role").value("CUSTOMER"));
        }

        @Test
        @DisplayName("400s when required fields are missing")
        void missingFields() throws Exception {
            mockMvc.perform(post("/api/partners/apply").contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isBadRequest());

            verify(service, never()).apply(any(), any());
        }

        @Test
        @DisplayName("400s on an impossible amount of experience")
        void absurdExperience() throws Exception {
            mockMvc.perform(post("/api/partners/apply").contentType(MediaType.APPLICATION_JSON)
                            .content(APPLY_JSON.replace("\"experienceYears\":6", "\"experienceYears\":99")))
                    .andExpect(status().isBadRequest());

            verify(service, never()).apply(any(), any());
        }
    }

    @Nested
    @DisplayName("GET /api/partners/me")
    class Me {

        @Test
        @DisplayName("401s when not signed in")
        void anonymous() throws Exception {
            mockMvc.perform(get("/api/partners/me")).andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("a pending applicant (still a CUSTOMER) can read their own application")
        void applicantReadsOwn() throws Exception {
            when(service.myProfile(7L)).thenReturn(new PartnerProfileResponse(PartnerStatus.PENDING,
                    "electrical", "Electrical", 6, "Thane", null, null, null, Instant.now(), null));

            mockMvc.perform(get("/api/partners/me").with(asUser(7L, Role.CUSTOMER)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("PENDING"))
                    .andExpect(jsonPath("$.tradeLabel").value("Electrical"));
        }

        @Test
        @DisplayName("404s for an account that never applied")
        void neverApplied() throws Exception {
            when(service.myProfile(8L)).thenThrow(ApiException.notFound("A partner application for this account"));

            mockMvc.perform(get("/api/partners/me").with(asUser(8L, Role.CUSTOMER)))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("/api/admin/partners — admin only")
    class Admin {

        @Test
        @DisplayName("401s when not signed in")
        void anonymous() throws Exception {
            mockMvc.perform(get("/api/admin/partners")).andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("403s for a customer and for a professional")
        void nonAdminsForbidden() throws Exception {
            mockMvc.perform(get("/api/admin/partners").with(asUser(7L, Role.CUSTOMER)))
                    .andExpect(status().isForbidden());
            mockMvc.perform(get("/api/admin/partners").with(asUser(5L, Role.PROFESSIONAL)))
                    .andExpect(status().isForbidden());
            mockMvc.perform(patch("/api/admin/partners/5/status").with(asUser(5L, Role.PROFESSIONAL))
                            .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"APPROVED\"}"))
                    .andExpect(status().isForbidden());

            verify(service, never()).review(any(), any(), any(), any());
        }

        @Test
        @DisplayName("lists partners with paging and filters for an admin")
        void listsForAdmin() throws Exception {
            when(service.list(eq(PartnerStatus.PENDING), eq("ravi"), any()))
                    .thenReturn(new PageImpl<>(List.of(sampleSummary())));

            mockMvc.perform(get("/api/admin/partners?status=PENDING&q=ravi").with(asUser(99L, Role.ADMIN)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].fullName").value("Ravi Kumar"))
                    .andExpect(jsonPath("$.content[0].status").value("PENDING"));
        }

        @Test
        @DisplayName("returns counts per status")
        void counts() throws Exception {
            Map<PartnerStatus, Long> counts = new EnumMap<>(PartnerStatus.class);
            counts.put(PartnerStatus.PENDING, 3L);
            counts.put(PartnerStatus.APPROVED, 12L);
            when(service.counts()).thenReturn(counts);

            mockMvc.perform(get("/api/admin/partners/counts").with(asUser(99L, Role.ADMIN)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.PENDING").value(3))
                    .andExpect(jsonPath("$.APPROVED").value(12));
        }

        @Test
        @DisplayName("passes the signed-in admin's id, not a caller-supplied one, to the review")
        void reviewUsesSessionAdmin() throws Exception {
            when(service.review(5L, PartnerStatus.APPROVED, "welcome", 99L))
                    .thenReturn(sampleDetail(PartnerStatus.APPROVED));

            mockMvc.perform(patch("/api/admin/partners/5/status").with(asUser(99L, Role.ADMIN))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"status\":\"APPROVED\",\"note\":\"welcome\",\"reviewedBy\":1}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("APPROVED"))
                    .andExpect(jsonPath("$.role").value("PROFESSIONAL"));

            verify(service).review(5L, PartnerStatus.APPROVED, "welcome", 99L);
        }

        @Test
        @DisplayName("400s when the decision has no status")
        void reviewNeedsStatus() throws Exception {
            mockMvc.perform(patch("/api/admin/partners/5/status").with(asUser(99L, Role.ADMIN))
                            .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isBadRequest());

            verify(service, never()).review(any(), any(), any(), any());
        }

        @Test
        @DisplayName("shows one partner's detail")
        void detail() throws Exception {
            when(service.detail(5L)).thenReturn(sampleDetail(PartnerStatus.APPROVED));

            mockMvc.perform(get("/api/admin/partners/5").with(asUser(99L, Role.ADMIN)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.userId").value(5))
                    .andExpect(jsonPath("$.tradeLabel").value("Electrical"));
        }
    }
}

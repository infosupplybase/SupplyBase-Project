package in.supplybase.backend.appointment;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalTime;
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

import in.supplybase.backend.appointment.dto.BlackoutResponse;
import in.supplybase.backend.appointment.dto.DayAvailabilityResponse;
import in.supplybase.backend.appointment.dto.SlotRuleResponse;
import in.supplybase.backend.auth.JwtAuthenticationFilter;
import in.supplybase.backend.auth.JwtService;
import in.supplybase.backend.auth.UserRepository;
import in.supplybase.backend.catalogue.CatalogueService;
import in.supplybase.backend.catalogue.ServiceCategory;
import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.RestAccessDeniedHandler;
import in.supplybase.backend.common.RestAuthenticationEntryPoint;
import in.supplybase.backend.config.AppProperties;
import in.supplybase.backend.config.SecurityConfig;

/**
 * A slice test for the appointment endpoints: {@link AppointmentService} and
 * {@link CatalogueService} (used only to resolve a service slug to a
 * category id) are mocked out. See {@code AuthControllerTest} for why
 * {@link SecurityConfig} and its dependencies are explicitly imported here
 * rather than relying on {@code @WebMvcTest}'s default component scan.
 */
@WebMvcTest(AppointmentController.class)
@Import({ SecurityConfig.class, JwtAuthenticationFilter.class, RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class, AppointmentControllerTest.SecurityTestConfig.class })
class AppointmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AppointmentService appointmentService;
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

    private ServiceCategory category(long id, String slug) {
        return ServiceCategory.builder().id(id).slug(slug).name("Plumbing")
                .visitFeePaise(2500L).sortOrder(0).active(true).build();
    }

    @Nested
    @DisplayName("GET /api/appointments/available-slots")
    class AvailableSlots {

        @Test
        @DisplayName("200s for an anonymous caller with a known service")
        void publicAndAnonymousAllowed() throws Exception {
            when(catalogueService.requireCategory("plumbing")).thenReturn(category(1L, "plumbing"));
            when(appointmentService.availability(eq(1L), any(), org.mockito.ArgumentMatchers.anyInt()))
                    .thenReturn(List.of(new DayAvailabilityResponse(LocalDate.now(), true, null, List.of())));

            mockMvc.perform(get("/api/appointments/available-slots").param("service", "plumbing"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].open").value(true));
        }

        @Test
        @DisplayName("404s an unrecognised service slug")
        void unknownServiceReturns404() throws Exception {
            when(catalogueService.requireCategory("ghost")).thenThrow(ApiException.notFound("That service"));

            mockMvc.perform(get("/api/appointments/available-slots").param("service", "ghost"))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("/api/admin/appointment-rules role-based access")
    class AdminRulesAccess {

        @Test
        @DisplayName("401s an anonymous caller")
        void anonymousIsUnauthorized() throws Exception {
            mockMvc.perform(get("/api/admin/appointment-rules")).andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("403s a signed-in customer")
        @WithMockUser(roles = "CUSTOMER")
        void customerIsForbidden() throws Exception {
            mockMvc.perform(get("/api/admin/appointment-rules")).andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("200s an admin")
        @WithMockUser(roles = "ADMIN")
        void adminIsAllowed() throws Exception {
            when(appointmentService.listRules()).thenReturn(List.of(
                    new SlotRuleResponse(1L, null, 1, LocalTime.of(9, 0), LocalTime.of(17, 0), 60, 2, true)));

            mockMvc.perform(get("/api/admin/appointment-rules"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].dayOfWeek").value(1));
        }
    }

    @Nested
    @DisplayName("POST /api/admin/appointment-rules")
    class CreateRule {

        private String validBody() {
            return """
                    {"categoryId":null,"dayOfWeek":1,"startTime":"09:00:00","endTime":"17:00:00",
                     "slotMinutes":60,"maxBookings":2}
                    """;
        }

        @Test
        @DisplayName("201s a valid rule for an admin")
        @WithMockUser(roles = "ADMIN")
        void success() throws Exception {
            when(appointmentService.createRule(any())).thenReturn(
                    new SlotRuleResponse(1L, null, 1, LocalTime.of(9, 0), LocalTime.of(17, 0), 60, 2, true));

            mockMvc.perform(post("/api/admin/appointment-rules")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validBody()))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.slotMinutes").value(60));
        }

        @Test
        @DisplayName("400s a dayOfWeek outside 1-7")
        @WithMockUser(roles = "ADMIN")
        void invalidDayOfWeek() throws Exception {
            mockMvc.perform(post("/api/admin/appointment-rules")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"categoryId":null,"dayOfWeek":9,"startTime":"09:00:00","endTime":"17:00:00",
                                     "slotMinutes":60,"maxBookings":2}
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors.dayOfWeek").exists());
        }

        @Test
        @DisplayName("400s when the service rejects an end time before the start time")
        @WithMockUser(roles = "ADMIN")
        void endBeforeStartIsBadRequest() throws Exception {
            when(appointmentService.createRule(any()))
                    .thenThrow(ApiException.badRequest("The end time must be after the start time."));

            mockMvc.perform(post("/api/admin/appointment-rules")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validBody()))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("403s a non-admin")
        @WithMockUser(roles = "PROFESSIONAL")
        void nonAdminForbidden() throws Exception {
            mockMvc.perform(post("/api/admin/appointment-rules")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validBody()))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("PUT /api/admin/appointment-rules/{id}")
    class UpdateRule {

        @Test
        @DisplayName("200s a valid update")
        @WithMockUser(roles = "ADMIN")
        void success() throws Exception {
            when(appointmentService.updateRule(eq(1L), any())).thenReturn(
                    new SlotRuleResponse(1L, null, 2, LocalTime.of(10, 0), LocalTime.of(18, 0), 30, 3, true));

            mockMvc.perform(put("/api/admin/appointment-rules/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"categoryId":null,"dayOfWeek":2,"startTime":"10:00:00","endTime":"18:00:00",
                                     "slotMinutes":30,"maxBookings":3}
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.maxBookings").value(3));
        }

        @Test
        @DisplayName("404s an unknown rule id")
        @WithMockUser(roles = "ADMIN")
        void notFound() throws Exception {
            when(appointmentService.updateRule(eq(99L), any())).thenThrow(ApiException.notFound("That rule"));

            mockMvc.perform(put("/api/admin/appointment-rules/99")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"categoryId":null,"dayOfWeek":2,"startTime":"10:00:00","endTime":"18:00:00",
                                     "slotMinutes":30,"maxBookings":3}
                                    """))
                    .andExpect(status().isNotFound());
        }
    }

    @Test
    @DisplayName("DELETE /api/admin/appointment-rules/{id} 204s an admin's soft delete")
    @WithMockUser(roles = "ADMIN")
    void deleteRuleSuccess() throws Exception {
        mockMvc.perform(delete("/api/admin/appointment-rules/1")).andExpect(status().isNoContent());
    }

    @Nested
    @DisplayName("/api/admin/appointment-blackouts")
    class Blackouts {

        @Test
        @DisplayName("200s an admin listing blackouts")
        @WithMockUser(roles = "ADMIN")
        void listSuccess() throws Exception {
            when(appointmentService.listBlackouts())
                    .thenReturn(List.of(new BlackoutResponse(1L, LocalDate.now().plusDays(3), "Holiday")));

            mockMvc.perform(get("/api/admin/appointment-blackouts"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].reason").value("Holiday"));
        }

        @Test
        @DisplayName("401s an anonymous caller")
        void anonymousIsUnauthorized() throws Exception {
            mockMvc.perform(get("/api/admin/appointment-blackouts")).andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("201s a valid blackout")
        @WithMockUser(roles = "ADMIN")
        void createSuccess() throws Exception {
            LocalDate day = LocalDate.now().plusDays(3);
            when(appointmentService.createBlackout(any())).thenReturn(new BlackoutResponse(1L, day, "Holiday"));

            mockMvc.perform(post("/api/admin/appointment-blackouts")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"day\":\"" + day + "\",\"reason\":\"Holiday\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.reason").value("Holiday"));
        }

        @Test
        @DisplayName("400s a missing day")
        @WithMockUser(roles = "ADMIN")
        void missingDayReturns400() throws Exception {
            mockMvc.perform(post("/api/admin/appointment-blackouts")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"reason\":\"Holiday\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("409s a day that already has a blackout")
        @WithMockUser(roles = "ADMIN")
        void duplicateDayConflict() throws Exception {
            when(appointmentService.createBlackout(any()))
                    .thenThrow(ApiException.conflict("That day already has a blackout."));

            mockMvc.perform(post("/api/admin/appointment-blackouts")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"day\":\"" + LocalDate.now().plusDays(3) + "\",\"reason\":\"Holiday\"}"))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("204s deleting an existing blackout")
        @WithMockUser(roles = "ADMIN")
        void deleteSuccess() throws Exception {
            mockMvc.perform(delete("/api/admin/appointment-blackouts/1")).andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("404s deleting an unknown blackout")
        @WithMockUser(roles = "ADMIN")
        void deleteNotFound() throws Exception {
            org.mockito.Mockito.doThrow(ApiException.notFound("That blackout"))
                    .when(appointmentService).deleteBlackout(99L);

            mockMvc.perform(delete("/api/admin/appointment-blackouts/99")).andExpect(status().isNotFound());
        }
    }
}

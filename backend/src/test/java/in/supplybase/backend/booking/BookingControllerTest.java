package in.supplybase.backend.booking;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import in.supplybase.backend.booking.dto.BookingFileResponse;
import in.supplybase.backend.booking.dto.BookingReceipt;
import in.supplybase.backend.booking.dto.BookingResponse;
import in.supplybase.backend.booking.dto.ProfessionalBookingResponse;
import in.supplybase.backend.support.WebSecurityTestConfig;

/**
 * {@code @WebMvcTest} slice: the service layer is mocked, and the real
 * {@link in.supplybase.backend.config.SecurityConfig} is imported (see
 * {@link WebSecurityTestConfig}) so the role-based rules on
 * {@code /api/admin/**} and {@code /api/professional/**} are exercised for
 * real rather than assumed.
 */
@WebMvcTest(BookingController.class)
@Import(WebSecurityTestConfig.class)
class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private BookingService service;

    private static RequestPostProcessor asUser(long id, Role role) {
        AuthenticatedUser principal = new AuthenticatedUser(id, "user" + id + "@example.com", role);
        var auth = new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority(role.authority())));
        return authentication(auth);
    }

    private static final String CREATE_BOOKING_JSON = """
            {
              "serviceSlug": "plumbing",
              "answers": [],
              "preferredDate": "%s",
              "preferredTime": "10:00:00",
              "name": "Asha Rao",
              "phone": "9820011223",
              "address": "12 MG Road",
              "city": "Mumbai",
              "pincode": "400001",
              "areaSqft": 800
            }
            """.formatted(LocalDate.now().plusDays(3));

    private static BookingReceipt sampleReceipt() {
        return new BookingReceipt("SB-20260906-000001", BookingStatus.PAYMENT_PENDING,
                "Plumbing", LocalDate.now().plusDays(3), LocalTime.of(10, 0),
                new java.math.BigDecimal("25.00"), "₹25.00", "Your booking is reserved.");
    }

    @Nested
    @DisplayName("POST /api/bookings — public")
    class CreateBooking {

        @Test
        @DisplayName("works without any authenticated principal")
        void worksAnonymously() throws Exception {
            when(service.create(any(), isNull())).thenReturn(sampleReceipt());

            mockMvc.perform(post("/api/bookings")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(CREATE_BOOKING_JSON))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.bookingNumber").value("SB-20260906-000001"));

            verify(service).create(any(), isNull());
        }

        @Test
        @DisplayName("attaches the booking to a signed-in principal when one is present")
        void attachesSignedInUser() throws Exception {
            when(service.create(any(), eq(42L))).thenReturn(sampleReceipt());

            mockMvc.perform(post("/api/bookings")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(CREATE_BOOKING_JSON)
                            .with(asUser(42L, Role.CUSTOMER)))
                    .andExpect(status().isCreated());

            verify(service).create(any(), eq(42L));
        }
    }

    @Nested
    @DisplayName("GET /api/bookings/mine")
    class Mine {

        @Test
        void anonymousIsUnauthorized() throws Exception {
            mockMvc.perform(get("/api/bookings/mine"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void authenticatedCustomerSeesTheirBookings() throws Exception {
            when(service.myBookings(42L)).thenReturn(List.of());

            mockMvc.perform(get("/api/bookings/mine").with(asUser(42L, Role.CUSTOMER)))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("/api/admin/bookings/** — staff only")
    class AdminBookings {

        @Test
        void listIsUnauthorizedAnonymously() throws Exception {
            mockMvc.perform(get("/api/admin/bookings"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void listIsForbiddenForACustomer() throws Exception {
            mockMvc.perform(get("/api/admin/bookings").with(asUser(1L, Role.CUSTOMER)))
                    .andExpect(status().isForbidden());
        }

        @Test
        void listIsForbiddenForAProfessional() throws Exception {
            mockMvc.perform(get("/api/admin/bookings").with(asUser(1L, Role.PROFESSIONAL)))
                    .andExpect(status().isForbidden());
        }

        @Test
        void listSucceedsForAnAdmin() throws Exception {
            Page<BookingResponse> page = new PageImpl<>(List.of());
            when(service.list(any(), any(), any())).thenReturn(page);

            mockMvc.perform(get("/api/admin/bookings").with(asUser(1L, Role.ADMIN)))
                    .andExpect(status().isOk());
        }

        @Test
        void updateSucceedsForAnAdmin() throws Exception {
            when(service.update(eq(9L), any())).thenReturn(sampleBookingResponse());

            mockMvc.perform(patch("/api/admin/bookings/9")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"status": "CONFIRMED"}
                                    """)
                            .with(asUser(1L, Role.ADMIN)))
                    .andExpect(status().isOk());
        }

        @Test
        void updateIsForbiddenForAProfessional() throws Exception {
            mockMvc.perform(patch("/api/admin/bookings/9")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"status": "CONFIRMED"}
                                    """)
                            .with(asUser(1L, Role.PROFESSIONAL)))
                    .andExpect(status().isForbidden());
        }

        @Test
        void assignSucceedsForAnAdmin() throws Exception {
            when(service.assignProfessional(eq(9L), eq(5L))).thenReturn(sampleBookingResponse());

            mockMvc.perform(patch("/api/admin/bookings/9/assign")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"professionalId": 5}
                                    """)
                            .with(asUser(1L, Role.ADMIN)))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("multipart file upload is admin-only and binds the file part")
        void uploadFileSucceedsForAnAdmin() throws Exception {
            MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[] { 1, 2 });
            when(service.uploadFile(eq(9L), eq("PHOTO"), any(), eq(1L)))
                    .thenReturn(new BookingFileResponse(1L, "photo.jpg", "image/jpeg", 2L, "PHOTO", null));

            mockMvc.perform(multipart("/api/admin/bookings/9/files")
                            .file(file)
                            .param("kind", "PHOTO")
                            .with(asUser(1L, Role.ADMIN)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.originalName").value("photo.jpg"));
        }

        @Test
        void uploadFileIsUnauthorizedAnonymously() throws Exception {
            MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[] { 1 });

            mockMvc.perform(multipart("/api/admin/bookings/9/files").file(file))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void uploadFileIsForbiddenForACustomer() throws Exception {
            MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[] { 1 });

            mockMvc.perform(multipart("/api/admin/bookings/9/files")
                            .file(file)
                            .with(asUser(1L, Role.CUSTOMER)))
                    .andExpect(status().isForbidden());
        }

        private BookingResponse sampleBookingResponse() {
            return new BookingResponse(9L, "BK-260906-ABCD", "SB-20260906-000001",
                    BookingType.SERVICE, BookingStatus.CONFIRMED,
                    "plumbing", "Plumbing", null, null, null, null, null, null, null,
                    LocalDate.now().plusDays(3), "10:00 AM",
                    "Asha Rao", "9820011223", null, null, null, null,
                    false, null, null, null, null);
        }
    }

    @Nested
    @DisplayName("/api/professional/bookings/** — professional or admin")
    class ProfessionalBookings {

        @Test
        void mineIsForbiddenForACustomer() throws Exception {
            mockMvc.perform(get("/api/professional/bookings/mine").with(asUser(1L, Role.CUSTOMER)))
                    .andExpect(status().isForbidden());
        }

        @Test
        void mineSucceedsForAProfessional() throws Exception {
            when(service.myAssignedBookings(5L)).thenReturn(List.of());

            mockMvc.perform(get("/api/professional/bookings/mine").with(asUser(5L, Role.PROFESSIONAL)))
                    .andExpect(status().isOk());
        }

        @Test
        void mineSucceedsForAnAdmin() throws Exception {
            when(service.myAssignedBookings(1L)).thenReturn(List.of());

            mockMvc.perform(get("/api/professional/bookings/mine").with(asUser(1L, Role.ADMIN)))
                    .andExpect(status().isOk());
        }

        @Test
        void mineIsUnauthorizedAnonymously() throws Exception {
            mockMvc.perform(get("/api/professional/bookings/mine"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void advanceStatusSucceedsForAProfessional() throws Exception {
            when(service.advanceOwnBookingStatus(eq(9L), eq(BookingStatus.SITE_VISIT_COMPLETED), eq(5L)))
                    .thenReturn(new ProfessionalBookingResponse(9L, "BK-1", "SB-1", BookingType.SERVICE,
                            BookingStatus.SITE_VISIT_COMPLETED, "Plumbing", null, null, null, null, null,
                            null, null, "Asha Rao", "9820011223", null, null, null, false, null));

            mockMvc.perform(patch("/api/professional/bookings/9/status")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"status": "SITE_VISIT_COMPLETED"}
                                    """)
                            .with(asUser(5L, Role.PROFESSIONAL)))
                    .andExpect(status().isOk());
        }

        @Test
        void advanceStatusIsForbiddenForACustomer() throws Exception {
            mockMvc.perform(patch("/api/professional/bookings/9/status")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"status": "SITE_VISIT_COMPLETED"}
                                    """)
                            .with(asUser(1L, Role.CUSTOMER)))
                    .andExpect(status().isForbidden());
        }
    }
}

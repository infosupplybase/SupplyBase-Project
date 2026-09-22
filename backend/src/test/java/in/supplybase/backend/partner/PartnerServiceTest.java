package in.supplybase.backend.partner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;

import in.supplybase.backend.auth.AuthService;
import in.supplybase.backend.auth.Role;
import in.supplybase.backend.auth.User;
import in.supplybase.backend.auth.UserRepository;
import in.supplybase.backend.auth.dto.AuthResponse;
import in.supplybase.backend.auth.dto.RegisterRequest;
import in.supplybase.backend.auth.dto.UserResponse;
import in.supplybase.backend.booking.BookingRepository;
import in.supplybase.backend.catalogue.ServiceCategory;
import in.supplybase.backend.catalogue.ServiceCategoryRepository;
import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.partner.dto.ApplyAsPartnerRequest;
import in.supplybase.backend.partner.dto.PartnerDetailResponse;

/**
 * The rules that matter for partners: nobody becomes a PROFESSIONAL by
 * applying, only an admin approving an application grants the role, and the
 * role always follows the application's status.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PartnerServiceTest {

    private static final long ADMIN_ID = 99L;
    private static final long PARTNER_ID = 5L;

    @Mock
    private PartnerProfileRepository partners;
    @Mock
    private UserRepository users;
    @Mock
    private BookingRepository bookings;
    @Mock
    private ServiceCategoryRepository categories;
    @Mock
    private AuthService authService;

    private PartnerService service;

    @BeforeEach
    void setUp() {
        service = new PartnerService(partners, users, bookings, categories, authService);
        when(categories.findAllByOrderBySortOrderAsc()).thenReturn(List.of(category("electrical", "Electrical", null)));
        when(bookings.findByAssignedProfessionalIdOrderByCreatedAtDesc(any())).thenReturn(List.of());
    }

    private static ServiceCategory category(String slug, String name, String parentSlug) {
        return ServiceCategory.builder().slug(slug).name(name).parentSlug(parentSlug).build();
    }

    private static User user(long id, Role role) {
        return User.builder().id(id).email("u" + id + "@example.com").fullName("User " + id)
                .phone("9820011223").role(role).enabled(true).build();
    }

    private PartnerProfile profileWithStatus(PartnerStatus status, Role role) {
        PartnerProfile profile = PartnerProfile.builder()
                .id(1L).user(user(PARTNER_ID, role)).primaryTrade("electrical")
                .experienceYears(4).city("Mumbai").status(status).build();
        when(partners.findByUserId(PARTNER_ID)).thenReturn(Optional.of(profile));
        return profile;
    }

    private static ApplyAsPartnerRequest applyRequest(String trade) {
        return new ApplyAsPartnerRequest("Ravi Kumar", "ravi@example.com", "9820011223", "password123",
                trade, 6, "  Thane  ", "  ", "Hindi, Marathi");
    }

    private static AuthResponse authFor(long userId) {
        UserResponse u = new UserResponse(userId, "Ravi Kumar", "ravi@example.com", "9820011223",
                null, null, null, null, null, null, Role.CUSTOMER, null, true, true, false);
        return AuthResponse.of("access", "refresh", 900, u);
    }

    @Nested
    @DisplayName("apply")
    class Apply {

        @Test
        @DisplayName("creates a PENDING application and never grants the PROFESSIONAL role")
        void createsPendingApplication() {
            when(categories.findBySlugAndActiveTrue("electrical"))
                    .thenReturn(Optional.of(category("electrical", "Electrical", null)));
            when(authService.register(any(RegisterRequest.class), any())).thenReturn(authFor(7L));
            when(users.getReferenceById(7L)).thenReturn(user(7L, Role.CUSTOMER));

            AuthResponse result = service.apply(applyRequest("electrical"), "1.2.3.4");

            ArgumentCaptor<PartnerProfile> saved = ArgumentCaptor.forClass(PartnerProfile.class);
            verify(partners).save(saved.capture());
            assertThat(saved.getValue().getStatus()).isEqualTo(PartnerStatus.PENDING);
            assertThat(saved.getValue().getPrimaryTrade()).isEqualTo("electrical");
            assertThat(saved.getValue().getCity()).isEqualTo("Thane");
            assertThat(saved.getValue().getServiceAreas()).isNull();
            assertThat(saved.getValue().getUser().getRole()).isEqualTo(Role.CUSTOMER);
            assertThat(result.user().role()).isEqualTo(Role.CUSTOMER);
        }

        @Test
        @DisplayName("rejects an unknown trade before creating any account")
        void rejectsUnknownTrade() {
            when(categories.findBySlugAndActiveTrue("astrology")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.apply(applyRequest("astrology"), "1.2.3.4"))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.BAD_REQUEST);

            verify(authService, never()).register(any(), any());
            verify(partners, never()).save(any());
        }

        @Test
        @DisplayName("rejects a sub-service slug — a partner picks a main trade")
        void rejectsSubService() {
            when(categories.findBySlugAndActiveTrue("wiring"))
                    .thenReturn(Optional.of(category("wiring", "Wiring", "electrical")));

            assertThatThrownBy(() -> service.apply(applyRequest("wiring"), "1.2.3.4"))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.BAD_REQUEST);

            verify(authService, never()).register(any(), any());
        }
    }

    @Nested
    @DisplayName("review")
    class Review {

        @Test
        @DisplayName("approving grants the PROFESSIONAL role")
        void approveGrantsRole() {
            PartnerProfile profile = profileWithStatus(PartnerStatus.PENDING, Role.CUSTOMER);

            PartnerDetailResponse result = service.review(PARTNER_ID, PartnerStatus.APPROVED, null, ADMIN_ID);

            assertThat(profile.getStatus()).isEqualTo(PartnerStatus.APPROVED);
            assertThat(profile.getUser().getRole()).isEqualTo(Role.PROFESSIONAL);
            assertThat(profile.getReviewedBy()).isEqualTo(ADMIN_ID);
            assertThat(profile.getReviewedAt()).isNotNull();
            assertThat(result.role()).isEqualTo(Role.PROFESSIONAL);
            assertThat(result.tradeLabel()).isEqualTo("Electrical");
            verify(users).save(profile.getUser());
        }

        @Test
        @DisplayName("rejecting needs a reason and leaves the account a customer")
        void rejectNeedsReason() {
            PartnerProfile profile = profileWithStatus(PartnerStatus.PENDING, Role.CUSTOMER);

            assertThatThrownBy(() -> service.review(PARTNER_ID, PartnerStatus.REJECTED, "   ", ADMIN_ID))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(profile.getStatus()).isEqualTo(PartnerStatus.PENDING);

            service.review(PARTNER_ID, PartnerStatus.REJECTED, " Please add your experience ", ADMIN_ID);

            assertThat(profile.getStatus()).isEqualTo(PartnerStatus.REJECTED);
            assertThat(profile.getReviewNote()).isEqualTo("Please add your experience");
            assertThat(profile.getUser().getRole()).isEqualTo(Role.CUSTOMER);
        }

        @Test
        @DisplayName("suspending takes the PROFESSIONAL role away, reinstating gives it back")
        void suspendAndReinstate() {
            PartnerProfile profile = profileWithStatus(PartnerStatus.APPROVED, Role.PROFESSIONAL);

            service.review(PARTNER_ID, PartnerStatus.SUSPENDED, "Customer complaint", ADMIN_ID);
            assertThat(profile.getStatus()).isEqualTo(PartnerStatus.SUSPENDED);
            assertThat(profile.getUser().getRole()).isEqualTo(Role.CUSTOMER);

            service.review(PARTNER_ID, PartnerStatus.APPROVED, null, ADMIN_ID);
            assertThat(profile.getStatus()).isEqualTo(PartnerStatus.APPROVED);
            assertThat(profile.getUser().getRole()).isEqualTo(Role.PROFESSIONAL);
            assertThat(profile.getReviewNote()).isNull();
        }

        @Test
        @DisplayName("refuses moves that are not allowed")
        void refusesInvalidMoves() {
            profileWithStatus(PartnerStatus.PENDING, Role.CUSTOMER);
            assertBadRequest(PartnerStatus.SUSPENDED);
            assertBadRequest(PartnerStatus.PENDING);

            profileWithStatus(PartnerStatus.APPROVED, Role.PROFESSIONAL);
            assertBadRequest(PartnerStatus.REJECTED);
            assertBadRequest(PartnerStatus.APPROVED);
        }

        private void assertBadRequest(PartnerStatus target) {
            assertThatThrownBy(() -> service.review(PARTNER_ID, target, "reason", ADMIN_ID))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.BAD_REQUEST);
        }

        @Test
        @DisplayName("an admin cannot review their own account")
        void cannotReviewSelf() {
            assertThatThrownBy(() -> service.review(ADMIN_ID, PartnerStatus.APPROVED, null, ADMIN_ID))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.BAD_REQUEST);
        }

        @Test
        @DisplayName("an admin-role account is never downgraded by a partner review")
        void neverTouchesAnAdmin() {
            PartnerProfile profile = profileWithStatus(PartnerStatus.PENDING, Role.ADMIN);

            assertThatThrownBy(() -> service.review(PARTNER_ID, PartnerStatus.REJECTED, "no", ADMIN_ID))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.BAD_REQUEST);

            assertThat(profile.getUser().getRole()).isEqualTo(Role.ADMIN);
            verify(users, never()).save(any());
        }

        @Test
        @DisplayName("404s for someone who never applied")
        void unknownPartner() {
            when(partners.findByUserId(404L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.review(404L, PartnerStatus.APPROVED, null, ADMIN_ID))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.NOT_FOUND);
        }
    }

    @Nested
    @DisplayName("myProfile")
    class MyProfile {

        @Test
        @DisplayName("returns the application with the trade's display name")
        void returnsApplication() {
            profileWithStatus(PartnerStatus.PENDING, Role.CUSTOMER);

            var result = service.myProfile(PARTNER_ID);

            assertThat(result.status()).isEqualTo(PartnerStatus.PENDING);
            assertThat(result.tradeLabel()).isEqualTo("Electrical");
        }

        @Test
        @DisplayName("404s when the account never applied")
        void neverApplied() {
            when(partners.findByUserId(8L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.myProfile(8L))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.NOT_FOUND);
        }
    }
}

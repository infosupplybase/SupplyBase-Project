package in.supplybase.backend.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.same;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
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
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.web.MockMultipartFile;

import in.supplybase.backend.appointment.AppointmentService;
import in.supplybase.backend.appointment.AppointmentSlot;
import in.supplybase.backend.auth.AuthenticatedUser;
import in.supplybase.backend.auth.Role;
import in.supplybase.backend.auth.User;
import in.supplybase.backend.auth.UserRepository;
import in.supplybase.backend.booking.dto.BookingReceipt;
import in.supplybase.backend.booking.dto.BookingResponse;
import in.supplybase.backend.booking.dto.CreateBookingRequest;
import in.supplybase.backend.booking.dto.ProfessionalBookingResponse;
import in.supplybase.backend.booking.dto.UpdateBookingRequest;
import in.supplybase.backend.booking.dto.UpdateMyBookingRequest;
import in.supplybase.backend.catalogue.CatalogueService;
import in.supplybase.backend.catalogue.ServiceCategory;
import in.supplybase.backend.catalogue.ServiceOption;
import in.supplybase.backend.catalogue.ServiceOptionRepository;
import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.FileStorageService;
import in.supplybase.backend.config.AppProperties;
import in.supplybase.backend.notification.NotificationRepository;

/**
 * Mockito-only tests: every collaborator is mocked, nothing touches a
 * database. {@code AppProperties} is built as a plain record rather than
 * mocked — it is a {@code @ConfigurationProperties} record (implicitly
 * final), and mocking a record with the default Mockito mock maker either
 * fails or returns nulls from its accessors, so a real, minimal instance is
 * both simpler and safer.
 */
@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock private BookingRepository bookings;
    @Mock private BookingAnswerRepository answers;
    @Mock private UserRepository users;
    @Mock private CatalogueService catalogue;
    @Mock private ServiceOptionRepository options;
    @Mock private AppointmentService appointments;
    @Mock private BookingNumbers bookingNumbers;
    @Mock private ObjectProvider<JavaMailSender> mailSender;
    @Mock private BookingFileRepository files;
    @Mock private FileStorageService storage;
    @Mock private NotificationRepository notifications;
    @Mock private in.supplybase.backend.payment.RazorpayService razorpay;

    private BookingService service;

    @BeforeEach
    void setUp() {
        AppProperties props = new AppProperties(
                List.of("*"), null, null, null,
                new AppProperties.Notifications(null), // email disabled: no recipient configured
                null, null, new AppProperties.Booking(30), null);
        service = new BookingService(bookings, answers, users, catalogue, options, appointments,
                bookingNumbers, props, mailSender, files, storage, notifications, razorpay);
        // Online payment is switched on unless a test says otherwise.
        org.mockito.Mockito.lenient().when(razorpay.isConfigured()).thenReturn(true);
    }

    private static ServiceCategory plumbingCategory() {
        return ServiceCategory.builder()
                .id(1L).slug("plumbing").name("Plumbing")
                .visitFeePaise(2500L).active(true).build();
    }

    private static CreateBookingRequest requestFor(LocalDate date, LocalTime time,
                                                    List<CreateBookingRequest.AnswerInput> answerInputs) {
        return new CreateBookingRequest(
                "plumbing", answerInputs, date, time,
                "Asha Rao", "9820011223", null, "asha@example.com",
                "12 MG Road", "Mumbai", "400001", 800);
    }

    @Nested
    @DisplayName("create")
    class Create {

        @Test
        @DisplayName("reserves a slot and stores the submitted answers")
        void success() {
            ServiceCategory category = plumbingCategory();
            LocalDate date = LocalDate.now().plusDays(3);
            LocalTime time = LocalTime.of(10, 0);

            when(catalogue.requireCategory("plumbing")).thenReturn(category);
            // The flood check counts this service's bookings only.
            when(bookings.countByPhoneAndCategoryAndCreatedAtAfter(eq("9820011223"), same(category), any(Instant.class)))
                    .thenReturn(0L);

            AppointmentSlot slot = AppointmentSlot.builder()
                    .id(9L).slotDate(date).slotTime(time).categoryId(1L)
                    .capacity(3).bookedCount(1).build();
            when(appointments.reserve(1L, date, time)).thenReturn(slot);

            when(bookingNumbers.next()).thenReturn("SB-20260906-000001");
            when(bookings.save(any(Booking.class))).thenAnswer(inv -> {
                Booking b = inv.getArgument(0);
                b.setId(100L);
                return b;
            });

            ServiceOption question = ServiceOption.builder()
                    .categoryId(1L).stepNo(1).questionKey("issue")
                    .questionText("What is the issue?").inputType("SINGLE")
                    .optionValue("leak").optionLabel("Leak").active(true).build();
            when(options.findByCategoryIdAndActiveTrueOrderByStepNoAscSortOrderAsc(1L))
                    .thenReturn(List.of(question));

            CreateBookingRequest request = requestFor(date, time,
                    List.of(new CreateBookingRequest.AnswerInput("issue", "leak", "Leaking pipe", null)));

            BookingReceipt receipt = service.create(request, null);

            verify(appointments).reserve(1L, date, time);

            ArgumentCaptor<Booking> savedCaptor = ArgumentCaptor.forClass(Booking.class);
            verify(bookings).save(savedCaptor.capture());
            Booking saved = savedCaptor.getValue();
            assertThat(saved.getStatus()).isEqualTo(BookingStatus.PAYMENT_PENDING);
            // Every booking pays the flat ₹99 visiting fee, whatever the
            // category's own fee, and its payment window starts now.
            assertThat(saved.getVisitFeePaise()).isEqualTo(9900L);
            assertThat(saved.getOnlineCheckoutAt()).isNotNull();
            assertThat(saved.getAppointmentSlot()).isSameAs(slot);
            assertThat(saved.getPhone()).isEqualTo("9820011223");

            ArgumentCaptor<List<BookingAnswer>> answersCaptor = ArgumentCaptor.forClass(List.class);
            verify(answers).saveAll(answersCaptor.capture());
            assertThat(answersCaptor.getValue()).hasSize(1);
            BookingAnswer storedAnswer = answersCaptor.getValue().get(0);
            assertThat(storedAnswer.getBookingId()).isEqualTo(100L);
            assertThat(storedAnswer.getQuestionKey()).isEqualTo("issue");
            // The question text is copied from the catalogue, not the request.
            assertThat(storedAnswer.getQuestionText()).isEqualTo("What is the issue?");
            assertThat(storedAnswer.getAnswerValue()).isEqualTo("leak");

            assertThat(receipt.bookingNumber()).isEqualTo("SB-20260906-000001");
            assertThat(receipt.status()).isEqualTo(BookingStatus.PAYMENT_PENDING);
            assertThat(receipt.serviceName()).isEqualTo("Plumbing");
        }

        @Test
        @DisplayName("takes no booking while online payment is switched off")
        void refusesWithoutOnlinePayments() {
            when(razorpay.isConfigured()).thenReturn(false);

            assertThatThrownBy(() -> service.create(
                    requestFor(LocalDate.now().plusDays(3), LocalTime.of(10, 0), List.of()), null))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Online booking is not available");
            verifyNoInteractions(appointments);
            verify(bookings, never()).save(any());
        }

        @Test
        @DisplayName("keeps the waterproofing service alongside the brand")
        void waterproofingKeepsService() {
            ServiceCategory category = ServiceCategory.builder()
                    .id(7L).slug("waterproofing").name("Waterproofing")
                    .visitFeePaise(9900L).active(true).build();
            LocalDate date = LocalDate.now().plusDays(3);
            LocalTime time = LocalTime.of(10, 0);

            when(catalogue.requireCategory("waterproofing")).thenReturn(category);
            when(bookings.countByPhoneAndCategoryAndCreatedAtAfter(any(), any(), any())).thenReturn(0L);
            when(appointments.reserve(anyLong(), any(), any()))
                    .thenReturn(AppointmentSlot.builder().id(1L).capacity(1).bookedCount(1).build());
            when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
            when(options.findByCategoryIdAndActiveTrueOrderByStepNoAscSortOrderAsc(7L))
                    .thenReturn(List.of(
                            ServiceOption.builder().categoryId(7L).stepNo(1)
                                    .questionKey("service_needed")
                                    .questionText("What waterproofing service do you need?")
                                    .inputType("MULTI").optionValue("Water Tank Waterproofing")
                                    .optionLabel("Water Tank Waterproofing").active(true).build(),
                            ServiceOption.builder().categoryId(7L).stepNo(1)
                                    .questionKey("service_needed")
                                    .questionText("What waterproofing service do you need?")
                                    .inputType("MULTI").optionValue("Bathroom Waterproofing")
                                    .optionLabel("Bathroom Waterproofing").active(true).build(),
                            ServiceOption.builder().categoryId(7L).stepNo(2)
                                    .questionKey("wp_brand").questionText("Preferred brand")
                                    .inputType("SINGLE").optionValue("asian-paints")
                                    .optionLabel("Asian Paints").active(true).build()));

            CreateBookingRequest request = new CreateBookingRequest(
                    "waterproofing",
                    List.of(new CreateBookingRequest.AnswerInput(
                                    "service_needed", "Bathroom Waterproofing",
                                    "Bathroom Floor Waterproofing", null),
                            new CreateBookingRequest.AnswerInput(
                                    "wp_brand", "asian-paints", "Asian Paints", null)),
                    date, time, "Asha Rao", "9820011223", null, null,
                    "12 MG Road", "Mumbai", "400001", null);

            service.create(request, null);

            ArgumentCaptor<List<BookingAnswer>> answersCaptor = ArgumentCaptor.forClass(List.class);
            verify(answers).saveAll(answersCaptor.capture());
            assertThat(answersCaptor.getValue())
                    .extracting(BookingAnswer::getQuestionKey, BookingAnswer::getAnswerLabel)
                    .containsExactly(
                            org.assertj.core.groups.Tuple.tuple(
                                    "service_needed", "Bathroom Floor Waterproofing"),
                            org.assertj.core.groups.Tuple.tuple("wp_brand", "Asian Paints"));
        }

        @Test
        @DisplayName("attaches the booking to the signed-in user when one is present")
        void attachesSignedInUser() {
            ServiceCategory category = plumbingCategory();
            LocalDate date = LocalDate.now().plusDays(3);
            LocalTime time = LocalTime.of(10, 0);

            when(catalogue.requireCategory("plumbing")).thenReturn(category);
            when(bookings.countByPhoneAndCategoryAndCreatedAtAfter(any(), any(), any())).thenReturn(0L);
            when(appointments.reserve(anyLong(), any(), any()))
                    .thenReturn(AppointmentSlot.builder().id(1L).capacity(1).bookedCount(1).build());
            when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

            User account = User.builder().id(42L).fullName("Asha Rao").role(Role.CUSTOMER).build();
            when(users.findById(42L)).thenReturn(Optional.of(account));

            service.create(requestFor(date, time, null), 42L);

            ArgumentCaptor<Booking> savedCaptor = ArgumentCaptor.forClass(Booking.class);
            verify(bookings).save(savedCaptor.capture());
            assertThat(savedCaptor.getValue().getUser()).isSameAs(account);
        }

        @Test
        @DisplayName("refuses a sixth booking for the same service from the same phone within an hour")
        void rejectsWhenRateLimited() {
            when(catalogue.requireCategory("plumbing")).thenReturn(plumbingCategory());
            when(bookings.countByPhoneAndCategoryAndCreatedAtAfter(eq("9820011223"), any(), any(Instant.class)))
                    .thenReturn(5L);

            CreateBookingRequest request =
                    requestFor(LocalDate.now().plusDays(1), LocalTime.of(10, 0), null);

            assertThatThrownBy(() -> service.create(request, null))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("5 Plumbing bookings from this number in the last hour")
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.BAD_REQUEST);

            verifyNoInteractions(appointments);
            verify(bookings, never()).save(any());
        }

        @Test
        @DisplayName("propagates the conflict when the slot is no longer available")
        void propagatesSlotConflict() {
            when(catalogue.requireCategory("plumbing")).thenReturn(plumbingCategory());
            when(bookings.countByPhoneAndCategoryAndCreatedAtAfter(any(), any(), any())).thenReturn(0L);
            when(appointments.reserve(anyLong(), any(), any()))
                    .thenThrow(ApiException.conflict(
                            "This time slot is no longer available. Please select another time."));

            CreateBookingRequest request =
                    requestFor(LocalDate.now().plusDays(1), LocalTime.of(10, 0), null);

            assertThatThrownBy(() -> service.create(request, null))
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.CONFLICT);

            verify(bookings, never()).save(any());
            verifyNoInteractions(answers);
        }
    }

    @Nested
    @DisplayName("read paths")
    class Reads {

        @Test
        void listDelegatesByStatus() {
            Booking booking = Booking.builder().id(1L).status(BookingStatus.CONFIRMED).build();
            Page<Booking> page = new PageImpl<>(List.of(booking));
            when(bookings.findByStatusOrderByCreatedAtDesc(eq(BookingStatus.CONFIRMED), any()))
                    .thenReturn(page);

            Page<BookingResponse> result =
                    service.list(BookingStatus.CONFIRMED, null, PageRequest.of(0, 20));

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).id()).isEqualTo(1L);
            verify(bookings, never()).findAllByOrderByCreatedAtDesc(any());
        }

        @Test
        void listDelegatesByType() {
            Page<Booking> page = new PageImpl<>(List.of(Booking.builder().id(2L).build()));
            when(bookings.findByBookingTypeOrderByCreatedAtDesc(eq(BookingType.PROJECT), any()))
                    .thenReturn(page);

            Page<BookingResponse> result = service.list(null, BookingType.PROJECT, PageRequest.of(0, 20));

            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        void listDefaultsToEverythingWhenNoFilter() {
            when(bookings.findAllByOrderByCreatedAtDesc(any()))
                    .thenReturn(new PageImpl<>(List.of()));

            service.list(null, null, PageRequest.of(0, 20));

            verify(bookings).findAllByOrderByCreatedAtDesc(any());
        }

        @Test
        void forDateOrdersBySlot() {
            LocalDate date = LocalDate.now().plusDays(1);
            when(bookings.findByPreferredDateOrderByPreferredSlotAsc(date))
                    .thenReturn(List.of(Booking.builder().id(3L).preferredDate(date).build()));

            List<BookingResponse> result = service.forDate(date);

            assertThat(result).extracting(BookingResponse::id).containsExactly(3L);
        }

        @Test
        void myBookingsReturnsOnlyThatUsersBookings() {
            when(bookings.findByUserIdOrderByCreatedAtDesc(7L))
                    .thenReturn(List.of(Booking.builder().id(4L).build()));

            assertThat(service.myBookings(7L)).extracting(BookingResponse::id).containsExactly(4L);
        }
    }

    @Nested
    @DisplayName("update")
    class Update {

        @Test
        void updatesStatusAndNotes() {
            Booking booking = Booking.builder().id(1L).status(BookingStatus.CONFIRMED).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateBookingRequest request = new UpdateBookingRequest(BookingStatus.ASSIGNMENT_PENDING, "notes");
            BookingResponse response = service.update(1L, request);

            assertThat(response.status()).isEqualTo(BookingStatus.ASSIGNMENT_PENDING);
            assertThat(booking.getAdminNotes()).isEqualTo("notes");
            verifyNoInteractions(appointments);
        }

        @Test
        @DisplayName("a booking already in a final status cannot be changed")
        void rejectsChangingAFinalBooking() {
            Booking booking = Booking.builder().id(1L).status(BookingStatus.CANCELLED).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));

            UpdateBookingRequest request = new UpdateBookingRequest(BookingStatus.CONFIRMED, null);

            assertThatThrownBy(() -> service.update(1L, request))
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.BAD_REQUEST);

            verify(bookings, never()).save(any());
        }

        @Test
        @DisplayName("cancelling releases the held appointment slot")
        void cancellingReleasesTheSlot() {
            AppointmentSlot slot = AppointmentSlot.builder().id(5L).capacity(2).bookedCount(1).build();
            Booking booking = Booking.builder().id(1L).status(BookingStatus.CONFIRMED)
                    .appointmentSlot(slot).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateBookingRequest request = new UpdateBookingRequest(BookingStatus.CANCELLED, null);
            service.update(1L, request);

            verify(appointments).release(slot);
        }

        @Test
        @DisplayName("cancelling a booking with no held slot releases nothing")
        void cancellingWithNoSlotReleasesNothing() {
            Booking booking = Booking.builder().id(1L).status(BookingStatus.CONFIRMED).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

            service.update(1L, new UpdateBookingRequest(BookingStatus.CANCELLED, null));

            verifyNoInteractions(appointments);
        }

        @Test
        void missingBookingIsNotFound() {
            when(bookings.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.update(99L, new UpdateBookingRequest(BookingStatus.CONFIRMED, null)))
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.NOT_FOUND);
        }
    }

    @Nested
    @DisplayName("assignProfessional")
    class AssignProfessional {

        @Test
        void assignsFromConfirmed() {
            Booking booking = Booking.builder().id(1L).status(BookingStatus.CONFIRMED).build();
            User professional = User.builder().id(5L).role(Role.PROFESSIONAL).fullName("Pro").build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            when(users.findById(5L)).thenReturn(Optional.of(professional));
            when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

            BookingResponse response = service.assignProfessional(1L, 5L);

            assertThat(response.status()).isEqualTo(BookingStatus.PROFESSIONAL_ASSIGNED);
            assertThat(booking.getAssignedProfessional()).isSameAs(professional);
        }

        @Test
        void assignsFromAssignmentPending() {
            Booking booking = Booking.builder().id(1L).status(BookingStatus.ASSIGNMENT_PENDING).build();
            User professional = User.builder().id(5L).role(Role.PROFESSIONAL).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            when(users.findById(5L)).thenReturn(Optional.of(professional));
            when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

            assertThat(service.assignProfessional(1L, 5L).status())
                    .isEqualTo(BookingStatus.PROFESSIONAL_ASSIGNED);
        }

        @Test
        @DisplayName("wrong status is a conflict, not a bad request")
        void wrongStatusGuard() {
            Booking booking = Booking.builder().id(1L).status(BookingStatus.PAYMENT_PENDING).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));

            assertThatThrownBy(() -> service.assignProfessional(1L, 5L))
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.CONFLICT);

            verifyNoInteractions(users);
        }

        @Test
        void targetNotAProfessional() {
            Booking booking = Booking.builder().id(1L).status(BookingStatus.CONFIRMED).build();
            User customer = User.builder().id(5L).role(Role.CUSTOMER).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            when(users.findById(5L)).thenReturn(Optional.of(customer));

            assertThatThrownBy(() -> service.assignProfessional(1L, 5L))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("not a professional")
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.BAD_REQUEST);
        }

        @Test
        void targetUserNotFound() {
            Booking booking = Booking.builder().id(1L).status(BookingStatus.CONFIRMED).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            when(users.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.assignProfessional(1L, 99L))
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.BAD_REQUEST);
        }
    }

    @Nested
    @DisplayName("professional self-service")
    class ProfessionalSelfService {

        @Test
        void myAssignedBookingsDelegates() {
            when(bookings.findByAssignedProfessionalIdOrderByCreatedAtDesc(5L))
                    .thenReturn(List.of(Booking.builder().id(1L).build()));

            assertThat(service.myAssignedBookings(5L))
                    .extracting(ProfessionalBookingResponse::id).containsExactly(1L);
        }

        @Test
        @DisplayName("advances within the allow-listed transitions")
        void advancesAllowedTransition() {
            Booking booking = Booking.builder().id(1L).status(BookingStatus.SITE_VISIT_SCHEDULED)
                    .assignedProfessional(User.builder().id(5L).build()).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

            ProfessionalBookingResponse response =
                    service.advanceOwnBookingStatus(1L, BookingStatus.SITE_VISIT_COMPLETED, 5L);

            assertThat(response.status()).isEqualTo(BookingStatus.SITE_VISIT_COMPLETED);
        }

        @Test
        @DisplayName("a booking not assigned to the caller is 404, not 403")
        void notAssignedToCallerIsNotFound() {
            Booking booking = Booking.builder().id(1L).status(BookingStatus.SITE_VISIT_SCHEDULED)
                    .assignedProfessional(User.builder().id(999L).build()).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));

            assertThatThrownBy(() -> service.advanceOwnBookingStatus(1L, BookingStatus.SITE_VISIT_COMPLETED, 5L))
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.NOT_FOUND);

            verify(bookings, never()).save(any());
        }

        @Test
        @DisplayName("an unassigned booking is also 404, not 403")
        void unassignedBookingIsNotFound() {
            Booking booking = Booking.builder().id(1L).status(BookingStatus.SITE_VISIT_SCHEDULED).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));

            assertThatThrownBy(() -> service.advanceOwnBookingStatus(1L, BookingStatus.SITE_VISIT_COMPLETED, 5L))
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.NOT_FOUND);
        }

        @Test
        @DisplayName("a transition outside the allow-list is rejected")
        void disallowedTransitionRejected() {
            Booking booking = Booking.builder().id(1L).status(BookingStatus.SITE_VISIT_SCHEDULED)
                    .assignedProfessional(User.builder().id(5L).build()).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));

            assertThatThrownBy(() -> service.advanceOwnBookingStatus(1L, BookingStatus.WORK_SCHEDULED, 5L))
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.BAD_REQUEST);

            verify(bookings, never()).save(any());
        }

        @Test
        @DisplayName("finishing a job stamps when it was completed, once")
        void completingStampsTheCompletionTime() {
            Booking booking = Booking.builder().id(1L).status(BookingStatus.WORK_IN_PROGRESS)
                    .assignedProfessional(User.builder().id(5L).build()).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

            assertThat(booking.getCompletedAt()).isNull();
            service.advanceOwnBookingStatus(1L, BookingStatus.WORK_COMPLETED, 5L);

            assertThat(booking.getCompletedAt()).isNotNull();
            Instant first = booking.getCompletedAt();
            booking.setStatus(BookingStatus.WORK_COMPLETED); // e.g. a repeated save
            assertThat(booking.getCompletedAt()).isEqualTo(first);
        }

        @Test
        @DisplayName("a partner's own job response carries their payout, and only theirs")
        void aJobCarriesItsOwnPayout() {
            Booking booking = Booking.builder().id(1L).status(BookingStatus.WORK_COMPLETED)
                    .partnerPayoutPaise(150000L).build();
            when(bookings.findByAssignedProfessionalIdOrderByCreatedAtDesc(5L)).thenReturn(List.of(booking));

            ProfessionalBookingResponse job = service.myAssignedBookings(5L).get(0);

            assertThat(job.partnerPayoutPaise()).isEqualTo(150000L);
            assertThat(job.partnerPaidAt()).isNull();
        }

        @Test
        @DisplayName("each job carries what the customer asked for, in order, with no prices")
        void jobsCarryTheirRequirementsWithoutPrices() {
            Booking first = Booking.builder().id(1L).status(BookingStatus.WORK_SCHEDULED).build();
            Booking second = Booking.builder().id(2L).status(BookingStatus.WORK_SCHEDULED).build();
            when(bookings.findByAssignedProfessionalIdOrderByCreatedAtDesc(5L)).thenReturn(List.of(first, second));
            when(answers.findByBookingIdInOrderByIdAsc(List.of(1L, 2L))).thenReturn(List.of(
                    BookingAnswer.builder().bookingId(1L).questionKey("area").questionText("Which area?")
                            .answerValue("tv-wall").answerLabel("TV Wall").quantity(1)
                            .unitPricePaise(39900L).lineTotalPaise(39900L).build(),
                    BookingAnswer.builder().bookingId(1L).questionKey("colour").answerValue("white").quantity(2).build(),
                    BookingAnswer.builder().bookingId(2L).questionKey("area").questionText("Which area?")
                            .answerValue("kitchen").answerLabel("Kitchen Walls").quantity(1).build()));

            List<ProfessionalBookingResponse> jobs = service.myAssignedBookings(5L);

            assertThat(jobs.get(0).requirements()).extracting(ProfessionalBookingResponse.Requirement::question)
                    .containsExactly("Which area?", "colour"); // falls back to the key when no text was stored
            assertThat(jobs.get(0).requirements()).extracting(ProfessionalBookingResponse.Requirement::answer)
                    .containsExactly("TV Wall", "white");
            assertThat(jobs.get(1).requirements()).hasSize(1);
            // the partner-facing record has no field that could carry a price
            assertThat(ProfessionalBookingResponse.Requirement.class.getRecordComponents())
                    .extracting(java.lang.reflect.RecordComponent::getName)
                    .containsExactly("question", "answer", "quantity");
        }
    }

    @Nested
    @DisplayName("partner payouts")
    class PartnerPayouts {

        private final User partner = User.builder().id(5L).role(Role.PROFESSIONAL).fullName("Ravi").build();

        private Booking job(BookingStatus status) {
            Booking booking = Booking.builder().id(1L).status(status).assignedProfessional(partner).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            lenient().when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
            return booking;
        }

        private void assertRejected(Runnable call, HttpStatus expected) {
            assertThatThrownBy(call::run)
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(expected);
            verify(bookings, never()).save(any());
        }

        @Test
        @DisplayName("needs an assigned partner")
        void needsAPartner() {
            Booking booking = Booking.builder().id(1L).status(BookingStatus.CONFIRMED).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));

            assertRejected(() -> service.setPartnerPayout(1L, 100000L, false), HttpStatus.CONFLICT);
        }

        @Test
        @DisplayName("a cancelled job has no payout")
        void cancelledHasNone() {
            job(BookingStatus.CANCELLED);

            assertRejected(() -> service.setPartnerPayout(1L, 100000L, false), HttpStatus.CONFLICT);
        }

        @Test
        @DisplayName("the amount can be agreed before the work is done, without paying")
        void amountBeforeCompletion() {
            Booking booking = job(BookingStatus.WORK_IN_PROGRESS);

            service.setPartnerPayout(1L, 150000L, false);

            assertThat(booking.getPartnerPayoutPaise()).isEqualTo(150000L);
            assertThat(booking.getPartnerPaidAt()).isNull();
        }

        @Test
        @DisplayName("cannot be marked paid until the work is completed")
        void paidNeedsCompletedWork() {
            job(BookingStatus.WORK_IN_PROGRESS);

            assertRejected(() -> service.setPartnerPayout(1L, 150000L, true), HttpStatus.CONFLICT);
        }

        @Test
        @DisplayName("cannot be marked paid without a real amount")
        void paidNeedsAnAmount() {
            job(BookingStatus.WORK_COMPLETED);

            assertRejected(() -> service.setPartnerPayout(1L, null, true), HttpStatus.BAD_REQUEST);
            assertRejected(() -> service.setPartnerPayout(1L, 0L, true), HttpStatus.BAD_REQUEST);
        }

        @Test
        @DisplayName("marking paid stamps the time once; repeating it keeps the original time")
        void paidTimeIsStampedOnce() {
            Booking booking = job(BookingStatus.WORK_COMPLETED);

            service.setPartnerPayout(1L, 150000L, true);
            Instant stamped = booking.getPartnerPaidAt();
            assertThat(stamped).isNotNull();

            service.setPartnerPayout(1L, 150000L, true);
            assertThat(booking.getPartnerPaidAt()).isEqualTo(stamped);
        }

        @Test
        @DisplayName("a paid amount cannot change until it is marked unpaid")
        void paidAmountIsLocked() {
            Booking booking = job(BookingStatus.WORK_COMPLETED);
            booking.setPartnerPayoutPaise(150000L);
            booking.setPartnerPaidAt(Instant.now());

            assertRejected(() -> service.setPartnerPayout(1L, 170000L, true), HttpStatus.CONFLICT);
            assertThat(booking.getPartnerPayoutPaise()).isEqualTo(150000L);

            // reopening it first is allowed, and clears the paid time
            service.setPartnerPayout(1L, 170000L, false);
            assertThat(booking.getPartnerPayoutPaise()).isEqualTo(170000L);
            assertThat(booking.getPartnerPaidAt()).isNull();
        }

        @Test
        @DisplayName("moving a job to another partner drops the payout agreed with the first")
        void reassigningClearsThePayout() {
            Booking booking = job(BookingStatus.ASSIGNMENT_PENDING);
            booking.setPartnerPayoutPaise(150000L);
            User other = User.builder().id(6L).role(Role.PROFESSIONAL).build();
            when(users.findById(6L)).thenReturn(Optional.of(other));

            service.assignProfessional(1L, 6L);

            assertThat(booking.getAssignedProfessional()).isSameAs(other);
            assertThat(booking.getPartnerPayoutPaise()).isNull();
        }

        @Test
        @DisplayName("assigning the same partner again keeps the payout")
        void sameAssigneeKeepsThePayout() {
            Booking booking = job(BookingStatus.ASSIGNMENT_PENDING);
            booking.setPartnerPayoutPaise(150000L);
            when(users.findById(5L)).thenReturn(Optional.of(partner));

            service.assignProfessional(1L, 5L);

            assertThat(booking.getPartnerPayoutPaise()).isEqualTo(150000L);
        }
    }

    @Nested
    @DisplayName("files")
    class Files {

        private final AuthenticatedUser admin = new AuthenticatedUser(1L, "admin@supplybase.in", Role.ADMIN);
        private final AuthenticatedUser owner = new AuthenticatedUser(7L, "owner@example.com", Role.CUSTOMER);
        private final AuthenticatedUser stranger = new AuthenticatedUser(8L, "stranger@example.com", Role.CUSTOMER);

        @Test
        void uploadStoresAndRecordsTheFile() {
            Booking booking = Booking.builder().id(1L).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));

            FileStorageService.StoredFile stored =
                    new FileStorageService.StoredFile("bookings/1/abc.jpg", "photo.jpg", "image/jpeg", 1024L);
            MockMultipartFile upload = new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[] { 1, 2 });
            when(storage.store(upload, "bookings/1")).thenReturn(stored);
            when(users.findById(1L)).thenReturn(Optional.of(User.builder().id(1L).build()));
            when(files.save(any(BookingFile.class))).thenAnswer(inv -> {
                BookingFile f = inv.getArgument(0);
                f.setId(50L);
                return f;
            });

            var response = service.uploadFile(1L, "PHOTO", upload, 1L);

            assertThat(response.id()).isEqualTo(50L);
            assertThat(response.originalName()).isEqualTo("photo.jpg");
        }

        private final MockMultipartFile jpeg = new MockMultipartFile("file", "wall.jpg", "image/jpeg",
                new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 16, 'J', 'F', 'I', 'F', 0, 1 });

        private Booking ownedBooking() {
            return Booking.builder().id(1L).bookingNumber("SB-20261003-000001")
                    .user(User.builder().id(7L).build()).build();
        }

        @Test
        @DisplayName("a customer can add a photo to their own booking, found by its number")
        void ownerUploadsAPhoto() {
            Booking booking = ownedBooking();
            when(bookings.findByBookingNumber("SB-20261003-000001")).thenReturn(Optional.of(booking));
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            when(files.countByBookingIdAndKind(1L, "PHOTO")).thenReturn(2L);
            when(storage.store(jpeg, "bookings/1"))
                    .thenReturn(new FileStorageService.StoredFile("bookings/1/a.jpg", "wall.jpg", "image/jpeg", 12L));
            when(users.findById(7L)).thenReturn(Optional.of(User.builder().id(7L).build()));
            when(files.save(any(BookingFile.class))).thenAnswer(inv -> inv.getArgument(0));

            var response = service.uploadOwnFile("SB-20261003-000001", owner, jpeg);

            assertThat(response.kind()).isEqualTo("PHOTO");
            verify(storage).store(jpeg, "bookings/1");
        }

        @Test
        @DisplayName("another customer cannot add to it, and nothing is stored")
        void strangerIsRefused() {
            when(bookings.findByBookingNumber("SB-20261003-000001")).thenReturn(Optional.of(ownedBooking()));

            assertThatThrownBy(() -> service.uploadOwnFile("SB-20261003-000001", stranger, jpeg))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
            verifyNoInteractions(storage);
        }

        @Test
        @DisplayName("a file that is not a photo is refused before it is stored")
        void nonPhotoIsRefused() {
            when(bookings.findByBookingNumber("SB-20261003-000001")).thenReturn(Optional.of(ownedBooking()));
            MockMultipartFile disguised = new MockMultipartFile("file", "photo.jpg", "image/jpeg",
                    "<html>not a photo</html>".getBytes());

            assertThatThrownBy(() -> service.uploadOwnFile("SB-20261003-000001", owner, disguised))
                    .isInstanceOf(ApiException.class);
            verifyNoInteractions(storage);
        }

        @Test
        @DisplayName("a booking that already has the maximum number of photos takes no more")
        void photoCap() {
            when(bookings.findByBookingNumber("SB-20261003-000001")).thenReturn(Optional.of(ownedBooking()));
            when(files.countByBookingIdAndKind(1L, "PHOTO")).thenReturn((long) in.supplybase.backend.common.PhotoUploads.MAX_PHOTOS_PER_BOOKING);

            assertThatThrownBy(() -> service.uploadOwnFile("SB-20261003-000001", owner, jpeg))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("most photos");
            verifyNoInteractions(storage);
        }

        @Test
        @DisplayName("a blank kind defaults to PHOTO")
        void uploadDefaultsKind() {
            Booking booking = Booking.builder().id(1L).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            when(storage.store(any(), eq("bookings/1")))
                    .thenReturn(new FileStorageService.StoredFile("k", "f.jpg", "image/jpeg", 10L));
            when(files.save(any(BookingFile.class))).thenAnswer(inv -> inv.getArgument(0));

            MockMultipartFile upload = new MockMultipartFile("file", "f.jpg", "image/jpeg", new byte[] { 1 });
            var response = service.uploadFile(1L, "  ", upload, null);

            assertThat(response.kind()).isEqualTo("PHOTO");
        }

        @Test
        void staffCanListAnyBookingsFiles() {
            Booking booking = Booking.builder().id(1L).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            when(files.findByBookingIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());

            assertThat(service.listFiles(1L, admin)).isEmpty();
        }

        @Test
        void ownerCanListTheirOwnBookingsFiles() {
            Booking booking = Booking.builder().id(1L)
                    .user(User.builder().id(7L).build()).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            when(files.findByBookingIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());

            assertThat(service.listFiles(1L, owner)).isEmpty();
        }

        @Test
        @DisplayName("a stranger gets 404, not 403")
        void strangerCannotListFiles() {
            Booking booking = Booking.builder().id(1L)
                    .user(User.builder().id(7L).build()).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));

            assertThatThrownBy(() -> service.listFiles(1L, stranger))
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.NOT_FOUND);
        }

        @Test
        @DisplayName("a visitor booking with no user is invisible to anyone but staff")
        void bookingWithNoUserIsStaffOnly() {
            Booking booking = Booking.builder().id(1L).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));

            assertThatThrownBy(() -> service.listFiles(1L, owner))
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.NOT_FOUND);
        }

        @Test
        void downloadReadsTheStoredBytes() {
            Booking booking = Booking.builder().id(1L)
                    .user(User.builder().id(7L).build()).build();
            BookingFile file = BookingFile.builder().id(50L).booking(booking)
                    .storageKey("bookings/1/abc.jpg").originalName("photo.jpg")
                    .contentType("image/jpeg").sizeBytes(10L).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            when(files.findById(50L)).thenReturn(Optional.of(file));
            when(storage.load("bookings/1/abc.jpg")).thenReturn(new byte[] { 9, 9 });

            var downloaded = service.downloadFile(1L, 50L, owner);

            assertThat(downloaded.filename()).isEqualTo("photo.jpg");
            assertThat(downloaded.content()).containsExactly(9, 9);
        }

        @Test
        @DisplayName("a file id belonging to a different booking is not found")
        void downloadRejectsFileFromAnotherBooking() {
            Booking booking = Booking.builder().id(1L).user(User.builder().id(7L).build()).build();
            Booking otherBooking = Booking.builder().id(2L).build();
            BookingFile file = BookingFile.builder().id(50L).booking(otherBooking).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            when(files.findById(50L)).thenReturn(Optional.of(file));

            assertThatThrownBy(() -> service.downloadFile(1L, 50L, owner))
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.NOT_FOUND);

            verifyNoInteractions(storage);
        }
    }

    @Nested
    @DisplayName("get")
    class Get {

        private final AuthenticatedUser admin = new AuthenticatedUser(1L, "admin@supplybase.in", Role.ADMIN);
        private final AuthenticatedUser owner = new AuthenticatedUser(7L, "owner@example.com", Role.CUSTOMER);
        private final AuthenticatedUser stranger = new AuthenticatedUser(8L, "stranger@example.com", Role.CUSTOMER);

        @Test
        void ownerCanReadTheirOwnBooking() {
            Booking booking = Booking.builder().id(1L).user(User.builder().id(7L).build()).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            when(answers.findByBookingId(1L)).thenReturn(List.of());

            assertThat(service.get(1L, owner).id()).isEqualTo(1L);
        }

        @Test
        void staffCanReadAnyBooking() {
            Booking booking = Booking.builder().id(1L).user(User.builder().id(7L).build()).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            when(answers.findByBookingId(1L)).thenReturn(List.of());

            assertThat(service.get(1L, admin).id()).isEqualTo(1L);
        }

        @Test
        @DisplayName("a stranger gets 404, not 403 — existence is not theirs to know")
        void strangerGetsNotFoundNotForbidden() {
            Booking booking = Booking.builder().id(1L).user(User.builder().id(7L).build()).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));

            assertThatThrownBy(() -> service.get(1L, stranger))
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.NOT_FOUND);
        }

        @Test
        @DisplayName("a visitor booking with no user is staff-only")
        void bookingWithNoUserIsStaffOnly() {
            Booking booking = Booking.builder().id(1L).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));

            assertThatThrownBy(() -> service.get(1L, owner))
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.NOT_FOUND);
        }

        @Test
        @DisplayName("the booking's real answers come back, not the unused workNature/workOption/workDetail fields")
        void includesTheActualAnswersGivenInTheWizard() {
            Booking booking = Booking.builder().id(1L).user(User.builder().id(7L).build()).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            BookingAnswer answer = BookingAnswer.builder()
                    .bookingId(1L)
                    .questionKey("service_needed")
                    .questionText("What do you need?")
                    .answerValue("leak_repair")
                    .answerLabel("Leak Repair")
                    .build();
            when(answers.findByBookingId(1L)).thenReturn(List.of(answer));

            var response = service.get(1L, owner);

            assertThat(response.answers()).hasSize(1);
            assertThat(response.answers().get(0).questionText()).isEqualTo("What do you need?");
            assertThat(response.answers().get(0).answerLabel()).isEqualTo("Leak Repair");
        }
    }

    @Nested
    @DisplayName("cancelMine")
    class CancelMine {

        private final AuthenticatedUser owner = new AuthenticatedUser(7L, "owner@example.com", Role.CUSTOMER);
        private final AuthenticatedUser stranger = new AuthenticatedUser(8L, "stranger@example.com", Role.CUSTOMER);

        private Booking ownBooking(BookingStatus status) {
            return Booking.builder().id(1L).bookingNumber("SB-1").user(User.builder().id(7L).build())
                    .visitFeePaise(9900L).status(status).build();
        }

        @Test
        @DisplayName("cancels, records the reason and frees the visit slot")
        void cancelsAndReleasesTheSlot() {
            AppointmentSlot slot = AppointmentSlot.builder().id(9L).capacity(3).bookedCount(1).build();
            Booking booking = ownBooking(BookingStatus.CONFIRMED);
            booking.setAppointmentSlot(slot);
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
            when(answers.findByBookingId(1L)).thenReturn(List.of());

            BookingResponse response = service.cancelMine(1L, "  Plans changed ", owner);

            assertThat(response.status()).isEqualTo(BookingStatus.CANCELLED);
            assertThat(response.cancelledReason()).isEqualTo("Cancelled by the customer: Plans changed");
            assertThat(booking.getAdminNotes()).isNull();
            verify(appointments).release(slot);
        }

        @Test
        @DisplayName("a booking paid online is not refunded but marked REFUND DUE for staff")
        void paidBookingIsMarkedRefundDue() {
            Booking booking = ownBooking(BookingStatus.SITE_VISIT_SCHEDULED);
            booking.setPaidAt(Instant.now());
            booking.setAdminNotes("Gate code 1234");
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
            when(answers.findByBookingId(1L)).thenReturn(List.of());

            BookingResponse response = service.cancelMine(1L, null, owner);

            assertThat(response.cancelledReason()).isEqualTo("Cancelled by the customer.");
            assertThat(booking.getAdminNotes()).startsWith("REFUND DUE:").contains("₹99.00")
                    .endsWith("Gate code 1234");
        }

        @Test
        @DisplayName("once the work is scheduled it is a phone call, not a button")
        void refusesOnceWorkIsScheduled() {
            for (BookingStatus status : List.of(BookingStatus.WORK_SCHEDULED,
                    BookingStatus.WORK_IN_PROGRESS, BookingStatus.WORK_COMPLETED, BookingStatus.CANCELLED)) {
                when(bookings.findById(1L)).thenReturn(Optional.of(ownBooking(status)));

                assertThatThrownBy(() -> service.cancelMine(1L, null, owner))
                        .isInstanceOf(ApiException.class)
                        .extracting(ex -> ((ApiException) ex).getStatus())
                        .isEqualTo(HttpStatus.CONFLICT);
            }
            verify(bookings, never()).save(any());
            verifyNoInteractions(appointments);
        }

        @Test
        @DisplayName("a stranger gets 404, not 403")
        void strangerGetsNotFound() {
            when(bookings.findById(1L)).thenReturn(Optional.of(ownBooking(BookingStatus.CONFIRMED)));

            assertThatThrownBy(() -> service.cancelMine(1L, null, stranger))
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.NOT_FOUND);
            verify(bookings, never()).save(any());
        }
    }

    @Nested
    @DisplayName("updateMine")
    class UpdateMine {

        private final AuthenticatedUser admin = new AuthenticatedUser(1L, "admin@supplybase.in", Role.ADMIN);
        private final AuthenticatedUser owner = new AuthenticatedUser(7L, "owner@example.com", Role.CUSTOMER);
        private final AuthenticatedUser stranger = new AuthenticatedUser(8L, "stranger@example.com", Role.CUSTOMER);

        private final UpdateMyBookingRequest request = new UpdateMyBookingRequest(
                "Asha Rao", "+91 98200 11223", null, "asha@example.com",
                "New House, 2nd Cross", "Pune", "411001");

        @Test
        void ownerCanEditTheirOwnContactAndAddress() {
            Booking booking = Booking.builder().id(1L).user(User.builder().id(7L).build())
                    .status(BookingStatus.PAYMENT_PENDING).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
            when(answers.findByBookingId(1L)).thenReturn(List.of());

            BookingResponse response = service.updateMine(1L, request, owner);

            assertThat(response.name()).isEqualTo("Asha Rao");
            assertThat(response.phone()).isEqualTo("9820011223");
            assertThat(response.whatsapp()).isEqualTo("9820011223");
            assertThat(response.email()).isEqualTo("asha@example.com");
            assertThat(response.address()).isEqualTo("New House, 2nd Cross");
            assertThat(response.location()).isEqualTo("Pune");
            assertThat(response.pincode()).isEqualTo("411001");
        }

        @Test
        void staffCanEditAnyBooking() {
            Booking booking = Booking.builder().id(1L).user(User.builder().id(7L).build())
                    .status(BookingStatus.PAYMENT_PENDING).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
            when(answers.findByBookingId(1L)).thenReturn(List.of());

            assertThat(service.updateMine(1L, request, admin).name()).isEqualTo("Asha Rao");
        }

        @Test
        @DisplayName("a stranger gets 404, not 403 — same as get()")
        void strangerGetsNotFoundNotForbidden() {
            Booking booking = Booking.builder().id(1L).user(User.builder().id(7L).build())
                    .status(BookingStatus.PAYMENT_PENDING).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));

            assertThatThrownBy(() -> service.updateMine(1L, request, stranger))
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.NOT_FOUND);

            verify(bookings, never()).save(any());
        }

        @Test
        @DisplayName("a cancelled or completed booking can no longer be edited")
        void rejectsEditingAFinalBooking() {
            Booking booking = Booking.builder().id(1L).user(User.builder().id(7L).build())
                    .status(BookingStatus.CANCELLED).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));

            assertThatThrownBy(() -> service.updateMine(1L, request, owner))
                    .isInstanceOf(ApiException.class)
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.BAD_REQUEST);

            verify(bookings, never()).save(any());
        }

        @Test
        @DisplayName("an empty whatsapp falls back to the (normalised) phone, like create() does")
        void blankWhatsappFallsBackToPhone() {
            Booking booking = Booking.builder().id(1L).user(User.builder().id(7L).build())
                    .status(BookingStatus.CONFIRMED).build();
            when(bookings.findById(1L)).thenReturn(Optional.of(booking));
            when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
            when(answers.findByBookingId(1L)).thenReturn(List.of());

            UpdateMyBookingRequest noWhatsapp = new UpdateMyBookingRequest(
                    "Asha Rao", "9820011223", "  ", null, "Address", "Pune", null);

            assertThat(service.updateMine(1L, noWhatsapp, owner).whatsapp()).isEqualTo("9820011223");
        }
    }

    @Nested
    @DisplayName("confirmation email")
    class ConfirmationEmail {

        private final LocalDate VISIT = LocalDate.now().plusDays(3);

        @Mock private JavaMailSender sender;

        private BookingService emailingService;

        @BeforeEach
        void emailOn() {
            AppProperties props = new AppProperties(
                    List.of("*"), null, null, null,
                    new AppProperties.Notifications("staff@example.com"),
                    "https://www.supplybase.co.in", null, new AppProperties.Booking(30), null);
            emailingService = new BookingService(bookings, answers, users, catalogue, options, appointments,
                    bookingNumbers, props, mailSender, files, storage, notifications, razorpay);
            when(mailSender.getIfAvailable()).thenReturn(sender);

            ServiceCategory category = plumbingCategory();
            when(catalogue.requireCategory("plumbing")).thenReturn(category);
            when(appointments.reserve(eq(1L), any(LocalDate.class), any(LocalTime.class)))
                    .thenAnswer(inv -> AppointmentSlot.builder()
                            .id(9L).slotDate(inv.getArgument(1)).slotTime(inv.getArgument(2)).categoryId(1L)
                            .capacity(3).bookedCount(1).build());
            when(bookingNumbers.next()).thenReturn("SB-20260906-000001");
            when(bookings.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
        }

        /** Makes a booking and then has its visiting fee verified, which is what sends the emails. */
        private void bookAndPay(BookingService target, CreateBookingRequest request, Long userId) {
            target.create(request, userId);
            ArgumentCaptor<Booking> saved = ArgumentCaptor.forClass(Booking.class);
            verify(bookings, org.mockito.Mockito.atLeastOnce()).save(saved.capture());
            Booking booking = saved.getValue();
            booking.setStatus(BookingStatus.CONFIRMED);
            target.onBookingPaid(booking);
        }

        @Test
        @DisplayName("making a booking emails nobody until its visiting fee is paid")
        void noEmailBeforePayment() {
            org.mockito.Mockito.reset(mailSender);
            emailingService.create(requestFor(VISIT, LocalTime.of(10, 0), List.of()), null);
            verify(sender, never()).send(any(org.springframework.mail.SimpleMailMessage.class));
        }

        @Test
        @DisplayName("a payment landing on a cancelled booking flags a refund and tells only the office")
        void latePaymentOnCancelledBooking() {
            org.mockito.Mockito.reset(catalogue, appointments, bookingNumbers);
            Booking cancelled = Booking.builder().id(7L).bookingNumber("SB-1").serviceLabel("Plumbing")
                    .name("Asha Rao").phone("9820011223").email("asha@example.com")
                    .visitFeePaise(9900L).status(BookingStatus.CANCELLED)
                    .cancelledReason("Automatically cancelled").build();

            emailingService.onBookingPaid(cancelled);

            assertThat(cancelled.getStatus()).isEqualTo(BookingStatus.CANCELLED);
            assertThat(cancelled.getAdminNotes()).startsWith("REFUND DUE");
            List<org.springframework.mail.SimpleMailMessage> mails = sent();
            assertThat(mails).hasSize(1);
            assertThat(mails.get(0).getTo()).containsExactly("staff@example.com");
            assertThat(mails.get(0).getSubject()).startsWith("[REFUND DUE]");
        }

        private List<org.springframework.mail.SimpleMailMessage> sent() {
            ArgumentCaptor<org.springframework.mail.SimpleMailMessage> captor =
                    ArgumentCaptor.forClass(org.springframework.mail.SimpleMailMessage.class);
            verify(sender, org.mockito.Mockito.atLeastOnce()).send(captor.capture());
            return captor.getAllValues();
        }

        @Test
        @DisplayName("emails the customer the booking number, service, visit time and address")
        void emailsCustomer() {
            bookAndPay(emailingService, requestFor(VISIT, LocalTime.of(10, 0), List.of()), null);

            List<org.springframework.mail.SimpleMailMessage> mails = sent();
            assertThat(mails).hasSize(2);
            assertThat(mails.get(0).getTo()).containsExactly("staff@example.com");
            org.springframework.mail.SimpleMailMessage customer = mails.get(1);
            assertThat(customer.getTo()).containsExactly("asha@example.com");
            assertThat(customer.getSubject()).isEqualTo("Your Supplybase booking SB-20260906-000001 — Plumbing");
            assertThat(customer.getText())
                    .contains("Hello Asha Rao")
                    .contains("SB-20260906-000001")
                    .contains(VISIT.format(java.time.format.DateTimeFormatter.ofPattern("EEE, d MMM yyyy", java.util.Locale.ENGLISH)) + ", 10:00 AM")
                    .contains("12 MG Road, Mumbai 400001")
                    .contains("Visiting fee: ₹99.00 (paid)")
                    .contains("booking is confirmed")
                    // a guest booking has no account page to point at
                    .doesNotContain("/dashboard/bookings");
        }

        @Test
        @DisplayName("uses the account's email when the form left it blank, and links the booking page")
        void fallsBackToAccountEmail() {
            User owner = User.builder().id(5L).email("owner@example.com").build();
            when(users.findById(5L)).thenReturn(Optional.of(owner));
            CreateBookingRequest noEmail = new CreateBookingRequest(
                    "plumbing", List.of(), VISIT, LocalTime.of(10, 0),
                    "Asha Rao", "9820011223", null, null,
                    "12 MG Road", "Mumbai", "400001", 800);

            bookAndPay(emailingService, noEmail, 5L);

            org.springframework.mail.SimpleMailMessage customer = sent().get(1);
            assertThat(customer.getTo()).containsExactly("owner@example.com");
            assertThat(customer.getText())
                    .contains("https://www.supplybase.co.in/dashboard/bookings");
        }

        @Test
        @DisplayName("the customer still gets their email when no staff inbox is set")
        void customerEmailWithoutStaffInbox() {
            AppProperties props = new AppProperties(
                    List.of("*"), null, null, null,
                    new AppProperties.Notifications(null, true),
                    "https://www.supplybase.co.in", null, new AppProperties.Booking(30), null);
            BookingService noStaffInbox = new BookingService(bookings, answers, users, catalogue, options,
                    appointments, bookingNumbers, props, mailSender, files, storage, notifications, razorpay);

            bookAndPay(noStaffInbox, requestFor(VISIT, LocalTime.of(10, 0), List.of()), null);

            List<org.springframework.mail.SimpleMailMessage> mails = sent();
            assertThat(mails).hasSize(1);
            assertThat(mails.get(0).getTo()).containsExactly("asha@example.com");
        }

        @Test
        @DisplayName("CUSTOMER_EMAILS=false switches off only the customer's email")
        void customerEmailsSwitchedOff() {
            AppProperties props = new AppProperties(
                    List.of("*"), null, null, null,
                    new AppProperties.Notifications("staff@example.com", false),
                    "https://www.supplybase.co.in", null, new AppProperties.Booking(30), null);
            BookingService staffOnly = new BookingService(bookings, answers, users, catalogue, options,
                    appointments, bookingNumbers, props, mailSender, files, storage, notifications, razorpay);

            bookAndPay(staffOnly, requestFor(VISIT, LocalTime.of(10, 0), List.of()), null);

            List<org.springframework.mail.SimpleMailMessage> mails = sent();
            assertThat(mails).hasSize(1);
            assertThat(mails.get(0).getTo()).containsExactly("staff@example.com");
        }

        @Test
        @DisplayName("inside a transaction, nothing is emailed until it commits")
        void emailsWaitForCommit() {
            org.springframework.transaction.support.TransactionSynchronizationManager.initSynchronization();
            try {
                bookAndPay(emailingService, requestFor(VISIT, LocalTime.of(10, 0), List.of()), null);
                verify(sender, never()).send(any(org.springframework.mail.SimpleMailMessage.class));

                org.springframework.transaction.support.TransactionSynchronizationManager.getSynchronizations()
                        .forEach(org.springframework.transaction.support.TransactionSynchronization::afterCommit);
                assertThat(sent()).hasSize(2);
            } finally {
                org.springframework.transaction.support.TransactionSynchronizationManager.clearSynchronization();
            }
        }

        @Test
        @DisplayName("a mail failure does not fail the booking")
        void mailFailureIsIgnored() {
            org.mockito.Mockito.doThrow(new org.springframework.mail.MailSendException("down"))
                    .when(sender).send(any(org.springframework.mail.SimpleMailMessage.class));

            bookAndPay(emailingService, requestFor(VISIT, LocalTime.of(10, 0), List.of()), null);

            verify(sender, org.mockito.Mockito.times(2)).send(any(org.springframework.mail.SimpleMailMessage.class));
        }
    }
}

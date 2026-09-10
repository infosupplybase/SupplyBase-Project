package in.supplybase.backend.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
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
import in.supplybase.backend.catalogue.CatalogueService;
import in.supplybase.backend.catalogue.ServiceCategory;
import in.supplybase.backend.catalogue.ServiceOption;
import in.supplybase.backend.catalogue.ServiceOptionRepository;
import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.FileStorageService;
import in.supplybase.backend.config.AppProperties;

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

    private BookingService service;

    @BeforeEach
    void setUp() {
        AppProperties props = new AppProperties(
                List.of("*"), null, null, null,
                new AppProperties.Notifications(null), // email disabled: no recipient configured
                null, null, new AppProperties.Booking(24), null);
        service = new BookingService(bookings, answers, users, catalogue, options, appointments,
                bookingNumbers, props, mailSender, files, storage);
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
            when(bookings.countByPhoneAndCreatedAtAfter(eq("9820011223"), any(Instant.class)))
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
        @DisplayName("attaches the booking to the signed-in user when one is present")
        void attachesSignedInUser() {
            ServiceCategory category = plumbingCategory();
            LocalDate date = LocalDate.now().plusDays(3);
            LocalTime time = LocalTime.of(10, 0);

            when(catalogue.requireCategory("plumbing")).thenReturn(category);
            when(bookings.countByPhoneAndCreatedAtAfter(any(), any())).thenReturn(0L);
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
        @DisplayName("refuses a sixth booking from the same phone within an hour")
        void rejectsWhenRateLimited() {
            when(catalogue.requireCategory("plumbing")).thenReturn(plumbingCategory());
            when(bookings.countByPhoneAndCreatedAtAfter(eq("9820011223"), any(Instant.class)))
                    .thenReturn(5L);

            CreateBookingRequest request =
                    requestFor(LocalDate.now().plusDays(1), LocalTime.of(10, 0), null);

            assertThatThrownBy(() -> service.create(request, null))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("We already have your booking")
                    .extracting(ex -> ((ApiException) ex).getStatus())
                    .isEqualTo(HttpStatus.BAD_REQUEST);

            verifyNoInteractions(appointments);
            verify(bookings, never()).save(any());
        }

        @Test
        @DisplayName("propagates the conflict when the slot is no longer available")
        void propagatesSlotConflict() {
            when(catalogue.requireCategory("plumbing")).thenReturn(plumbingCategory());
            when(bookings.countByPhoneAndCreatedAtAfter(any(), any())).thenReturn(0L);
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
}

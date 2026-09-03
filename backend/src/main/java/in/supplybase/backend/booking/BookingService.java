package in.supplybase.backend.booking;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import in.supplybase.backend.appointment.AppointmentService;
import in.supplybase.backend.appointment.AppointmentSlot;
import in.supplybase.backend.auth.AuthenticatedUser;
import in.supplybase.backend.auth.Role;
import in.supplybase.backend.auth.User;
import in.supplybase.backend.auth.UserRepository;
import in.supplybase.backend.booking.dto.BookingFileResponse;
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
import in.supplybase.backend.common.PhoneNumbers;
import in.supplybase.backend.common.Reference;
import in.supplybase.backend.config.AppProperties;

@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    /** A real person does not book six site visits in an hour; a bot does. */
    private static final int MAX_PER_PHONE_PER_HOUR = 5;

    private final BookingRepository bookings;
    private final BookingAnswerRepository answers;
    private final UserRepository users;
    private final CatalogueService catalogue;
    private final ServiceOptionRepository options;
    private final AppointmentService appointments;
    private final BookingNumbers bookingNumbers;
    private final AppProperties props;
    private final ObjectProvider<JavaMailSender> mailSender;
    private final BookingFileRepository files;
    private final FileStorageService storage;

    public BookingService(BookingRepository bookings, BookingAnswerRepository answers,
                          UserRepository users, CatalogueService catalogue,
                          ServiceOptionRepository options, AppointmentService appointments,
                          BookingNumbers bookingNumbers, AppProperties props,
                          ObjectProvider<JavaMailSender> mailSender,
                          BookingFileRepository files, FileStorageService storage) {
        this.bookings = bookings;
        this.answers = answers;
        this.users = users;
        this.catalogue = catalogue;
        this.options = options;
        this.appointments = appointments;
        this.bookingNumbers = bookingNumbers;
        this.props = props;
        this.mailSender = mailSender;
        this.files = files;
        this.storage = storage;
    }

    /**
     * Creates a booking in PAYMENT_PENDING and takes the appointment seat.
     *
     * The seat is taken now, not after payment. Holding it means a customer
     * who has committed to a time is not beaten to it while typing their card
     * details — and an unpaid booking that expires releases it again.
     */
    @Transactional
    public BookingReceipt create(CreateBookingRequest request, Long signedInUserId) {
        ServiceCategory category = catalogue.requireCategory(request.serviceSlug());
        String phone = PhoneNumbers.normalise(request.phone());

        long recent = bookings.countByPhoneAndCreatedAtAfter(
                phone, Instant.now().minus(Duration.ofHours(1)));
        if (recent >= MAX_PER_PHONE_PER_HOUR) {
            throw ApiException.badRequest(
                    "We already have your booking. Please call us if it is urgent.");
        }

        // Reserving before saving means a full slot fails the whole request
        // rather than leaving a booking pointing at a time nobody can attend.
        AppointmentSlot slot = appointments.reserve(
                category.getId(), request.preferredDate(), request.preferredTime());

        Booking booking = Booking.builder()
                .reference(Reference.forBooking())
                .bookingNumber(bookingNumbers.next())
                .bookingType(BookingType.SERVICE)
                .category(category)
                .serviceSlug(category.getSlug())
                .serviceLabel(category.getName())
                .preferredDate(request.preferredDate())
                .appointmentSlot(slot)
                .areaSqft(request.areaSqft())
                .name(request.name().trim())
                .phone(phone)
                .whatsapp(request.whatsapp() == null || request.whatsapp().isBlank()
                        ? phone : PhoneNumbers.normalise(request.whatsapp()))
                .email(blankToNull(request.email()))
                .address(request.address().trim())
                .city(request.city().trim())
                .pincode(blankToNull(request.pincode()))
                .location(request.city().trim())
                .visitFeePaise(category.getVisitFeePaise())
                // RULE 7: nothing is confirmed until the fee is verified.
                .status(BookingStatus.PAYMENT_PENDING)
                .build();

        if (signedInUserId != null) {
            users.findById(signedInUserId).ifPresent(booking::setUser);
        }

        Booking saved = bookings.save(booking);
        storeAnswers(saved, category, request.answers());
        notifyStaff(saved);
        return BookingReceipt.from(saved);
    }

    /**
     * Stores the form answers, checking each against the catalogue first.
     *
     * The request shape is open — questions are data — but that must not mean
     * anything can be written. A key the service never asks about is dropped,
     * and a choice that is not one of the offered options is refused outright.
     */
    private void storeAnswers(Booking booking, ServiceCategory category,
                              List<CreateBookingRequest.AnswerInput> submitted) {
        if (submitted == null || submitted.isEmpty()) {
            return;
        }

        Map<String, ServiceOption> questionByKey = new HashMap<>();
        Map<String, Set<String>> allowedByKey = new HashMap<>();
        for (ServiceOption option : options
                .findByCategoryIdAndActiveTrueOrderByStepNoAscSortOrderAsc(category.getId())) {
            questionByKey.putIfAbsent(option.getQuestionKey(), option);
            if (option.getOptionValue() != null) {
                allowedByKey.computeIfAbsent(option.getQuestionKey(), k -> new HashSet<>())
                        .add(option.getOptionValue());
            }
        }

        List<BookingAnswer> rows = new ArrayList<>();
        for (CreateBookingRequest.AnswerInput input : submitted) {
            ServiceOption question = questionByKey.get(input.key());
            if (question == null) {
                log.debug("Ignoring answer to unknown question {} on {}",
                        input.key(), category.getSlug());
                continue;
            }

            Set<String> allowed = allowedByKey.get(input.key());
            // Only choice questions have a fixed answer set. TEXT and NUMBER
            // are free-form by definition and are length-capped by validation.
            if (allowed != null && !allowed.contains(input.value())) {
                throw ApiException.badRequest(
                        "\"" + input.value() + "\" is not an option for that question.");
            }

            rows.add(BookingAnswer.builder()
                    .bookingId(booking.getId())
                    .questionKey(input.key())
                    // Copied from the catalogue, not from the request — the
                    // browser does not get to decide what it was asked.
                    .questionText(question.getQuestionText())
                    .answerValue(input.value())
                    .answerLabel(input.label())
                    .build());
        }
        answers.saveAll(rows);
    }

    /* ------------------------------------------------------------- reads */

    @Transactional(readOnly = true)
    public Page<BookingResponse> list(BookingStatus status, BookingType type, Pageable pageable) {
        Page<Booking> page;
        if (status != null) {
            page = bookings.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else if (type != null) {
            page = bookings.findByBookingTypeOrderByCreatedAtDesc(type, pageable);
        } else {
            page = bookings.findAllByOrderByCreatedAtDesc(pageable);
        }
        return page.map(BookingResponse::from);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> forDate(LocalDate date) {
        return bookings.findByPreferredDateOrderByPreferredSlotAsc(date).stream()
                .map(BookingResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> myBookings(Long userId) {
        return bookings.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(BookingResponse::from)
                .toList();
    }

    @Transactional
    public BookingResponse update(Long id, UpdateBookingRequest request) {
        Booking booking = bookings.findById(id)
                .orElseThrow(() -> ApiException.notFound("That booking"));
        if (booking.getStatus().isFinal()) {
            throw ApiException.badRequest(
                    "That booking is already " + booking.getStatus().name().toLowerCase()
                            + " and cannot be changed.");
        }
        // isFinal() above guarantees a booking can only ever reach CANCELLED
        // once, so the seat is released exactly once — no extra guard needed.
        if (request.status() == BookingStatus.CANCELLED && booking.getAppointmentSlot() != null) {
            appointments.release(booking.getAppointmentSlot());
        }
        booking.setStatus(request.status());
        if (request.adminNotes() != null) {
            booking.setAdminNotes(request.adminNotes());
        }
        return BookingResponse.from(bookings.save(booking));
    }

    /* ----------------------------------------------------------- staff */

    /**
     * Hands a booking to a professional.
     *
     * Only allowed once the office has actually confirmed the visit
     * (CONFIRMED) or has already decided assignment is next
     * (ASSIGNMENT_PENDING) — assigning a still-unpaid or already-finished
     * booking would be a state-machine violation, not a not-found or a bad
     * input, hence the 409.
     */
    @Transactional
    public BookingResponse assignProfessional(Long bookingId, Long professionalId) {
        Booking booking = bookings.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("That booking"));
        if (booking.getStatus() != BookingStatus.CONFIRMED
                && booking.getStatus() != BookingStatus.ASSIGNMENT_PENDING) {
            throw ApiException.conflict(
                    "A booking can only be assigned from CONFIRMED or ASSIGNMENT_PENDING status.");
        }

        User professional = users.findById(professionalId)
                .orElseThrow(() -> ApiException.badRequest("That account does not exist."));
        if (professional.getRole() != Role.PROFESSIONAL) {
            throw ApiException.badRequest("That account is not a professional.");
        }

        booking.setAssignedProfessional(professional);
        booking.setStatus(BookingStatus.PROFESSIONAL_ASSIGNED);
        return BookingResponse.from(bookings.save(booking));
    }

    /* ------------------------------------------------------- professional */

    @Transactional(readOnly = true)
    public List<ProfessionalBookingResponse> myAssignedBookings(Long professionalId) {
        return bookings.findByAssignedProfessionalIdOrderByCreatedAtDesc(professionalId).stream()
                .map(ProfessionalBookingResponse::from)
                .toList();
    }

    /**
     * A narrow, forward-only set of transitions a professional may make on
     * their own job — progressing a visit or a job already scheduled by the
     * office. Anything else (cancelling, jumping stages, touching payment or
     * assignment) stays with staff.
     */
    private static final Map<BookingStatus, Set<BookingStatus>> SELF_SERVICE_TRANSITIONS = Map.of(
            BookingStatus.SITE_VISIT_SCHEDULED, Set.of(BookingStatus.SITE_VISIT_COMPLETED),
            BookingStatus.WORK_SCHEDULED, Set.of(BookingStatus.WORK_IN_PROGRESS),
            BookingStatus.WORK_IN_PROGRESS, Set.of(BookingStatus.WORK_COMPLETED));

    @Transactional
    public ProfessionalBookingResponse advanceOwnBookingStatus(
            Long bookingId, BookingStatus newStatus, Long callerId) {
        Booking booking = bookings.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("That booking"));

        // Not theirs (or unassigned) gets 404, not 403 — same reasoning as
        // ProjectService.get: revealing that the booking exists is itself
        // information a stranger to it is not entitled to.
        if (booking.getAssignedProfessional() == null
                || !booking.getAssignedProfessional().getId().equals(callerId)) {
            throw ApiException.notFound("That booking");
        }

        Set<BookingStatus> allowed = SELF_SERVICE_TRANSITIONS.get(booking.getStatus());
        if (allowed == null || !allowed.contains(newStatus)) {
            throw ApiException.badRequest("That status change is not available to you.");
        }

        booking.setStatus(newStatus);
        return ProfessionalBookingResponse.from(bookings.save(booking));
    }

    /* ---------------------------------------------------------------- files */

    public record DownloadedFile(byte[] content, String filename, String contentType) {
    }

    @Transactional
    public BookingFileResponse uploadFile(Long bookingId, String kind, MultipartFile file, Long uploaderId) {
        Booking booking = bookings.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("That booking"));

        FileStorageService.StoredFile stored = storage.store(file, "bookings/" + bookingId);

        BookingFile.BookingFileBuilder builder = BookingFile.builder()
                .booking(booking)
                .storageKey(stored.storageKey())
                .originalName(stored.originalName())
                .contentType(stored.contentType() != null ? stored.contentType() : "application/octet-stream")
                .sizeBytes(stored.sizeBytes())
                .kind(kind == null || kind.isBlank() ? "PHOTO" : kind);

        if (uploaderId != null) {
            users.findById(uploaderId).ifPresent(builder::uploadedBy);
        }

        return BookingFileResponse.from(files.save(builder.build()));
    }

    @Transactional(readOnly = true)
    public List<BookingFileResponse> listFiles(Long bookingId, AuthenticatedUser viewer) {
        Booking booking = bookings.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("That booking"));
        checkFileAccess(booking, viewer);

        return files.findByBookingIdOrderByCreatedAtDesc(bookingId).stream()
                .map(BookingFileResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public DownloadedFile downloadFile(Long bookingId, Long fileId, AuthenticatedUser viewer) {
        Booking booking = bookings.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("That booking"));
        checkFileAccess(booking, viewer);

        BookingFile file = files.findById(fileId)
                .filter(f -> f.getBooking().getId().equals(bookingId))
                .orElseThrow(() -> ApiException.notFound("That file"));

        byte[] content = storage.load(file.getStorageKey());
        return new DownloadedFile(content, file.getOriginalName(), file.getContentType());
    }

    /**
     * Staff sees any booking's files; the booking's own signed-in user (most
     * bookings are from visitors and have none) sees only their own. Anyone
     * else gets 404, not 403 — same reasoning as ProjectService.get.
     */
    private void checkFileAccess(Booking booking, AuthenticatedUser viewer) {
        if (!viewer.isStaff()
                && (booking.getUser() == null || !booking.getUser().getId().equals(viewer.id()))) {
            throw ApiException.notFound("That booking");
        }
    }

    /* ------------------------------------------------------------ email */

    private void notifyStaff(Booking booking) {
        if (!props.notifications().emailEnabled()) {
            return;
        }
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(props.notifications().enquiryRecipient());
            message.setSubject("New booking %s — %s (%s)".formatted(
                    booking.getBookingNumber(), booking.getServiceLabel(), booking.getName()));
            message.setText((
                    "A site visit has been requested through the website.\n\n"
                    + "Booking:   %s\n"
                    + "Service:   %s\n"
                    + "Date:      %s\n"
                    + "Name:      %s\n"
                    + "Mobile:    %s\n"
                    + "Address:   %s, %s %s\n"
                    + "Status:    %s (fee not yet paid)\n").formatted(
                    booking.getBookingNumber(), booking.getServiceLabel(),
                    booking.getPreferredDate(), booking.getName(), booking.getPhone(),
                    orDash(booking.getAddress()), orDash(booking.getCity()),
                    orDash(booking.getPincode()), booking.getStatus()));
            sender.send(message);
        } catch (Exception ex) {
            log.warn("Could not email booking {} — it is saved regardless",
                    booking.getBookingNumber(), ex);
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String orDash(String value) {
        return value == null || value.isBlank() ? "—" : value;
    }
}

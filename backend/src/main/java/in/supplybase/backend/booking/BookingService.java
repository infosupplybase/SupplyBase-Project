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
import in.supplybase.backend.booking.dto.BookingAnswerResponse;
import in.supplybase.backend.booking.dto.BookingFileResponse;
import in.supplybase.backend.booking.dto.BookingReceipt;
import in.supplybase.backend.booking.dto.BookingResponse;
import in.supplybase.backend.booking.dto.CreateBookingRequest;
import in.supplybase.backend.booking.dto.PartnerEarningsResponse;
import in.supplybase.backend.booking.dto.PartnerPayoutResponse;
import in.supplybase.backend.booking.dto.ProfessionalBookingResponse;
import in.supplybase.backend.booking.dto.UpdateBookingRequest;
import in.supplybase.backend.booking.dto.UpdateMyBookingRequest;
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

    /**
     * The plumbing cart's pricing rule (from the approved rate card): actual
     * itemised pricing up to ₹5,000, a flat ₹99 home-visit/assessment fee
     * above that (adjusted into the final bill if the customer proceeds).
     * Scoped narrowly to the 'plumbing' category slug (checked in create()
     * below) and its 'cart_item'/'consultation_type' question keys (see
     * V14) — every other category's pricing, including painting's own
     * itemised total and the electrician add-ons' priced options, is
     * untouched by this.
     */
    private static final String PLUMBING_SLUG = "plumbing";
    private static final long ACTUAL_PRICING_THRESHOLD_PAISE = 500_000L; // ₹5,000
    private static final long HOME_VISIT_FEE_PAISE = 9_900L; // ₹99

    /**
     * Painting's itemised answer keys (see V15) — priced the same way
     * plumbing's 'cart_item' is (matched catalogue price × quantity, summed
     * into itemsTotalPaise), but WITHOUT plumbing's ₹5,000/₹99 threshold
     * override: painting's visitFeePaise stays exactly the category's own
     * configured fee (see V15's pricing-conflict notes — the reference's
     * ₹99 is not applied here pending confirmation). 'paint_brand' and every
     * *_area/*_colour key are deliberately excluded — they carry no price in
     * the reference, they are recorded as plain answers only.
     */
    private static final Set<String> PAINTING_PRICED_KEYS = Set.of(
            "home_type", "full_home_painting_type", "full_home_product", "full_home_addon",
            "few_walls_painting_type", "few_walls_product", "few_walls_addon",
            "renovation_repair", "renovation_addon");

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
        CartPricing pricing = storeAnswers(saved, category, request.answers());

        // Cart/consultation pricing rule — scoped to the 'cart_item' and
        // 'consultation_type' answer keys only (see the constants' Javadoc).
        // Every other booking keeps the category's flat visitFeePaise exactly
        // as before.
        if (pricing.itemsTotalPaise() > 0) {
            saved.setItemsTotalPaise(pricing.itemsTotalPaise());
            // Plumbing's ₹5,000/₹99 threshold is plumbing-only — painting
            // (and anything else with a non-zero itemsTotalPaise) keeps the
            // category's own flat visitFeePaise, already set above.
            if (PLUMBING_SLUG.equals(category.getSlug())) {
                saved.setVisitFeePaise(pricing.itemsTotalPaise() <= ACTUAL_PRICING_THRESHOLD_PAISE
                        ? pricing.itemsTotalPaise()
                        : HOME_VISIT_FEE_PAISE);
            }
            saved = bookings.save(saved);
        } else if (pricing.hasConsultationAnswer()) {
            saved.setVisitFeePaise(HOME_VISIT_FEE_PAISE);
            saved = bookings.save(saved);
        }

                notifyStaff(saved);
        notifyCustomer(saved);

        return BookingReceipt.from(saved);
    }

    private static String valueOrDash(Object value) {
        return value == null || String.valueOf(value).isBlank()
                ? "-"
                : String.valueOf(value);
    }

    private static String formatRupees(Long paise) {
        if (paise == null) {
            return "₹0.00";
        }

        return String.format(
                java.util.Locale.ROOT,
                "₹%.2f",
                paise / 100.0
        );
    }

    private record CartPricing(long itemsTotalPaise, boolean hasConsultationAnswer) {
    }

    private void notifyCustomer(Booking booking) {
    String customerEmail = booking.getEmail();

    if (customerEmail == null || customerEmail.isBlank()) {
        return;
    }

    JavaMailSender sender = mailSender.getIfAvailable();

    if (sender == null) {
        return;
    }

    try {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(customerEmail.trim());

        message.setSubject(
                "SupplyBase Booking Received - " + booking.getBookingNumber()
        );

        StringBuilder body = new StringBuilder();

        body.append("Hello ")
                .append(booking.getName())
                .append(",\n\n");

        body.append("Thank you for choosing SupplyBase.\n");
        body.append("Your service booking has been received successfully.\n\n");

        body.append("========================================\n");
        body.append("           BOOKING DETAILS\n");
        body.append("========================================\n\n");

        body.append("Booking Number : ")
                .append(valueOrDash(booking.getBookingNumber()))
                .append("\n");

        body.append("Service        : ")
                .append(valueOrDash(booking.getServiceLabel()))
                .append("\n");

        body.append("Status         : ")
                .append(valueOrDash(booking.getStatus()))
                .append("\n");

        body.append("Preferred Date : ")
                .append(valueOrDash(booking.getPreferredDate()))
                .append("\n");

        if (booking.getAppointmentSlot() != null) {
            body.append("Preferred Time : ")
                    .append(valueOrDash(
                            booking.getAppointmentSlot().getSlotTime()
                    ))
                    .append("\n");
        }

        body.append("\n");

        body.append("--------------- CUSTOMER ---------------\n");

        body.append("Name           : ")
                .append(valueOrDash(booking.getName()))
                .append("\n");

        body.append("Phone          : ")
                .append(valueOrDash(booking.getPhone()))
                .append("\n");

        body.append("WhatsApp       : ")
                .append(valueOrDash(booking.getWhatsapp()))
                .append("\n");

        body.append("Email          : ")
                .append(valueOrDash(booking.getEmail()))
                .append("\n");

        body.append("\n");

        body.append("--------------- LOCATION ---------------\n");

        body.append("Address        : ")
                .append(valueOrDash(booking.getAddress()))
                .append("\n");

        body.append("City           : ")
                .append(valueOrDash(booking.getCity()))
                .append("\n");

        body.append("Pincode        : ")
                .append(valueOrDash(booking.getPincode()))
                .append("\n");

        if (booking.getAreaSqft() != null) {
            body.append("Area           : ")
                    .append(booking.getAreaSqft())
                    .append(" sq.ft\n");
        }

        body.append("\n");

        body.append("--------------- PAYMENT ---------------\n");

if (booking.getItemsTotalPaise() != null
        && booking.getItemsTotalPaise() > 0) {

    body.append("Items Total    : ")
            .append(formatRupees(booking.getItemsTotalPaise()))
            .append("\n");
}

body.append("Visit Fee      : ")
        .append(formatRupees(booking.getVisitFeePaise()))
        .append("\n");

body.append("\n");

        body.append("----------------------------------------\n\n");

        body.append(
                "Our team will contact you on WhatsApp or phone "
                        + "to confirm the appointment.\n\n"
        );

        body.append(
                "Please keep your booking number "
                        + booking.getBookingNumber()
                        + " for future reference.\n\n"
        );

        body.append("Regards,\n");
        body.append("SupplyBase Team\n");

        message.setText(body.toString());

        sender.send(message);

        log.info(
                "Booking confirmation email sent to {} for booking {}",
                customerEmail,
                booking.getBookingNumber()
        );

    } catch (Exception ex) {
        // Email failure must never make an otherwise successful booking fail.
        log.warn(
                "Could not send booking confirmation email to {} for booking {}",
                customerEmail,
                booking.getBookingNumber(),
                ex
        );
    }
}

    /**
     * Stores the form answers, checking each against the catalogue first.
     *
     * The request shape is open — questions are data — but that must not mean
     * anything can be written. A key the service never asks about is dropped,
     * and a choice that is not one of the offered options is refused outright.
     *
     * Also computes the cart pricing total: for a 'cart_item' answer whose
     * matched catalogue option carries a price, the line's unit price and
     * quantity are copied from the catalogue/request — quantity from the
     * request (client-chosen, capped at 1 minimum by validation), price
     * always from the catalogue, never from the request — and multiplied
     * into a running total. This is what create() uses to decide the real
     * amount payable, so a manipulated client-side total can never be
     * charged.
     */
    private CartPricing storeAnswers(Booking booking, ServiceCategory category,
                              List<CreateBookingRequest.AnswerInput> submitted) {
        if (submitted == null || submitted.isEmpty()) {
            return new CartPricing(0L, false);
        }

        Map<String, ServiceOption> questionByKey = new HashMap<>();
        Map<String, Set<String>> allowedByKey = new HashMap<>();
        Map<String, ServiceOption> optionByKeyAndValue = new HashMap<>();
        for (ServiceOption option : options
                .findByCategoryIdAndActiveTrueOrderByStepNoAscSortOrderAsc(category.getId())) {
            questionByKey.putIfAbsent(option.getQuestionKey(), option);
            if (option.getOptionValue() != null) {
                allowedByKey.computeIfAbsent(option.getQuestionKey(), k -> new HashSet<>())
                        .add(option.getOptionValue());
                optionByKeyAndValue.put(option.getQuestionKey() + " " + option.getOptionValue(), option);
            }
        }

        List<BookingAnswer> rows = new ArrayList<>();
        long itemsTotalPaise = 0L;
        boolean hasConsultationAnswer = false;
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

            BookingAnswer.BookingAnswerBuilder row = BookingAnswer.builder()
                    .bookingId(booking.getId())
                    .questionKey(input.key())
                    // Copied from the catalogue, not from the request — the
                    // browser does not get to decide what it was asked.
                    .questionText(question.getQuestionText())
                    .answerValue(input.value())
                    .answerLabel(input.label());

            if ("cart_item".equals(input.key()) || PAINTING_PRICED_KEYS.contains(input.key())) {
                ServiceOption matched = optionByKeyAndValue.get(input.key() + " " + input.value());
                if (matched != null && matched.getPricePaise() != null) {
                    int quantity = input.quantity() == null ? 1 : Math.max(1, input.quantity());
                    long lineTotal = matched.getPricePaise() * quantity;
                    row.quantity(quantity).unitPricePaise(matched.getPricePaise()).lineTotalPaise(lineTotal);
                    itemsTotalPaise += lineTotal;
                }
            } else if ("consultation_type".equals(input.key())) {
                hasConsultationAnswer = true;
            }

            rows.add(row.build());
        }
        answers.saveAll(rows);
        return new CartPricing(itemsTotalPaise, hasConsultationAnswer);
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

    /**
     * One booking in full, including the answers actually given in the
     * booking wizard — the /mine list above deliberately skips these (an
     * extra query per row nobody's looking at yet), so this is the only
     * place they're fetched.
     */
    @Transactional(readOnly = true)
    public BookingResponse get(Long id, AuthenticatedUser viewer) {
        Booking booking = bookings.findById(id)
                .orElseThrow(() -> ApiException.notFound("That booking"));
        checkAccess(booking, viewer);

        List<BookingAnswerResponse> answerResponses = answers.findByBookingId(id).stream()
                .map(BookingAnswerResponse::from)
                .toList();
        return BookingResponse.from(booking, answerResponses);
    }

    /**
     * A customer's own edit to their booking — contact details and the visit
     * address only. The service items and price are locked in at booking
     * time (see storeAnswers); changing those here would leave a reserved or
     * paid amount out of sync with the cart, so that stays a "call us" change.
     *
     * Same 404-not-403 access check as get(): a booking that isn't the
     * caller's own does not confirm its existence, let alone let them edit it.
     */
    @Transactional
    public BookingResponse updateMine(Long id, UpdateMyBookingRequest request, AuthenticatedUser viewer) {
        Booking booking = bookings.findById(id)
                .orElseThrow(() -> ApiException.notFound("That booking"));
        checkAccess(booking, viewer);
        if (booking.getStatus().isFinal()) {
            throw ApiException.badRequest(
                    "That booking is already " + booking.getStatus().name().toLowerCase()
                            + " and can no longer be edited.");
        }

        String phone = PhoneNumbers.normalise(request.phone());
        booking.setName(request.name().trim());
        booking.setPhone(phone);
        booking.setWhatsapp(request.whatsapp() == null || request.whatsapp().isBlank()
                ? phone : PhoneNumbers.normalise(request.whatsapp()));
        booking.setEmail(blankToNull(request.email()));
        booking.setAddress(request.address().trim());
        booking.setCity(request.city().trim());
        booking.setPincode(blankToNull(request.pincode()));
        booking.setLocation(request.city().trim());

        List<BookingAnswerResponse> answerResponses = answers.findByBookingId(id).stream()
                .map(BookingAnswerResponse::from)
                .toList();
        return BookingResponse.from(bookings.save(booking), answerResponses);
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

        // A payout was agreed with the previous partner, not this one.
        if (booking.getAssignedProfessional() != null
                && !booking.getAssignedProfessional().getId().equals(professional.getId())) {
            booking.setPartnerPayoutPaise(null);
        }
        booking.setAssignedProfessional(professional);
        booking.setStatus(BookingStatus.PROFESSIONAL_ASSIGNED);
        return BookingResponse.from(bookings.save(booking));
    }

    /* ------------------------------------------------------- professional */

    @Transactional(readOnly = true)
    public List<ProfessionalBookingResponse> myAssignedBookings(Long professionalId) {
        List<Booking> jobs = bookings.findByAssignedProfessionalIdOrderByCreatedAtDesc(professionalId);
        Map<Long, List<ProfessionalBookingResponse.Requirement>> requirements = requirementsFor(
                jobs.stream().map(Booking::getId).toList());
        return jobs.stream()
                .map(b -> ProfessionalBookingResponse.from(b, requirements.getOrDefault(b.getId(), List.of())))
                .toList();
    }

    /** What the customer asked for on each job, grouped by booking — one query for all of them. */
    private Map<Long, List<ProfessionalBookingResponse.Requirement>> requirementsFor(List<Long> bookingIds) {
        Map<Long, List<ProfessionalBookingResponse.Requirement>> byBooking = new HashMap<>();
        if (bookingIds.isEmpty()) {
            return byBooking;
        }
        for (BookingAnswer answer : answers.findByBookingIdInOrderByIdAsc(bookingIds)) {
            byBooking.computeIfAbsent(answer.getBookingId(), k -> new ArrayList<>())
                    .add(ProfessionalBookingResponse.Requirement.from(answer));
        }
        return byBooking;
    }

    /** What the signed-in partner has earned, is still owed, and how many jobs are done. */
    @Transactional(readOnly = true)
    public PartnerEarningsResponse myEarnings(Long professionalId) {
        return PartnerEarningsResponse.from(
                bookings.findByAssignedProfessionalIdOrderByCreatedAtDesc(professionalId), Instant.now());
    }

    /* ---------------------------------------------------- partner payouts */

    @Transactional(readOnly = true)
    public PartnerPayoutResponse partnerPayout(Long bookingId) {
        return PartnerPayoutResponse.from(bookings.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("That booking")));
    }

    /**
     * Sets what the assigned partner earns for a job and whether it has been
     * paid out. The admin sends the state they want it to end up in.
     *
     * Money rules, so a payout can't be quietly wrong: it needs an assigned
     * partner; a cancelled job has none; "paid" needs a real amount and a
     * completed job; and a payout already marked paid can't have its amount
     * changed until it is marked unpaid first (so a paid figure never moves
     * without someone deliberately reopening it).
     */
    @Transactional
    public PartnerPayoutResponse setPartnerPayout(Long bookingId, Long amountPaise, boolean paid) {
        Booking booking = bookings.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("That booking"));

        if (booking.getAssignedProfessional() == null) {
            throw ApiException.conflict("Assign a partner to this job before setting a payout.");
        }
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw ApiException.conflict("A cancelled job has no payout.");
        }
        if (paid) {
            if (amountPaise == null || amountPaise <= 0) {
                throw ApiException.badRequest("Enter the payout amount before marking it paid.");
            }
            if (booking.getStatus() != BookingStatus.WORK_COMPLETED) {
                throw ApiException.conflict("A payout can be marked paid once the work is completed.");
            }
        }

        boolean wasPaid = booking.getPartnerPaidAt() != null;
        if (wasPaid && paid && !java.util.Objects.equals(amountPaise, booking.getPartnerPayoutPaise())) {
            throw ApiException.conflict(
                    "This payout is already marked paid. Mark it unpaid before changing the amount.");
        }

        booking.setPartnerPayoutPaise(amountPaise);
        booking.setPartnerPaidAt(paid ? (wasPaid ? booking.getPartnerPaidAt() : Instant.now()) : null);
        return PartnerPayoutResponse.from(bookings.save(booking));
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
        Booking saved = bookings.save(booking);
        return ProfessionalBookingResponse.from(saved,
                requirementsFor(List.of(saved.getId())).getOrDefault(saved.getId(), List.of()));
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

    /**
     * The booking wizard's own upload call, for the two services that collect
     * photos of the problem or the appliance. Booking creation is public and
     * usually anonymous, so this cannot require a signed-in owner the way
     * {@link #listFiles} does — instead it trusts whoever holds both the
     * booking number (BookingReceipt deliberately withholds the numeric id —
     * see its own javadoc — so this takes the human-readable number instead)
     * and the phone number on the booking, the same proof-of-ownership shape
     * the create endpoint's own rate limit already relies on.
     */
    @Transactional
    public BookingFileResponse uploadOwnFile(String bookingNumber, String phone, String kind, MultipartFile file) {
        Booking booking = bookings.findByBookingNumber(bookingNumber)
                .orElseThrow(() -> ApiException.notFound("That booking"));
        if (!booking.getPhone().equals(PhoneNumbers.normalise(phone))) {
            throw ApiException.notFound("That booking");
        }
        Long uploaderId = booking.getUser() != null ? booking.getUser().getId() : null;
        return uploadFile(booking.getId(), kind, file, uploaderId);
    }

    @Transactional(readOnly = true)
    public List<BookingFileResponse> listFiles(Long bookingId, AuthenticatedUser viewer) {
        Booking booking = bookings.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("That booking"));
        checkAccess(booking, viewer);

        return files.findByBookingIdOrderByCreatedAtDesc(bookingId).stream()
                .map(BookingFileResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public DownloadedFile downloadFile(Long bookingId, Long fileId, AuthenticatedUser viewer) {
        Booking booking = bookings.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("That booking"));
        checkAccess(booking, viewer);

        BookingFile file = files.findById(fileId)
                .filter(f -> f.getBooking().getId().equals(bookingId))
                .orElseThrow(() -> ApiException.notFound("That file"));

        byte[] content = storage.load(file.getStorageKey());
        return new DownloadedFile(content, file.getOriginalName(), file.getContentType());
    }

    /**
     * Staff sees any booking; the booking's own signed-in user (most
     * bookings are from visitors and have none) sees only their own. Anyone
     * else gets 404, not 403 — same reasoning as ProjectService.get. Shared
     * by get() and the file endpoints below — a booking's files are never
     * visible to someone who can't see the booking itself.
     */
    private void checkAccess(Booking booking, AuthenticatedUser viewer) {
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

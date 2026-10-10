package in.supplybase.backend.booking;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
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
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
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
import in.supplybase.backend.common.Money;
import in.supplybase.backend.common.PhotoUploads;
import in.supplybase.backend.common.PhoneNumbers;
import in.supplybase.backend.common.Reference;
import in.supplybase.backend.config.AppProperties;
import in.supplybase.backend.notification.Notification;
import in.supplybase.backend.notification.NotificationRepository;

@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    /**
     * A real person does not book six visits for one service in an hour; a
     * bot does. Counted per service, so someone booking a plumber, an
     * electrician and a painter in one sitting is not stopped.
     */
    private static final int MAX_PER_PHONE_PER_SERVICE_PER_HOUR = 5;

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
    // Joins a question key and an option value into one lookup key. Both the
    // map that is built and every lookup into it must use this same constant.
    private static final String OPTION_KEY_SEPARATOR = "\u0000";

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

    // paintingBhkPricing: package prices are read from the database.
    @org.springframework.beans.factory.annotation.Autowired
    private in.supplybase.backend.catalogue.PaintingProductPriceRepository paintingPrices;

    @org.springframework.beans.factory.annotation.Autowired
    private in.supplybase.backend.catalogue.PopCeilingPricingService popCeilingPricing;

    private final NotificationRepository notifications;
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
                          BookingFileRepository files, FileStorageService storage,
                          NotificationRepository notifications) {
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
        this.notifications = notifications;
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

        long recent = bookings.countByPhoneAndCategoryAndCreatedAtAfter(
                phone, category, Instant.now().minus(Duration.ofHours(1)));
        if (recent >= MAX_PER_PHONE_PER_SERVICE_PER_HOUR) {
            throw ApiException.badRequest("You have made " + MAX_PER_PHONE_PER_SERVICE_PER_HOUR
                    + " " + category.getName() + " bookings from this number in the last hour."
                    + " Please call us if you need another one now.");
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

        BookingReceipt receipt = BookingReceipt.from(saved);
        createBookingNotification(saved.getUser(), "Booking received",
                "Your " + saved.getServiceLabel()
                        + " booking has been received. Complete payment to confirm it.",
                "BOOKING_RECEIVED", saved.getId());
        // After commit: SMTP is slow and can stall, and it must neither hold
        // this transaction (and the appointment seat's row lock) open nor
        // email about a booking that then rolls back.
        Booking booked = saved;
        afterCommit(() -> {
            notifyStaff(booked);
            emailCustomer(booked, receipt);
        });
        return receipt;
    }

    private record CartPricing(long itemsTotalPaise, boolean hasConsultationAnswer) {
    }

    /** Adds an entry to the recipient's notification bell; skipped when there is no account. */
    private void createBookingNotification(User recipient, String title, String message,
                                           String notificationType, Long bookingId) {
        if (recipient == null) return;
        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setNotificationType(notificationType);
        notification.setRelatedBookingId(bookingId);
        notifications.save(notification);
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
                optionByKeyAndValue.put(option.getQuestionKey() + OPTION_KEY_SEPARATOR + option.getOptionValue(), option);
            }
        }

        boolean popBooking = "pop-ceiling-design".equals(category.getSlug());
        Map<String, String> popSelections = new HashMap<>();

        if (popBooking) {
            Set<String> popSingleKeys = Set.of(
                    "pop_home_type", "pop_home_design_style",
                    "pop_room_type", "pop_room_design_style");

            for (CreateBookingRequest.AnswerInput input : submitted) {
                if (popSingleKeys.contains(input.key())
                        && popSelections.putIfAbsent(input.key(), input.value()) != null) {
                    throw ApiException.badRequest(
                            "Choose only one option for each POP question.");
                }
            }

            boolean homeJourney = popSelections.containsKey("pop_home_type")
                    || popSelections.containsKey("pop_home_design_style");
            boolean roomJourney = popSelections.containsKey("pop_room_type")
                    || popSelections.containsKey("pop_room_design_style");

            if (homeJourney && roomJourney) {
                throw ApiException.badRequest("Choose one POP journey.");
            }
            if (roomJourney) {
                Map<String, Set<String>> allowedRoomCeilings = Map.of(
                        "living-room", Set.of(
                                "flat-ceiling", "double-layer-ceiling",
                                "floating-ceiling", "border-ceiling",
                                "profile-pop", "pvc-panel-pop"),
                        "bedroom", Set.of(
                                "flat-ceiling", "double-layer-ceiling",
                                "floating-ceiling", "border-ceiling",
                                "profile-pop", "pvc-panel-pop"),
                        "balcony-pvc", Set.of("pvc-panel-pop"),
                        "kitchen", Set.of("flat-ceiling"),
                        "passage-pvc", Set.of("flat-ceiling", "profile-pop"),
                        "bathroom-pvc", Set.of("pvc-panel-pop"));

                String roomType = popSelections.get("pop_room_type");
                String ceilingType = popSelections.get("pop_room_design_style");

                if (roomType == null || ceilingType == null
                        || !allowedRoomCeilings.getOrDefault(roomType, Set.of())
                                .contains(ceilingType)) {
                    throw ApiException.badRequest(
                            "Choose an available ceiling for your selected room.");
                }
            }
            if (roomJourney
                    && (!popSelections.containsKey("pop_room_type")
                        || !popSelections.containsKey("pop_room_design_style"))) {
                throw ApiException.badRequest("Choose your room and ceiling type.");
            }
            if (homeJourney
                    && (!popSelections.containsKey("pop_home_type")
                        || !popSelections.containsKey("pop_home_design_style"))) {
                throw ApiException.badRequest("Choose your home and ceiling type.");
            }
        }

        Map<String, String> paintingSelections = new HashMap<>();
        boolean paintingBooking = "painting".equals(category.getSlug());

        if (paintingBooking) {
            Set<String> singleKeys = Set.of(
                    "home_type", "paint_brand", "few_walls_area", "few_walls_ceiling_type",
                    "full_home_painting_type", "full_home_product",
                    "few_walls_painting_type", "few_walls_product");

            Set<String> seenAnswers = new HashSet<>();
            for (CreateBookingRequest.AnswerInput input : submitted) {
                String identity = input.key() + "\u0000" + input.value();
                if (!seenAnswers.add(identity)) {
                    throw ApiException.badRequest("The same painting option was submitted twice.");
                }
                if (singleKeys.contains(input.key())
                        && paintingSelections.putIfAbsent(input.key(), input.value()) != null) {
                    throw ApiException.badRequest("Choose only one option for each painting question.");
                }
            }

            if (paintingSelections.containsKey("full_home_product")
                    && paintingSelections.containsKey("few_walls_product")) {
                throw ApiException.badRequest("Choose one painting journey.");
            }

            if (paintingSelections.containsKey("full_home_product")
                    && (!paintingSelections.containsKey("home_type")
                        || !paintingSelections.containsKey("paint_brand")
                        || !paintingSelections.containsKey("full_home_painting_type"))) {
                throw ApiException.badRequest("Choose your home, painting type and brand.");
            }
        }

        if (paintingBooking
                && paintingSelections.containsKey("few_walls_product")
                && (!paintingSelections.containsKey("few_walls_area")
                    || !paintingSelections.containsKey("paint_brand"))) {
            throw ApiException.badRequest("Choose your walls and paint brand.");
        }

        if (paintingBooking
                && paintingSelections.containsKey("few_walls_product")
                && "ceiling-paint".equals(paintingSelections.get("few_walls_area"))
                && !Set.of("plain-ceiling", "design-ceiling").contains(
                        paintingSelections.getOrDefault("few_walls_ceiling_type", ""))) {
            throw ApiException.badRequest("Choose Plain Ceiling or Design Ceiling.");
        }

        boolean hasRenovationPackagePrice = paintingBooking
                && "renovation-painting".equals(
                        paintingSelections.get("full_home_painting_type"))
                && paintingSelections.containsKey("full_home_product")
                && paintingPrices
                        .findByFlowKeyAndPaintingTypeAndBrandAndHomeTypeAndProductValue(
                                "full_home_product",
                                "renovation-painting",
                                paintingSelections.get("paint_brand"),
                                paintingSelections.get("home_type"),
                                paintingSelections.get("full_home_product"))
                        .map(price -> price.getPricePaise() != null
                                && price.getPricePaise() > 0)
                        .orElse(false);

        boolean renovationSiteQuote = paintingBooking
                && (("renovation-painting".equals(
                            paintingSelections.get("full_home_painting_type"))
                        && !hasRenovationPackagePrice)
                    || submitted.stream().anyMatch(
                            input -> "renovation_area".equals(input.key())));

        boolean paintingSiteQuote = paintingBooking
                && (("unfurnished-home".equals(
                            paintingSelections.get("full_home_painting_type"))
                        && "independent-house".equals(
                            paintingSelections.get("home_type")))
                    || ("multiple-walls".equals(
                            paintingSelections.get("few_walls_area"))
                        && paintingSelections.containsKey("few_walls_product")));

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

            if (popBooking && "pop_room_design_style".equals(input.key())) {
                Long startingPrice = popCeilingPricing.findRoomPricePaise(
                        popSelections.get("pop_room_type"), input.value());

                if (startingPrice == null) {
                    throw ApiException.badRequest(
                            "Pricing is unavailable for this room selection.");
                }

                row.quantity(1)
                        .unitPricePaise(startingPrice)
                        .lineTotalPaise(startingPrice);
                itemsTotalPaise += startingPrice;
            }

            if (popBooking && "pop_home_design_style".equals(input.key())) {
                String homeType = popSelections.get("pop_home_type");

                if (!"4bhk".equals(homeType)) {
                    Long startingPrice = popCeilingPricing.findPricePaise(
                            homeType, input.value());
                    if (startingPrice == null) {
                        throw ApiException.badRequest(
                                "Pricing is unavailable for this POP selection.");
                    }

                    row.quantity(1)
                            .unitPricePaise(startingPrice)
                            .lineTotalPaise(startingPrice);
                    itemsTotalPaise += startingPrice;
                }
            }

            if ("cart_item".equals(input.key())
                    || (paintingBooking && PAINTING_PRICED_KEYS.contains(input.key()))) {
                ServiceOption matched = optionByKeyAndValue.get(
                        input.key() + OPTION_KEY_SEPARATOR + input.value());

                Long unitPricePaise = matched == null ? null : matched.getPricePaise();

                // Home and painting type identify the package; they are not extra charges.
                if (paintingBooking && Set.of(
                        "home_type", "full_home_painting_type",
                        "few_walls_painting_type").contains(input.key())) {
                    unitPricePaise = null;
                }

                if (paintingBooking && Set.of(
                        "full_home_product", "few_walls_product").contains(input.key())) {
                    String productBrand = input.value().startsWith("berger-")
                            ? "berger" : "asian-paints";

                    if (!productBrand.equals(paintingSelections.get("paint_brand"))) {
                        throw ApiException.badRequest(
                                "Choose a product from your selected paint brand.");
                    }

                    boolean fewWalls = "few_walls_product".equals(input.key());
                    boolean ceiling = fewWalls && "ceiling-paint".equals(
                            paintingSelections.get("few_walls_area"));
                    unitPricePaise = null;

                    if (!paintingSiteQuote) {
                        unitPricePaise = paintingPrices
                                .findByFlowKeyAndPaintingTypeAndBrandAndHomeTypeAndProductValue(
                                        input.key(),
                                        fewWalls ? (ceiling ? "ceiling-painting" : "wall-painting")
                                                : paintingSelections.get("full_home_painting_type"),
                                        paintingSelections.get("paint_brand"),
                                        fewWalls ? (ceiling
                                                ? paintingSelections.get("few_walls_ceiling_type")
                                                : paintingSelections.get("few_walls_area"))
                                                : paintingSelections.get("home_type"),
                                        input.value())
                                .map(in.supplybase.backend.catalogue.PaintingProductPrice::getPricePaise)
                                .orElse(null);
                    }
                }

                if (unitPricePaise != null) {
                    // A painting package or selected add-on is counted once.
                    int quantity = paintingBooking ? 1
                            : input.quantity() == null ? 1 : Math.max(1, input.quantity());
                    long lineTotal = unitPricePaise * quantity;
                    row.quantity(quantity)
                            .unitPricePaise(unitPricePaise)
                            .lineTotalPaise(lineTotal);
                    itemsTotalPaise += lineTotal;
                }
            } else if ("consultation_type".equals(input.key())) {
                hasConsultationAnswer = true;
            }

            rows.add(row.build());
        }
        answers.saveAll(rows);
        return new CartPricing((paintingSiteQuote || renovationSiteQuote) ? 0L : itemsTotalPaise, hasConsultationAnswer);
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
        // In visit-time order: the picked time on new bookings, the old
        // morning/afternoon lane (already the query's order) on legacy ones.
        return bookings.findByPreferredDateOrderByPreferredSlotAsc(date).stream()
                .sorted(java.util.Comparator.comparing(
                        (Booking b) -> b.getAppointmentSlot() == null ? null : b.getAppointmentSlot().getSlotTime(),
                        java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())))
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

    /**
     * A customer cancelling their own booking from the dashboard. Allowed
     * until the work is scheduled (BookingStatus.isCustomerCancellable);
     * after that the office handles it by phone.
     *
     * Frees the appointment seat, like a staff cancel does. A booking already
     * paid online is NOT refunded automatically: it is marked in the admin
     * notes (and the staff email) so the office refunds it from Payments.
     */
    @Transactional
    public BookingResponse cancelMine(Long id, String reason, AuthenticatedUser viewer) {
        Booking booking = bookings.findById(id)
                .orElseThrow(() -> ApiException.notFound("That booking"));
        checkAccess(booking, viewer);
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw ApiException.conflict("That booking is already cancelled.");
        }
        if (!booking.getStatus().isCustomerCancellable()) {
            throw ApiException.conflict(booking.getStatus() == BookingStatus.WORK_COMPLETED
                    ? "That booking is already completed and can no longer be cancelled."
                    : "The work on this booking is already scheduled. Please call us to cancel it.");
        }

        String given = blankToNull(reason);
        String cancelledReason = "Cancelled by the customer" + (given == null ? "." : ": " + given);
        booking.setCancelledReason(cancelledReason.length() <= 300
                ? cancelledReason : cancelledReason.substring(0, 300));
        booking.setStatus(BookingStatus.CANCELLED);
        // The status check above guarantees this runs once per booking.
        if (booking.getAppointmentSlot() != null) {
            appointments.release(booking.getAppointmentSlot());
        }
        if (booking.getPaidAt() != null) {
            String note = "REFUND DUE: customer cancelled on %s after paying %s online. Refund it from Payments."
                    .formatted(LocalDate.now(), "₹" + Money.formatRupees(booking.getVisitFeePaise()));
            booking.setAdminNotes(booking.getAdminNotes() == null || booking.getAdminNotes().isBlank()
                    ? note : note + "\n\n" + booking.getAdminNotes());
        }

        Booking saved = bookings.save(booking);
        afterCommit(() -> {
            notifyStaffOfCancellation(saved);
            emailCustomerCancellation(saved);
        });
        List<BookingAnswerResponse> answerResponses = answers.findByBookingId(id).stream()
                .map(BookingAnswerResponse::from)
                .toList();
        return BookingResponse.from(saved, answerResponses);
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
        Booking saved = bookings.save(booking);
        createBookingNotification(professional, "New booking assigned",
                "You have been assigned a " + saved.getServiceLabel() + " booking.",
                "BOOKING_ASSIGNED", saved.getId());
        return BookingResponse.from(saved);
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
     * The booking wizard's own photo upload, keyed by the booking NUMBER (what
     * BookingReceipt hands back; it withholds the numeric id).
     *
     * A booking is always made by a signed-in customer now, so the upload
     * needs that same customer (or staff) - it used to be open to anyone
     * who held the booking number plus its phone number. Only JPEG, PNG and
     * WebP photos are taken ({@link PhotoUploads}), at most
     * {@link PhotoUploads#MAX_PHOTOS_PER_BOOKING} per booking, and they are
     * always stored as PHOTO whatever the caller says.
     */
    @Transactional
    public BookingFileResponse uploadOwnFile(String bookingNumber, AuthenticatedUser viewer, MultipartFile file) {
        Booking booking = bookings.findByBookingNumber(bookingNumber)
                .orElseThrow(() -> ApiException.notFound("That booking"));
        checkAccess(booking, viewer);
        PhotoUploads.require(file);
        if (files.countByBookingIdAndKind(booking.getId(), "PHOTO") >= PhotoUploads.MAX_PHOTOS_PER_BOOKING) {
            throw ApiException.badRequest("This booking already has the most photos it can hold ("
                    + PhotoUploads.MAX_PHOTOS_PER_BOOKING + ").");
        }
        return uploadFile(booking.getId(), "PHOTO", file, viewer.id());
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

    /** Runs once the current transaction commits, or straight away outside one. */
    private static void afterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                action.run();
            }
        });
    }

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

    private static final DateTimeFormatter EMAIL_DATE =
            DateTimeFormatter.ofPattern("EEE, d MMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter EMAIL_TIME =
            DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH);

    /**
     * Confirms the booking to the customer, at the email given on the form or
     * else their account's. Its own switch (CUSTOMER_EMAILS, on by default),
     * not the staff one, and best effort like it: a mail failure never fails
     * the booking.
     */
    private void emailCustomer(Booking booking, BookingReceipt receipt) {
        if (!props.notifications().customerEmailsEnabled()) {
            return;
        }
        String to = booking.getEmail() != null ? booking.getEmail()
                : booking.getUser() != null ? blankToNull(booking.getUser().getEmail()) : null;
        JavaMailSender sender = mailSender.getIfAvailable();
        if (to == null || sender == null) {
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Your Supplybase booking %s — %s".formatted(
                    booking.getBookingNumber(), booking.getServiceLabel()));
            String when = (booking.getPreferredDate() == null ? "—" : booking.getPreferredDate().format(EMAIL_DATE))
                    + (receipt.time() == null ? "" : ", " + receipt.time().format(EMAIL_TIME));
            message.setText((
                    "Hello %s,\n\n"
                    + "Thank you for booking with Supplybase.\n\n"
                    + "Booking:   %s\n"
                    + "Service:   %s\n"
                    + "Visit:     %s\n"
                    + "Address:   %s, %s %s\n"
                    + "Visit fee: %s\n\n"
                    + "%s\n\n"
                    + "%s"
                    + "Need to change something? Just reply to this email.\n").formatted(
                    booking.getName(), booking.getBookingNumber(), booking.getServiceLabel(), when,
                    orDash(booking.getAddress()), orDash(booking.getCity()), orDash(booking.getPincode()),
                    receipt.visitFeeDisplay(), receipt.message(),
                    booking.getUser() == null ? ""
                            : "See your booking any time: " + props.frontendUrl() + "/dashboard/bookings\n\n"));
            sender.send(message);
        } catch (Exception ex) {
            log.warn("Could not email booking {} to the customer — it is saved regardless",
                    booking.getBookingNumber(), ex);
        }
    }

    /** Tells the office a customer cancelled, and whether a refund is owed. Best effort. */
    private void notifyStaffOfCancellation(Booking booking) {
        if (!props.notifications().emailEnabled()) {
            return;
        }
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            return;
        }
        boolean refundDue = booking.getPaidAt() != null;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(props.notifications().enquiryRecipient());
            message.setSubject("%sBooking %s cancelled by customer — %s (%s)".formatted(
                    refundDue ? "[REFUND DUE] " : "",
                    booking.getBookingNumber(), booking.getServiceLabel(), booking.getName()));
            message.setText((
                    "A customer cancelled their booking from their account.\n\n"
                    + "Booking:   %s\n"
                    + "Service:   %s\n"
                    + "Date:      %s\n"
                    + "Name:      %s\n"
                    + "Mobile:    %s\n"
                    + "Reason:    %s\n\n"
                    + "%s").formatted(
                    booking.getBookingNumber(), booking.getServiceLabel(),
                    booking.getPreferredDate(), booking.getName(), booking.getPhone(),
                    orDash(booking.getCancelledReason()),
                    refundDue
                            ? "They had paid " + "₹" + Money.formatRupees(booking.getVisitFeePaise())
                                    + " online. It has NOT been refunded automatically: refund it from"
                                    + " Payments in the admin panel.\n"
                            : "Nothing was paid online, so there is nothing to refund.\n"));
            sender.send(message);
        } catch (Exception ex) {
            log.warn("Could not email the cancellation of booking {} — it is cancelled regardless",
                    booking.getBookingNumber(), ex);
        }
    }

    /** Confirms the cancellation to the customer, under the same switch as emailCustomer. */
    private void emailCustomerCancellation(Booking booking) {
        if (!props.notifications().customerEmailsEnabled()) {
            return;
        }
        String to = booking.getEmail() != null ? booking.getEmail()
                : booking.getUser() != null ? blankToNull(booking.getUser().getEmail()) : null;
        JavaMailSender sender = mailSender.getIfAvailable();
        if (to == null || sender == null) {
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Your Supplybase booking %s is cancelled".formatted(booking.getBookingNumber()));
            message.setText((
                    "Hello %s,\n\n"
                    + "Your booking %s (%s) has been cancelled as you asked.\n\n"
                    + "%s"
                    + "Changed your mind? You can book again any time at %s\n").formatted(
                    booking.getName(), booking.getBookingNumber(), booking.getServiceLabel(),
                    booking.getPaidAt() != null
                            ? "You paid " + "₹" + Money.formatRupees(booking.getVisitFeePaise())
                                    + " online. Our team will refund it to your original payment method.\n\n"
                            : "",
                    props.frontendUrl()));
            sender.send(message);
        } catch (Exception ex) {
            log.warn("Could not email the cancellation of booking {} to the customer",
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

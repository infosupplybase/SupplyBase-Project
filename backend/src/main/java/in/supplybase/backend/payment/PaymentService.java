package in.supplybase.backend.payment;

import java.time.Instant;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import in.supplybase.backend.auth.AuthenticatedUser;
import in.supplybase.backend.auth.User;
import in.supplybase.backend.auth.UserRepository;
import in.supplybase.backend.booking.Booking;
import in.supplybase.backend.booking.BookingRepository;
import in.supplybase.backend.booking.BookingStatus;
import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.Money;
import in.supplybase.backend.common.Reference;
import in.supplybase.backend.payment.dto.CreatePaymentRequest;
import in.supplybase.backend.payment.dto.PaymentResponse;
import in.supplybase.backend.payment.dto.RazorpayOrderResponse;
import in.supplybase.backend.payment.dto.VerifyPaymentRequest;
import in.supplybase.backend.project.ProjectRepository;
import in.supplybase.backend.project.ProjectStage;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository payments;
    private final PaymentEventRepository events;
    private final UserRepository users;
    private final ProjectRepository projects;
    private final RazorpayService razorpay;
    private final InvoiceService invoices;
    private final BookingRepository bookings;

    public PaymentService(PaymentRepository payments, PaymentEventRepository events,
                          UserRepository users, ProjectRepository projects,
                          RazorpayService razorpay, InvoiceService invoices,
                          BookingRepository bookings) {
        this.payments = payments;
        this.events = events;
        this.users = users;
        this.projects = projects;
        this.razorpay = razorpay;
        this.invoices = invoices;
        this.bookings = bookings;
    }

    /* ------------------------------------------------------------ reads */

    @Transactional(readOnly = true)
    public List<PaymentResponse> myPayments(Long userId) {
        return payments.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(PaymentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<PaymentResponse> listAll(Pageable pageable) {
        return payments.findAllByOrderByCreatedAtDesc(pageable).map(PaymentResponse::from);
    }

    /* --------------------------------------------------------- creation */

    @Transactional
    public PaymentResponse raise(CreatePaymentRequest request) {
        User client = users.findById(request.userId())
                .orElseThrow(() -> ApiException.badRequest("That client account does not exist."));

        Payment payment = Payment.builder()
                .reference(Reference.forPayment())
                .user(client)
                .paymentType(request.paymentType())
                .description(request.description().trim())
                .amountPaise(Money.rupeesToPaise(request.amount()))
                .currency("INR")
                .status(PaymentStatus.PENDING)
                .dueDate(request.dueDate())
                .build();

        if (request.projectId() != null) {
            payment.setProject(projects.findById(request.projectId())
                    .orElseThrow(() -> ApiException.badRequest("That project does not exist.")));
        }
        if (request.stageId() != null) {
            if (payment.getProject() == null) {
                throw ApiException.badRequest("A milestone payment needs a project.");
            }
            ProjectStage stage = payment.getProject().getStages().stream()
                    .filter(s -> s.getId().equals(request.stageId()))
                    .findFirst()
                    .orElseThrow(() -> ApiException.badRequest("That stage is not on that project."));
            payment.setStage(stage);
        }

        return PaymentResponse.from(payments.save(payment));
    }

    /* ---------------------------------------------------------- checkout */

    /**
     * Creates (or reuses) the Razorpay order for a payment and returns what
     * the browser checkout needs.
     *
     * Reusing an existing order id matters: a client who opens checkout, closes
     * it, and comes back must not generate a second order for the same invoice.
     */
    @Transactional
    public RazorpayOrderResponse startCheckout(Long paymentId, AuthenticatedUser caller) {
        Payment payment = payments.findById(paymentId)
                .orElseThrow(() -> ApiException.notFound("That payment"));

        if (!caller.isStaff() && !payment.getUser().getId().equals(caller.id())) {
            throw ApiException.notFound("That payment");
        }
        if (payment.isSettled()) {
            throw ApiException.badRequest("That payment has already been settled.");
        }
        if (payment.getStatus() == PaymentStatus.CANCELLED) {
            throw ApiException.badRequest("That payment was cancelled.");
        }
        return openCheckout(payment);
    }

    /** Creates the Razorpay order on first use and returns what checkout needs. */
    private RazorpayOrderResponse openCheckout(Payment payment) {
        String orderId = payment.getRazorpayOrderId();
        if (orderId == null) {
            orderId = razorpay.createOrder(payment.getAmountPaise(), payment.getCurrency(),
                    payment.getReference());
            payment.setRazorpayOrderId(orderId);
            payments.save(payment);
        }

        User client = payment.getUser();
        return new RazorpayOrderResponse(orderId, razorpay.keyId(), payment.getAmountPaise(),
                payment.getCurrency(), payment.getReference(), payment.getDescription(),
                client.getFullName(), client.getEmail(), client.getPhone());
    }

    /**
     * Opens checkout for a booking's fee, keyed by the booking number the
     * booking form hands back.
     *
     * The amount is the booking's own visitFeePaise, fixed by the server when
     * the booking was made, so nothing the browser sends can change what is
     * charged. One payment row per booking is reused across attempts, so
     * closing checkout and trying again does not raise a second charge.
     */
    @Transactional
    public RazorpayOrderResponse startBookingCheckout(String bookingNumber, AuthenticatedUser caller) {
        Booking booking = bookings.findByBookingNumber(bookingNumber)
                .orElseThrow(() -> ApiException.notFound("That booking"));

        User owner = booking.getUser();
        if (owner == null || (!caller.isStaff() && !owner.getId().equals(caller.id()))) {
            throw ApiException.notFound("That booking");
        }
        if (booking.getPaidAt() != null) {
            throw ApiException.badRequest("This booking has already been paid.");
        }
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw ApiException.badRequest("This booking was cancelled, so it cannot be paid.");
        }
        if (!booking.getStatus().isBeforeVisit()) {
            throw ApiException.badRequest("This booking is past the visit stage. Please pay our team directly.");
        }
        if (booking.getVisitFeePaise() <= 0) {
            throw ApiException.badRequest("There is nothing to pay on this booking.");
        }

        // The customer chose to pay online: from now on BookingExpiryJob may
        // cancel the booking if the payment is never finished.
        if (booking.getOnlineCheckoutAt() == null) {
            booking.setOnlineCheckoutAt(Instant.now());
            bookings.save(booking);
        }

        Payment payment = payments.findFirstByBookingIdAndStatusInOrderByCreatedAtDesc(
                        booking.getId(), List.of(PaymentStatus.PENDING, PaymentStatus.FAILED))
                .orElseGet(() -> payments.save(Payment.builder()
                        .reference(Reference.forPayment())
                        .user(owner)
                        .booking(booking)
                        .paymentType(PaymentType.BOOKING)
                        .description(truncateDescription(booking.getServiceLabel() + " booking "
                                + booking.getBookingNumber()))
                        .amountPaise(booking.getVisitFeePaise())
                        .currency("INR")
                        .status(PaymentStatus.PENDING)
                        .build()));

        return openCheckout(payment);
    }

    /**
     * The browser's success callback. Verifies the signature, then marks paid.
     *
     * This is a convenience so the client sees the result immediately — the
     * webhook is the authoritative path, because a closed tab or dead network
     * kills this call while the money is still taken.
     */
    @Transactional
    public PaymentResponse confirmFromCheckout(VerifyPaymentRequest request, AuthenticatedUser caller) {
        Payment payment = payments.findByRazorpayOrderId(request.razorpayOrderId())
                .orElseThrow(() -> ApiException.notFound("That payment"));

        if (!caller.isStaff() && !payment.getUser().getId().equals(caller.id())) {
            throw ApiException.notFound("That payment");
        }
        // Only a payment still waiting on money can become paid here. A paid
        // one is already done, and replaying an old signed checkout result
        // must never turn a refunded or cancelled payment back into PAID.
        if (payment.getStatus() != PaymentStatus.PENDING && payment.getStatus() != PaymentStatus.FAILED) {
            return PaymentResponse.from(payment);
        }

        if (!razorpay.verifyCheckoutSignature(request.razorpayOrderId(),
                request.razorpayPaymentId(), request.razorpaySignature())) {
            payment.setFailureReason("Checkout signature did not verify");
            payments.save(payment);
            throw ApiException.badRequest("We could not verify that payment. Please contact us.");
        }

        markPaid(payment, request.razorpayPaymentId(), request.razorpaySignature());
        return PaymentResponse.from(payments.save(payment));
    }

    /* ----------------------------------------------------------- refund */

    /**
     * Asks Razorpay to refund a payment. This only reads Payment to
     * validate, then delegates to Razorpay — no DB write here. The actual
     * PAID -> REFUNDED transition happens exclusively through the
     * refund.processed/refund.created webhook (see applyEvent), so this
     * method never touches payment.status itself.
     */
    @Transactional(readOnly = true)
    public String initiateRefund(Long paymentId, Long amountPaise, AuthenticatedUser caller) {
        Payment payment = payments.findById(paymentId)
                .orElseThrow(() -> ApiException.notFound("That payment"));

        if (payment.getStatus() != PaymentStatus.PAID) {
            throw ApiException.badRequest("Only a paid payment can be refunded.");
        }
        if (payment.getRazorpayPaymentId() == null) {
            throw ApiException.badRequest("This payment has no recorded Razorpay payment id to refund.");
        }
        if (amountPaise != null && amountPaise > payment.getAmountPaise()) {
            throw ApiException.badRequest("The refund amount cannot exceed the original payment.");
        }

        return razorpay.refund(payment.getRazorpayPaymentId(), amountPaise);
    }

    /* ---------------------------------------------------------- invoice */

    /**
     * Looks up a payment, enforces ownership the same way startCheckout
     * does, and renders its PDF invoice. Only a settled payment gets one —
     * an invoice for money never paid doesn't mean anything.
     */
    @Transactional(readOnly = true)
    public InvoiceFile getInvoicePdf(Long paymentId, AuthenticatedUser caller) {
        Payment payment = payments.findById(paymentId)
                .orElseThrow(() -> ApiException.notFound("That payment"));

        if (!caller.isStaff() && !payment.getUser().getId().equals(caller.id())) {
            throw ApiException.notFound("That payment");
        }
        if (!payment.isSettled()) {
            throw ApiException.badRequest("An invoice is only available once a payment has been paid.");
        }

        return new InvoiceFile(payment.getReference(), invoices.generate(payment));
    }

    /* ---------------------------------------------------------- webhook */

    /**
     * Records the webhook and applies it.
     *
     * REQUIRES_NEW so the audit row survives even when applying the event
     * throws — an event we failed to process is exactly the one worth keeping.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordAndApplyWebhook(String eventId, String eventType, String rawBody,
                                      boolean signatureValid, String razorpayOrderId,
                                      String razorpayPaymentId) {
        recordAndApplyWebhook(eventId, eventType, rawBody, signatureValid, razorpayOrderId,
                razorpayPaymentId, null);
    }

    /**
     * As above, with the payment's {@code refund_status} from the event
     * ("full" or "partial", null when the event carries none), so only a
     * full refund marks the payment REFUNDED.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordAndApplyWebhook(String eventId, String eventType, String rawBody,
                                      boolean signatureValid, String razorpayOrderId,
                                      String razorpayPaymentId, String refundStatus) {
        if (eventId != null && events.existsByRazorpayEventId(eventId)) {
            log.info("Ignoring duplicate Razorpay event {}", eventId);
            return;
        }

        PaymentEvent event = PaymentEvent.builder()
                .razorpayEventId(eventId)
                .eventType(eventType)
                .signatureValid(signatureValid)
                .payload(rawBody)
                .processed(false)
                .build();

        if (!signatureValid) {
            event.setProcessError("Signature did not verify — not applied");
            events.save(event);
            return;
        }

        try {
            Payment payment = razorpayOrderId == null ? null
                    : payments.findByRazorpayOrderId(razorpayOrderId).orElse(null);
            event.setPayment(payment);

            if (payment == null) {
                event.setProcessError("No payment matches order " + razorpayOrderId);
            } else {
                applyEvent(payment, eventType, razorpayPaymentId, refundStatus);
                payments.save(payment);
                event.setProcessed(true);
            }
        } catch (Exception ex) {
            log.error("Failed to apply Razorpay event {}", eventId, ex);
            event.setProcessError(truncate(ex.getMessage()));
        }
        events.save(event);
    }

    private void applyEvent(Payment payment, String eventType, String razorpayPaymentId,
                            String refundStatus) {
        switch (eventType) {
            case "payment.captured", "order.paid" -> {
                // A late or retried capture must not undo a refund or a
                // cancellation, nor re-stamp a payment that is already paid.
                if (payment.getStatus() == PaymentStatus.PENDING
                        || payment.getStatus() == PaymentStatus.FAILED) {
                    markPaid(payment, razorpayPaymentId, null);
                }
            }
            case "payment.failed" -> {
                // Only a payment that has not succeeded can fail. A late
                // `failed` for one attempt must not undo a later success.
                if (payment.getStatus() == PaymentStatus.PENDING) {
                    payment.setStatus(PaymentStatus.FAILED);
                    payment.setFailureReason("Razorpay reported the payment failed");
                }
            }
            // refund.created only means a refund was asked for (it can still
            // fail), and a partial refund leaves most of the money paid, so
            // only a processed refund that covers the whole payment counts.
            case "refund.processed" -> {
                if (payment.getStatus() == PaymentStatus.PAID && "full".equals(refundStatus)) {
                    payment.setStatus(PaymentStatus.REFUNDED);
                } else {
                    log.info("Refund on payment {} is not a full refund ({}); status kept as {}",
                            payment.getReference(), refundStatus, payment.getStatus());
                }
            }
            default -> log.debug("Ignoring unhandled Razorpay event type {}", eventType);
        }
    }

    private void markPaid(Payment payment, String razorpayPaymentId, String signature) {
        payment.setStatus(PaymentStatus.PAID);
        payment.setRazorpayPaymentId(razorpayPaymentId);
        if (signature != null) {
            payment.setRazorpaySignature(signature);
        }
        payment.setFailureReason(null);
        if (payment.getPaidAt() == null) {
            payment.setPaidAt(Instant.now());
        }
        markBookingPaid(payment);
    }

    /**
     * A verified booking payment stamps the booking paid and, if it was still
     * waiting on that payment, confirms it (RULE 7 in BookingStatus). A
     * booking that moved on, or was cancelled meanwhile, keeps its status:
     * staff see the paid stamp and can refund a cancelled one.
     */
    private void markBookingPaid(Payment payment) {
        Booking booking = payment.getBooking();
        if (booking == null || booking.getPaidAt() != null) {
            return;
        }
        booking.setPaidAt(payment.getPaidAt());
        if (booking.getStatus() == BookingStatus.PAYMENT_PENDING
                || booking.getStatus() == BookingStatus.BOOKING_REQUESTED) {
            booking.setStatus(BookingStatus.CONFIRMED);
        }
        bookings.save(booking);
    }

    private static String truncateDescription(String value) {
        return value.length() <= 255 ? value : value.substring(0, 255);
    }

    private static String truncate(String value) {
        if (value == null) {
            return null;
        }
        return value.length() <= 500 ? value : value.substring(0, 500);
    }
}

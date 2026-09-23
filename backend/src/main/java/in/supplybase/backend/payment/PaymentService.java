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

    public PaymentService(PaymentRepository payments, PaymentEventRepository events,
                          UserRepository users, ProjectRepository projects,
                          RazorpayService razorpay, InvoiceService invoices) {
        this.payments = payments;
        this.events = events;
        this.users = users;
        this.projects = projects;
        this.razorpay = razorpay;
        this.invoices = invoices;
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
                applyEvent(payment, eventType, razorpayPaymentId);
                payments.save(payment);
                event.setProcessed(true);
            }
        } catch (Exception ex) {
            log.error("Failed to apply Razorpay event {}", eventId, ex);
            event.setProcessError(truncate(ex.getMessage()));
        }
        events.save(event);
    }

    private void applyEvent(Payment payment, String eventType, String razorpayPaymentId) {
        switch (eventType) {
            case "payment.captured", "order.paid" -> {
                if (payment.getStatus() != PaymentStatus.PAID) {
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
            case "refund.processed", "refund.created" -> payment.setStatus(PaymentStatus.REFUNDED);
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
    }

    private static String truncate(String value) {
        if (value == null) {
            return null;
        }
        return value.length() <= 500 ? value : value.substring(0, 500);
    }
}

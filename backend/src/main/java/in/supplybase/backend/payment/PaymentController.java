package in.supplybase.backend.payment;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import in.supplybase.backend.auth.CurrentUser;
import in.supplybase.backend.payment.dto.CreatePaymentRequest;
import in.supplybase.backend.payment.dto.PaymentResponse;
import in.supplybase.backend.payment.dto.RazorpayOrderResponse;
import in.supplybase.backend.payment.dto.RefundRequest;
import in.supplybase.backend.payment.dto.VerifyPaymentRequest;
import jakarta.validation.Valid;

@RestController
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final PaymentService service;
    private final CurrentUser currentUser;

    public PaymentController(PaymentService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    /** The dashboard's "what do I owe" list. */
    @GetMapping("/api/payments/mine")
    public List<PaymentResponse> mine() {
        return service.myPayments(currentUser.require().id());
    }

    /** Step 1 of paying: get an order id for Razorpay's checkout. */
    @PostMapping("/api/payments/{id}/order")
    public RazorpayOrderResponse startCheckout(@PathVariable Long id) {
        return service.startCheckout(id, currentUser.require());
    }

    /** Step 2: the browser reports success and we verify the signature. */
    @PostMapping("/api/payments/verify")
    public PaymentResponse verify(@Valid @RequestBody VerifyPaymentRequest request) {
        return service.confirmFromCheckout(request, currentUser.require());
    }

    /** A PDF record of a settled payment, for the client or for staff. */
    @GetMapping(value = "/api/payments/{id}/invoice", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> invoice(@PathVariable Long id) {
        InvoiceFile invoice = service.getInvoicePdf(id, currentUser.require());
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"invoice-" + invoice.reference() + ".pdf\"")
                .body(invoice.content());
    }

    /* ----------------------------------------------------------- staff */

    @GetMapping("/api/admin/payments")
    public Page<PaymentResponse> list(@RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size) {
        return service.listAll(PageRequest.of(page, Math.min(size, 100)));
    }

    @PostMapping("/api/admin/payments")
    public ResponseEntity<PaymentResponse> raise(@Valid @RequestBody CreatePaymentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.raise(request));
    }

    /**
     * Initiates a refund with Razorpay. The payment row itself only flips to
     * REFUNDED once the refund.processed webhook confirms it — see
     * PaymentService.applyEvent.
     */
    @PostMapping("/api/admin/payments/{id}/refund")
    public Map<String, String> refund(@PathVariable Long id, @Valid @RequestBody RefundRequest request) {
        String refundId = service.initiateRefund(id, request.amountPaise(), currentUser.require());
        log.info("Refund {} initiated for payment {}: {}", refundId, id, request.reason());
        return Map.of("refundId", refundId, "status", "initiated");
    }
}

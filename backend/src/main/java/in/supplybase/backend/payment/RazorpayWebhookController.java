package in.supplybase.backend.payment;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Razorpay's server-to-server callback. This, not the browser, is the
 * authoritative record that money moved.
 *
 * The body is taken as a raw String on purpose: the HMAC is computed over the
 * exact bytes Razorpay sent, so deserialising to an object first and
 * re-serialising would change the whitespace and break every signature.
 */
@RestController
public class RazorpayWebhookController {

    private static final Logger log = LoggerFactory.getLogger(RazorpayWebhookController.class);
    private static final String SIGNATURE_HEADER = "X-Razorpay-Signature";
    // Razorpay sends the event id only in this header; the body has none.
    private static final String EVENT_ID_HEADER = "X-Razorpay-Event-Id";

    private final RazorpayService razorpay;
    private final PaymentService payments;
    private final ObjectMapper mapper;

    public RazorpayWebhookController(RazorpayService razorpay, PaymentService payments,
                                     ObjectMapper mapper) {
        this.razorpay = razorpay;
        this.payments = payments;
        this.mapper = mapper;
    }

    @PostMapping(value = "/api/payments/webhook", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> receive(
            @RequestBody String rawBody,
            @RequestHeader(value = SIGNATURE_HEADER, required = false) String signature,
            @RequestHeader(value = EVENT_ID_HEADER, required = false) String eventIdHeader) {

        boolean valid = signature != null && razorpay.verifyWebhookSignature(rawBody, signature);

        String eventType = "unknown";
        String eventId = eventIdHeader == null || eventIdHeader.isBlank() ? null : eventIdHeader;
        String orderId = null;
        String paymentId = null;
        String refundStatus = null;

        try {
            JsonNode root = mapper.readTree(rawBody);
            eventType = root.path("event").asString("unknown");
            if (eventId == null) {
                eventId = textOrNull(root.path("id"));
            }

            JsonNode entity = root.path("payload").path("payment").path("entity");
            if (entity.isObject()) {
                orderId = textOrNull(entity.path("order_id"));
                paymentId = textOrNull(entity.path("id"));
                refundStatus = textOrNull(entity.path("refund_status"));
            } else {
                JsonNode orderEntity = root.path("payload").path("order").path("entity");
                if (orderEntity.isObject()) {
                    orderId = textOrNull(orderEntity.path("id"));
                }
            }
        } catch (Exception ex) {
            log.warn("Could not parse a Razorpay webhook body", ex);
        }

        payments.recordAndApplyWebhook(eventId, eventType, rawBody, valid, orderId, paymentId,
                refundStatus);

        // Always 200, even for a bad signature. Razorpay retries on non-2xx,
        // and retrying a forged request forever helps nobody — it is recorded
        // as rejected and that is the end of it.
        return ResponseEntity.ok().build();
    }

    private static String textOrNull(JsonNode node) {
        return node.isMissingNode() || node.isNull() ? null : node.asString();
    }
}

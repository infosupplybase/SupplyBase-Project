package in.supplybase.backend.payment;

import java.util.concurrent.atomic.AtomicReference;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;

import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.config.AppProperties;

/**
 * The only class that talks to Razorpay. Everything else deals in our own
 * Payment entity, so swapping gateway or adding a second one touches this file.
 */
@Service
public class RazorpayService {

    private static final Logger log = LoggerFactory.getLogger(RazorpayService.class);

    private final AppProperties.Razorpay config;
    /** Built lazily: the app must boot without keys, e.g. on a dev machine. */
    private final AtomicReference<RazorpayClient> client = new AtomicReference<>();

    public RazorpayService(AppProperties props) {
        this.config = props.razorpay();
        if (!config.configured()) {
            log.warn("Razorpay keys are not set — payment endpoints will refuse until they are.");
        }
    }

    public boolean isConfigured() {
        return config.configured();
    }

    public String keyId() {
        return config.keyId();
    }

    /**
     * Creates the order Razorpay's checkout opens against.
     *
     * `receipt` carries our own payment reference so a row in their dashboard
     * can be traced back to a row in ours without a lookup table.
     */
    public String createOrder(long amountPaise, String currency, String receipt) {
        requireConfigured();
        try {
            JSONObject request = new JSONObject();
            request.put("amount", amountPaise);
            request.put("currency", currency == null ? config.currency() : currency);
            request.put("receipt", receipt);
            // Capture automatically: without this the money is only authorised
            // and silently reverses after a few days unless captured manually.
            request.put("payment_capture", 1);

            Order order = clientOrCreate().orders.create(request);
            return order.get("id");
        } catch (Exception ex) {
            log.error("Razorpay order creation failed for receipt {}", receipt, ex);
            throw new ApiException(org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "We could not reach the payment gateway. Please try again in a moment.");
        }
    }

    /**
     * Verifies the signature the browser returns after checkout.
     *
     * This is the whole security of the callback: the browser is not trusted,
     * and anyone can POST an order id. Only a signature computed with the key
     * secret proves Razorpay actually took the money.
     */
    public boolean verifyCheckoutSignature(String orderId, String paymentId, String signature) {
        requireConfigured();
        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", orderId);
            attributes.put("razorpay_payment_id", paymentId);
            attributes.put("razorpay_signature", signature);
            return Utils.verifyPaymentSignature(attributes, config.keySecret());
        } catch (Exception ex) {
            log.warn("Signature verification failed for order {}", orderId, ex);
            return false;
        }
    }

    /**
     * Initiates a refund. Razorpay confirms it asynchronously via the
     * refund.processed webhook — this call does not itself change any
     * Payment row.
     */
    public String refund(String razorpayPaymentId, Long amountPaise) {
        requireConfigured();
        try {
            JSONObject request = new JSONObject();
            if (amountPaise != null) {
                // Omit for a full refund — Razorpay refunds the full
                // captured amount when "amount" is absent.
                request.put("amount", amountPaise);
            }
            com.razorpay.Refund refund = clientOrCreate().payments.refund(razorpayPaymentId, request);
            return refund.get("id");
        } catch (Exception ex) {
            log.error("Razorpay refund failed for payment {}", razorpayPaymentId, ex);
            throw new ApiException(org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "We could not reach the payment gateway. Please try again in a moment.");
        }
    }

    /** Same idea for webhooks, signed with the separate webhook secret. */
    public boolean verifyWebhookSignature(String rawBody, String signature) {
        String secret = config.webhookSecret();
        if (secret == null || secret.isBlank()) {
            log.error("A webhook arrived but app.razorpay.webhook-secret is not set — rejecting it.");
            return false;
        }
        try {
            return Utils.verifyWebhookSignature(rawBody, signature, secret);
        } catch (Exception ex) {
            log.warn("Webhook signature verification threw", ex);
            return false;
        }
    }

    private RazorpayClient clientOrCreate() throws Exception {
        RazorpayClient existing = client.get();
        if (existing != null) {
            return existing;
        }
        RazorpayClient created = new RazorpayClient(config.keyId(), config.keySecret());
        return client.compareAndSet(null, created) ? created : client.get();
    }

    private void requireConfigured() {
        if (!config.configured()) {
            throw new ApiException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "Online payment is not switched on yet. Please contact us to pay another way.");
        }
    }
}

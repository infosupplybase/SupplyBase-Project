package in.supplybase.backend.whatsapp;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Meta's WhatsApp Cloud API webhook.
 *
 * GET is the one-time handshake Meta does when the webhook is saved in the
 * dashboard: it sends our verify token and a challenge, and we echo the
 * challenge back only if the token matches WHATSAPP_WEBHOOK_VERIFY_TOKEN.
 *
 * POST is each event. Meta signs the exact body bytes with the app secret
 * (HMAC-SHA256, header X-Hub-Signature-256: sha256=<hex>), so the body is read
 * raw and checked before anything else looks at it. Events are only
 * acknowledged for now; processing them comes later.
 *
 * The URL is public, so the body is capped at {@link #MAX_BODY_BYTES}. With
 * either setting blank, every request is refused.
 */
@RestController
@RequestMapping("/api/whatsapp/webhook")
public class WhatsAppWebhookController {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppWebhookController.class);
    private static final String SIGNATURE_HEADER = "X-Hub-Signature-256";
    private static final String SIGNATURE_PREFIX = "sha256=";
    static final int MAX_BODY_BYTES = 256 * 1024;

    private final String verifyToken;
    private final String appSecret;

    public WhatsAppWebhookController(
            @Value("${whatsapp.webhook.verify-token:}") String verifyToken,
            @Value("${whatsapp.webhook.app-secret:}") String appSecret) {
        this.verifyToken = verifyToken == null ? "" : verifyToken;
        this.appSecret = appSecret == null ? "" : appSecret;
    }

    @GetMapping
    public ResponseEntity<String> verify(
            @RequestParam(name = "hub.mode", required = false) String mode,
            @RequestParam(name = "hub.verify_token", required = false) String token,
            @RequestParam(name = "hub.challenge", required = false) String challenge) {

        if ("subscribe".equals(mode) && challenge != null && token != null
                && !verifyToken.isBlank()
                && MessageDigest.isEqual(verifyToken.getBytes(StandardCharsets.UTF_8),
                                         token.getBytes(StandardCharsets.UTF_8))) {
            return ResponseEntity.ok(challenge);
        }
        if (verifyToken.isBlank()) {
            log.warn("WhatsApp webhook verification refused: WHATSAPP_WEBHOOK_VERIFY_TOKEN is not set");
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Webhook verification failed");
    }

    @PostMapping
    public ResponseEntity<Void> receive(
            HttpServletRequest request,
            @RequestHeader(value = SIGNATURE_HEADER, required = false) String signature)
            throws IOException {

        if (request.getContentLengthLong() > MAX_BODY_BYTES) {
            return ResponseEntity.status(HttpStatus.CONTENT_TOO_LARGE).build();
        }
        byte[] body;
        try (InputStream in = request.getInputStream()) {
            // One byte over the cap is enough to know it is too big, and works
            // for a chunked body that sent no Content-Length.
            body = in.readNBytes(MAX_BODY_BYTES + 1);
        }
        if (body.length > MAX_BODY_BYTES) {
            return ResponseEntity.status(HttpStatus.CONTENT_TOO_LARGE).build();
        }

        if (!isValidSignature(body, signature)) {
            if (appSecret.isBlank()) {
                log.warn("WhatsApp webhook event refused: WHATSAPP_APP_SECRET is not set");
            }
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Signature verified. WhatsApp event processing will be added later.
        return ResponseEntity.ok().build();
    }

    boolean isValidSignature(byte[] body, String signature) {
        if (appSecret.isBlank() || signature == null || !signature.startsWith(SIGNATURE_PREFIX)) {
            return false;
        }
        byte[] received;
        try {
            received = HexFormat.of().parseHex(signature.substring(SIGNATURE_PREFIX.length()));
        } catch (IllegalArgumentException notHex) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(appSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return MessageDigest.isEqual(mac.doFinal(body), received);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HmacSHA256 unavailable", e);
        }
    }
}

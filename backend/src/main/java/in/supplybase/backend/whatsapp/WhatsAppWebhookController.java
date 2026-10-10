package in.supplybase.backend.whatsapp;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

@RestController
@RequestMapping("/api/whatsapp/webhook")
public class WhatsAppWebhookController {

    @Value("${whatsapp.webhook.verify-token:}")
    private String verifyToken;

    @Value("${whatsapp.webhook.app-secret:}")
private String appSecret;

    @GetMapping
    public ResponseEntity<String> verifyWebhook(
            @RequestParam(name = "hub.mode", required = false) String mode,
            @RequestParam(name = "hub.verify_token", required = false) String token,
            @RequestParam(name = "hub.challenge", required = false) String challenge) {

        if ("subscribe".equals(mode)
                && !verifyToken.isBlank()
                && verifyToken.equals(token)
                && challenge != null) {
            return ResponseEntity.ok(challenge);
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("Webhook verification failed");
    }
@PostMapping
public ResponseEntity<Void> receiveWebhook(
        @RequestBody byte[] payload,
        @RequestHeader(value = "X-Hub-Signature-256", required = false)
        String signature) {

    if (!isValidSignature(payload, signature)) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    // Signature verified. WhatsApp event processing will be added later.
    return ResponseEntity.ok().build();
}

private boolean isValidSignature(byte[] payload, String signature) {
    if (appSecret == null || appSecret.isBlank()
            || signature == null
            || !signature.startsWith("sha256=")) {
        return false;
    }

    try {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(
                appSecret.getBytes(StandardCharsets.UTF_8),
                "HmacSHA256"));

        byte[] expected = mac.doFinal(payload);
        byte[] received = HexFormat.of()
                .parseHex(signature.substring(7));

        return MessageDigest.isEqual(expected, received);
    } catch (Exception ex) {
        return false;
    }
}

}

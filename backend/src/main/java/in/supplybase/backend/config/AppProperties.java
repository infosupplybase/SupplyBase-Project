package in.supplybase.backend.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Everything under `app:` in application.yml, bound once at startup.
 *
 * Typed configuration rather than scattered @Value: a missing or malformed
 * value fails when the context loads, not on the first request that needs it.
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        List<String> corsAllowedOrigins,
        Jwt jwt,
        Razorpay razorpay,
        Notifications notifications) {

    public record Jwt(String secret, long accessTokenMinutes, long refreshTokenDays, String issuer) {
    }

    public record Razorpay(String keyId, String keySecret, String webhookSecret, String currency) {
        /** False when the keys are absent, which keeps the app bootable without them. */
        public boolean configured() {
            return keyId != null && !keyId.isBlank() && keySecret != null && !keySecret.isBlank();
        }
    }

    public record Notifications(String enquiryRecipient) {
        public boolean emailEnabled() {
            return enquiryRecipient != null && !enquiryRecipient.isBlank();
        }
    }
}

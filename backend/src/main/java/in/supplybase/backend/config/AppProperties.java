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
        Google google,
        Notifications notifications,
        // Where the site itself runs. The API has no other way to know this,
        // and it needs it to build links it emails out — reset-password,
        // verify-email — that must land on the frontend, not on this server.
        String frontendUrl,
        Bootstrap bootstrap,
        Booking booking,
        // Local-disk root for uploaded files (project documents, booking
        // files). See FileStorageService for why this is local disk and what
        // that means on Render/Railway.
        String storageRootDir) {

    public record Jwt(String secret, long accessTokenMinutes, long refreshTokenDays, String issuer) {
    }

    public record Razorpay(String keyId, String keySecret, String webhookSecret, String currency) {
        /** False when the keys are absent, which keeps the app bootable without them. */
        public boolean configured() {
            return keyId != null && !keyId.isBlank() && keySecret != null && !keySecret.isBlank();
        }
    }

    public record Google(String clientId) {
        /** False when no client id is set, which keeps the app bootable without one. */
        public boolean configured() {
            return clientId != null && !clientId.isBlank();
        }
    }

    public record Notifications(String enquiryRecipient) {
        public boolean emailEnabled() {
            return enquiryRecipient != null && !enquiryRecipient.isBlank();
        }
    }

    /**
     * Creates (or promotes) the very first admin account on startup, so a
     * fresh deployment is not stuck with no way to reach `/api/admin/**`.
     * Both values are opt-in and empty by default — set neither and this does
     * nothing.
     */
    public record Bootstrap(String adminEmail, String adminPassword) {
        public boolean configured() {
            return adminEmail != null && !adminEmail.isBlank()
                    && adminPassword != null && !adminPassword.isBlank();
        }
    }

    /** How long an unpaid or unconfirmed booking is held before it expires. */
    public record Booking(int expiryHours) {
    }
}

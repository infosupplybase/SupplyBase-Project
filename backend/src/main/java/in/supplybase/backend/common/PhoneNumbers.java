package in.supplybase.backend.common;

/**
 * Turns whatever someone typed into one canonical form.
 *
 * "+91 98200 11223", "098200 11223" and "9820011223" are the same number, and
 * a person will not type it the same way twice. Storing what they typed makes
 * "sign in with your phone number" a coin flip, so every number is reduced to
 * its ten national digits on the way in and on the way to a lookup.
 */
public final class PhoneNumbers {

    private static final String INDIA_COUNTRY_CODE = "91";
    private static final int NATIONAL_LENGTH = 10;

    private PhoneNumbers() {
    }

    /**
     * @return ten digits, or null for blank input
     * @throws ApiException if the input cannot be a phone number
     */
    public static String normalise(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String digits = raw.replaceAll("\\D", "");

        // +91 98200 11223 -> 9820011223
        if (digits.length() == NATIONAL_LENGTH + INDIA_COUNTRY_CODE.length()
                && digits.startsWith(INDIA_COUNTRY_CODE)) {
            digits = digits.substring(INDIA_COUNTRY_CODE.length());
        }
        // 098200 11223 -> 9820011223  (the old STD trunk prefix)
        if (digits.length() == NATIONAL_LENGTH + 1 && digits.startsWith("0")) {
            digits = digits.substring(1);
        }

        if (digits.length() != NATIONAL_LENGTH) {
            throw ApiException.badRequest(
                    "That phone number does not look right. Enter a 10-digit mobile number.");
        }
        return digits;
    }

    /** Lenient version for a sign-in box, where the input may be an email. */
    public static String normaliseOrNull(String raw) {
        try {
            return normalise(raw);
        } catch (ApiException ex) {
            return null;
        }
    }

    /** An email has an @; a phone number does not. That is the whole test. */
    public static boolean looksLikeEmail(String identifier) {
        return identifier != null && identifier.contains("@");
    }
}

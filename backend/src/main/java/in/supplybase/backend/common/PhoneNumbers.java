package in.supplybase.backend.common;

import java.util.regex.Pattern;

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

    // An Indian mobile number: ten digits starting 6, 7, 8 or 9. The website's
    // isValidPhone (frontend/src/lib/bookingDetails.js) applies the same rule.
    private static final Pattern MOBILE = Pattern.compile("^[6-9]\\d{9}$");

    /**
     * @return ten digits, or null for blank input
     * @throws ApiException if the input cannot be a mobile number
     */
    public static String normalise(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String digits = nationalDigits(raw);
        // 5876543210 and 0000000000 have ten digits but no phone answers them.
        if (digits == null || !MOBILE.matcher(digits).matches()) {
            throw ApiException.badRequest(
                    "That phone number does not look right. Enter a 10-digit mobile number.");
        }
        return digits;
    }

    /**
     * Lenient version for a sign-in box, where the input may be an email.
     * It does not apply the mobile-number rule, so an account saved before
     * that rule can still be found by the number it was saved with.
     */
    public static String normaliseOrNull(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return nationalDigits(raw);
    }

    /** The ten national digits of what was typed, or null if there aren't ten. */
    private static String nationalDigits(String raw) {
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
        return digits.length() == NATIONAL_LENGTH ? digits : null;
    }

    /** An email has an @; a phone number does not. That is the whole test. */
    public static boolean looksLikeEmail(String identifier) {
        return identifier != null && identifier.contains("@");
    }
}

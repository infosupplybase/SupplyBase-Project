package in.supplybase.backend.common;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Human-readable identifiers for things people talk about on the phone.
 *
 * "Your enquiry is ENQ-260825-4F7K" works on a call; database id 4213 does
 * not, and quoting the id would leak how many enquiries exist.
 */
public final class Reference {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyMMdd");
    // No I, O, 0 or 1 — they are indistinguishable when read aloud or written down.
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private Reference() {
    }

    public static String forEnquiry() {
        return build("ENQ");
    }

    public static String forPayment() {
        return build("PAY");
    }

    public static String forProject() {
        return build("PRJ");
    }

    public static String forBooking() {
        return build("BK");
    }

    private static String build(String prefix) {
        StringBuilder suffix = new StringBuilder(4);
        for (int i = 0; i < 4; i++) {
            suffix.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return prefix + "-" + LocalDate.now().format(DATE) + "-" + suffix;
    }
}

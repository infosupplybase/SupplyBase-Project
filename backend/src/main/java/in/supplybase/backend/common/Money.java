package in.supplybase.backend.common;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Conversions between paise (how everything is stored and sent to Razorpay)
 * and rupees (how everything is displayed).
 *
 * These exist so the conversion is written once. A `/ 100` scattered through
 * controllers is how half-paise rounding errors get into invoices.
 */
public final class Money {

    private Money() {
    }

    public static long rupeesToPaise(BigDecimal rupees) {
        if (rupees == null) {
            throw ApiException.badRequest("An amount is required.");
        }
        if (rupees.scale() > 2) {
            throw ApiException.badRequest("An amount cannot be more precise than paise.");
        }
        return rupees.movePointRight(2).setScale(0, RoundingMode.UNNECESSARY).longValueExact();
    }

    public static BigDecimal paiseToRupees(long paise) {
        return BigDecimal.valueOf(paise).movePointLeft(2).setScale(2, RoundingMode.UNNECESSARY);
    }

    /** "1,25,000.00" — Indian grouping, for emails and invoices. */
    public static String formatRupees(long paise) {
        String plain = paiseToRupees(paise).toPlainString();
        String[] parts = plain.split("\\.");
        String whole = parts[0];
        boolean negative = whole.startsWith("-");
        if (negative) {
            whole = whole.substring(1);
        }
        StringBuilder grouped = new StringBuilder();
        if (whole.length() <= 3) {
            grouped.append(whole);
        } else {
            String lastThree = whole.substring(whole.length() - 3);
            String rest = whole.substring(0, whole.length() - 3);
            StringBuilder restGrouped = new StringBuilder();
            while (rest.length() > 2) {
                restGrouped.insert(0, "," + rest.substring(rest.length() - 2));
                rest = rest.substring(0, rest.length() - 2);
            }
            if (!rest.isEmpty()) {
                restGrouped.insert(0, rest);
            } else if (restGrouped.charAt(0) == ',') {
                restGrouped.deleteCharAt(0);
            }
            grouped.append(restGrouped).append(",").append(lastThree);
        }
        return (negative ? "-" : "") + grouped + "." + parts[1];
    }
}

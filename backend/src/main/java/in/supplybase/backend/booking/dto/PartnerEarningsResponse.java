package in.supplybase.backend.booking.dto;

import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;

import in.supplybase.backend.booking.Booking;
import in.supplybase.backend.booking.BookingStatus;

/**
 * A partner's earnings, worked out from their own jobs.
 *
 * <p>Earned means: the work is completed and the office has set a payout for it.
 * A completed job with no payout set yet is counted in {@code awaitingPayoutJobs}
 * rather than as zero, so the partner sees that an amount is still to be
 * confirmed instead of a misleading ₹0. Money is in paise.
 *
 * <p>"This month" is the calendar month, in India, in which the work was
 * completed.
 */
public record PartnerEarningsResponse(
        long earnedPaise, long paidPaise, long pendingPaise, long thisMonthPaise,
        int completedJobs, int completedThisMonth, int activeJobs, int awaitingPayoutJobs,
        List<Item> recent) {

    /** One completed job and what it pays. */
    public record Item(Long bookingId, String bookingNumber, String serviceLabel,
                       Instant completedAt, Long payoutPaise, Instant paidAt) {
    }

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Kolkata");
    private static final int RECENT_LIMIT = 50;

    public static PartnerEarningsResponse from(List<Booking> jobs, Instant now) {
        YearMonth thisMonth = YearMonth.from(now.atZone(BUSINESS_ZONE));

        List<Booking> completed = jobs.stream()
                .filter(b -> b.getStatus() == BookingStatus.WORK_COMPLETED)
                .toList();

        long earned = 0;
        long paid = 0;
        long monthEarned = 0;
        int completedThisMonth = 0;
        int awaitingPayout = 0;

        for (Booking b : completed) {
            boolean inThisMonth = b.getCompletedAt() != null
                    && YearMonth.from(b.getCompletedAt().atZone(BUSINESS_ZONE)).equals(thisMonth);
            if (inThisMonth) {
                completedThisMonth++;
            }

            Long payout = b.getPartnerPayoutPaise();
            if (payout == null) {
                awaitingPayout++;
                continue;
            }
            earned += payout;
            if (b.getPartnerPaidAt() != null) {
                paid += payout;
            }
            if (inThisMonth) {
                monthEarned += payout;
            }
        }

        int active = (int) jobs.stream().filter(b -> !b.getStatus().isFinal()).count();

        List<Item> recent = completed.stream()
                .sorted(Comparator.comparing(Booking::getCompletedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(RECENT_LIMIT)
                .map(b -> new Item(b.getId(), b.getBookingNumber(), b.getServiceLabel(),
                        b.getCompletedAt(), b.getPartnerPayoutPaise(), b.getPartnerPaidAt()))
                .toList();

        return new PartnerEarningsResponse(earned, paid, earned - paid, monthEarned,
                completed.size(), completedThisMonth, active, awaitingPayout, recent);
    }
}

package in.supplybase.backend.booking.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import in.supplybase.backend.booking.Booking;
import in.supplybase.backend.booking.BookingStatus;

/** The earnings maths, on its own — no Spring, no mocks. */
class PartnerEarningsResponseTest {

    // 15 October 2026, midday India time.
    private static final Instant NOW = Instant.parse("2026-10-15T06:30:00Z");

    private static Booking done(long id, String completedAt, Long payout, boolean paid) {
        Booking b = Booking.builder().id(id).bookingNumber("SB-" + id).serviceLabel("Plumber")
                .status(BookingStatus.WORK_COMPLETED)
                .completedAt(completedAt == null ? null : Instant.parse(completedAt))
                .partnerPayoutPaise(payout)
                .partnerPaidAt(paid ? Instant.parse("2026-10-10T00:00:00Z") : null)
                .build();
        return b;
    }

    @Test
    @DisplayName("a partner with no jobs has zero everywhere")
    void empty() {
        PartnerEarningsResponse r = PartnerEarningsResponse.from(List.of(), NOW);

        assertThat(r.earnedPaise()).isZero();
        assertThat(r.paidPaise()).isZero();
        assertThat(r.pendingPaise()).isZero();
        assertThat(r.thisMonthPaise()).isZero();
        assertThat(r.completedJobs()).isZero();
        assertThat(r.recent()).isEmpty();
    }

    @Test
    @DisplayName("earned = payouts on completed jobs; paid and pending split it")
    void earnedPaidPending() {
        PartnerEarningsResponse r = PartnerEarningsResponse.from(List.of(
                done(1, "2026-10-02T05:00:00Z", 150_000L, true),
                done(2, "2026-10-05T05:00:00Z", 80_000L, false),
                done(3, "2026-09-10T05:00:00Z", 200_000L, true)), NOW);

        assertThat(r.earnedPaise()).isEqualTo(430_000L);
        assertThat(r.paidPaise()).isEqualTo(350_000L);
        assertThat(r.pendingPaise()).isEqualTo(80_000L);
        assertThat(r.completedJobs()).isEqualTo(3);
    }

    @Test
    @DisplayName("a completed job with no payout set is 'awaiting', never counted as zero earned")
    void awaitingPayoutIsNotZero() {
        PartnerEarningsResponse r = PartnerEarningsResponse.from(List.of(
                done(1, "2026-10-02T05:00:00Z", null, false),
                done(2, "2026-10-03T05:00:00Z", 50_000L, false)), NOW);

        assertThat(r.awaitingPayoutJobs()).isEqualTo(1);
        assertThat(r.earnedPaise()).isEqualTo(50_000L);
        assertThat(r.completedJobs()).isEqualTo(2);
        // still listed, with a null amount, so the partner can see it is to be confirmed
        assertThat(r.recent()).extracting(PartnerEarningsResponse.Item::payoutPaise)
                .containsExactlyInAnyOrder(null, 50_000L);
    }

    @Test
    @DisplayName("'this month' is the Indian calendar month the work was completed in")
    void thisMonthUsesIndiaTime() {
        PartnerEarningsResponse r = PartnerEarningsResponse.from(List.of(
                // 30 Sep 19:00 UTC = 1 Oct 00:30 in India -> October
                done(1, "2026-09-30T19:00:00Z", 100_000L, false),
                // 31 Oct 19:00 UTC = 1 Nov 00:30 in India -> November, not this month
                done(2, "2026-10-31T19:00:00Z", 70_000L, false),
                // plainly last month
                done(3, "2026-09-12T05:00:00Z", 60_000L, false)), NOW);

        assertThat(r.thisMonthPaise()).isEqualTo(100_000L);
        assertThat(r.completedThisMonth()).isEqualTo(1);
        assertThat(r.earnedPaise()).isEqualTo(230_000L);
    }

    @Test
    @DisplayName("open jobs count as active; cancelled ones count as nothing")
    void activeAndCancelled() {
        Booking active = Booking.builder().id(4L).status(BookingStatus.WORK_IN_PROGRESS).build();
        Booking scheduled = Booking.builder().id(5L).status(BookingStatus.SITE_VISIT_SCHEDULED).build();
        Booking cancelled = Booking.builder().id(6L).status(BookingStatus.CANCELLED)
                .partnerPayoutPaise(90_000L).build();

        PartnerEarningsResponse r = PartnerEarningsResponse.from(List.of(active, scheduled, cancelled), NOW);

        assertThat(r.activeJobs()).isEqualTo(2);
        assertThat(r.completedJobs()).isZero();
        assertThat(r.earnedPaise()).isZero();
    }

    @Test
    @DisplayName("the recent list is newest completion first")
    void recentIsNewestFirst() {
        PartnerEarningsResponse r = PartnerEarningsResponse.from(List.of(
                done(1, "2026-10-02T05:00:00Z", 1L, false),
                done(2, "2026-10-09T05:00:00Z", 2L, false),
                done(3, "2026-10-05T05:00:00Z", 3L, false)), NOW);

        assertThat(r.recent()).extracting(PartnerEarningsResponse.Item::bookingId)
                .containsExactly(2L, 3L, 1L);
    }
}

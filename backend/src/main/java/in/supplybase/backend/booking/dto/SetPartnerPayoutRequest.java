package in.supplybase.backend.booking.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * The payout for one job, as the admin wants it to end up: the amount (null =
 * not decided) and whether it has been paid out. Sent whole rather than as
 * separate "set amount" / "mark paid" calls so the two can never disagree.
 * Money is in paise; the cap is a fat-finger guard (₹10,00,000), not a business limit.
 */
public record SetPartnerPayoutRequest(
        @PositiveOrZero(message = "The payout cannot be negative")
        @Max(value = 100_000_000L, message = "That payout is unusually large — check the amount")
        Long amountPaise,
        boolean paid) {
}

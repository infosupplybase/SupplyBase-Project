package in.supplybase.backend.booking.dto;

/**
 * The fields a customer is allowed to change on their own booking.
 * Used by PATCH /api/bookings/{id}.
 *
 * Deliberately limited to the fields a customer should be able to touch:
 * the preferred date, time slot, and location text. Status, pricing,
 * professional assignment, and admin notes are staff-only and live on
 * the admin endpoint (/api/admin/bookings/{id}).
 */
public record BookingUpdateRequest(
    String preferredDate,
    String preferredSlot,
    String location
) {}
package in.supplybase.backend.appointment.dto;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * remaining is deliberately not sent. "3 left" invites a race the customer
 * cannot win, and the honest answer is only known at the moment of booking.
 */
public record SlotResponse(LocalDate date, LocalTime time, String label, boolean available) {
}

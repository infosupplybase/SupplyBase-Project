package in.supplybase.backend.booking;

import java.time.LocalDate;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/**
 * Issues SB-2026-000001.
 *
 * AUTO_INCREMENT cannot do this because it never resets per year, so a counter
 * row is taken with SELECT ... FOR UPDATE. The lock covers one row for the
 * length of one UPDATE, so it only ever contends with another booking created
 * in the same instant.
 *
 * REQUIRES_NEW so the number is committed even if the booking around it rolls
 * back. A gap in the sequence is harmless; two bookings sharing a number is not.
 */
@Component
public class BookingNumbers {

    private static final String SEQUENCE = "booking";

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String next() {
        int year = LocalDate.now().getYear();

        entityManager.createNativeQuery(
                        "INSERT IGNORE INTO number_sequences (name, year, next_value) VALUES (?, ?, 1)")
                .setParameter(1, SEQUENCE)
                .setParameter(2, year)
                .executeUpdate();

        Number current = (Number) entityManager.createNativeQuery(
                        "SELECT next_value FROM number_sequences WHERE name = ? AND year = ? FOR UPDATE")
                .setParameter(1, SEQUENCE)
                .setParameter(2, year)
                .getSingleResult();

        entityManager.createNativeQuery(
                        "UPDATE number_sequences SET next_value = next_value + 1 WHERE name = ? AND year = ?")
                .setParameter(1, SEQUENCE)
                .setParameter(2, year)
                .executeUpdate();

        // SB-20260826-000001 — the date makes a number readable over the
        // phone ("the twenty-sixth one") and keeps the counter per year.
        return String.format("SB-%s-%06d",
                LocalDate.now().format(java.time.format.DateTimeFormatter.BASIC_ISO_DATE),
                current.longValue());
    }
}

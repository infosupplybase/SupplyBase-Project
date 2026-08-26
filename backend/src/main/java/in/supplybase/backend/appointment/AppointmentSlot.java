package in.supplybase.backend.appointment;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

/**
 * A bookable window on a real date.
 *
 * Rows are created on demand — the first booking into 2 PM on 30 August
 * creates that row. Materialising a year of empty slots up front would be
 * hundreds of thousands of rows that mostly say "nobody booked me".
 */
@Entity
@Table(name = "appointment_slots")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "slot_date", nullable = false)
    private LocalDate slotDate;

    @Column(name = "slot_time", nullable = false)
    private LocalTime slotTime;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(nullable = false)
    private int capacity;

    @Column(name = "booked_count", nullable = false)
    @Builder.Default
    private int bookedCount = 0;

    /**
     * The other half of the double-booking guard.
     *
     * Two customers paying at the same instant both read bookedCount and both
     * write bookedCount + 1. @Version makes the second write fail loudly
     * instead of quietly overwriting the first, and the database CHECK
     * (booked_count <= capacity) is the backstop if anything reaches it by
     * another path.
     */
    @Version
    @Column(nullable = false)
    @Builder.Default
    private long version = 0L;

    @Generated(event = EventType.INSERT)
    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    public boolean hasRoom() {
        return bookedCount < capacity;
    }
}

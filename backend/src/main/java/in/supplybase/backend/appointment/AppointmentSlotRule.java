package in.supplybase.backend.appointment;

import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** "Mondays, 10:00 to 19:00, hourly, two visits per slot." Admin-editable. */
@Entity
@Table(name = "appointment_slot_rules")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentSlotRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Null means the rule covers every service. */
    @Column(name = "category_id")
    private Long categoryId;

    /**
     * 1 = Monday .. 7 = Sunday, matching java.time.DayOfWeek.
     *
     * columnDefinition because TINYINT is the honest storage for a value that
     * can only be 1-7, and without it Hibernate validates the column against
     * INTEGER and refuses to start.
     */
    @Column(name = "day_of_week", nullable = false, columnDefinition = "TINYINT")
    private int dayOfWeek;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "slot_minutes", nullable = false)
    @Builder.Default
    private int slotMinutes = 60;

    @Column(name = "max_bookings", nullable = false)
    @Builder.Default
    private int maxBookings = 2;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}

package in.supplybase.backend.booking;

import java.time.Instant;
import java.time.LocalDate;

import in.supplybase.backend.appointment.AppointmentSlot;
import in.supplybase.backend.auth.User;
import in.supplybase.backend.catalogue.ServiceCategory;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

/**
 * A request for a site visit.
 *
 * Not an appointment: the slot is what the customer would prefer, and the team
 * confirms the real time by phone or WhatsApp.
 */
@Entity
@Table(name = "bookings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String reference;

    /** SB-2026-000001 — what the customer reads out on the phone. */
    @Column(name = "booking_number", unique = true, length = 20)
    private String bookingNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private ServiceCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "booking_type", nullable = false, length = 20)
    private BookingType bookingType;

    /** Set only when the person was signed in; most bookings are from visitors. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "service_slug", nullable = false, length = 60)
    private String serviceSlug;

    /**
     * The label as the customer saw it, stored alongside the slug on purpose.
     * Renaming a service later must not silently rewrite what someone booked.
     */
    @Column(name = "service_label", nullable = false, length = 80)
    private String serviceLabel;

    @Column(name = "property_type", length = 40)
    private String propertyType;

    @Column(name = "area_sqft")
    private Integer areaSqft;

    @Column(name = "work_nature", length = 30)
    private String workNature;

    @Column(name = "work_option", length = 80)
    private String workOption;

    @Column(name = "work_detail", columnDefinition = "TEXT")
    private String workDetail;

    @Enumerated(EnumType.STRING)
    @Column(name = "material_supplier", length = 20)
    private MaterialSupplier materialSupplier;

    @Column(name = "budget_range", length = 60)
    private String budgetRange;

    @Column(name = "preferred_date")
    private LocalDate preferredDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_slot", length = 20)
    private TimeSlot preferredSlot;

    /** The seat actually taken. Null on the legacy two-lane bookings. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_slot_id")
    private AppointmentSlot appointmentSlot;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 20)
    private String whatsapp;

    @Column(length = 190)
    private String email;

    @Column(length = 400)
    private String address;

    @Column(length = 80)
    private String city;

    @Column(length = 10)
    private String pincode;

    @Column(length = 160)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BookingStatus status = BookingStatus.PAYMENT_PENDING;

    @Column(name = "visit_fee_paise", nullable = false)
    @Builder.Default
    private long visitFeePaise = 2500L;

    @Column(name = "paid_at")
    private java.time.Instant paidAt;

    @Column(name = "cancelled_reason", length = 300)
    private String cancelledReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_professional_id")
    private in.supplybase.backend.auth.User assignedProfessional;

    /**
     * Guards the status transition. Two admins moving one booking at once, or
     * a webhook landing while someone edits, must not both win.
     */
    @jakarta.persistence.Version
    @Column(nullable = false)
    @Builder.Default
    private long version = 0L;

    @Column(name = "attachments_pending", nullable = false)
    @Builder.Default
    private boolean attachmentsPending = false;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Generated(event = EventType.INSERT)
    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    @Generated(event = { EventType.INSERT, EventType.UPDATE })
    @Column(name = "updated_at", insertable = false, updatable = false)
    private Instant updatedAt;
}

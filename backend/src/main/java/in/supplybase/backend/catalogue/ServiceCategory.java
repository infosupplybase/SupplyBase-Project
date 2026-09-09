package in.supplybase.backend.catalogue;

import java.time.Instant;

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
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

/** One of the four customer-facing services. */
@Entity
@Table(name = "service_categories")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String slug;

    /**
     * NULL for one of the seven main categories. Set to another category's
     * slug for a sub-service that has its own detailed booking flow (today,
     * the seven electrician journeys, parented under "electrical") — it
     * stays fully bookable at its own slug but is left out of the main
     * catalogue listing.
     */
    @Column(name = "parent_slug", length = 60)
    private String parentSlug;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(length = 160)
    private String tagline;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 40)
    private String icon;

    @Column(name = "hero_image", length = 300)
    private String heroImage;

    /** Paise, so it matches Razorpay and the payments table. 2500 = ₹25. */
    @Column(name = "visit_fee_paise", nullable = false)
    @Builder.Default
    private long visitFeePaise = 2500L;

    /**
     * The rough, disclosed-as-an-estimate job cost range shown on the booking
     * summary — base labour + materials before any add-on is chosen. Null for
     * categories that don't quote one (a site-visit-first service like the
     * original four), which is every category this column did not exist for
     * until it was added.
     */
    @Column(name = "estimate_min_paise")
    private Long estimateMinPaise;

    @Column(name = "estimate_max_paise")
    private Long estimateMaxPaise;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Generated(event = EventType.INSERT)
    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    @Generated(event = { EventType.INSERT, EventType.UPDATE })
    @Column(name = "updated_at", insertable = false, updatable = false)
    private Instant updatedAt;
}

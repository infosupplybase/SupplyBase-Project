package in.supplybase.backend.partner;

import java.time.Instant;

import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import in.supplybase.backend.auth.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * The professional-only details of a user: what they do, where, and whether
 * SupplyBase has approved them. One row per applicant, created when they
 * apply. See V21__partner_profiles.sql.
 */
@Entity
@Table(name = "partner_profiles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartnerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /** A main-category slug from the service catalogue, e.g. "electrical". */
    @Column(name = "primary_trade", length = 60)
    private String primaryTrade;

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(length = 100)
    private String city;

    /** Free text: the localities they will travel to. */
    @Column(name = "service_areas", length = 300)
    private String serviceAreas;

    @Column(length = 120)
    private String languages;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PartnerStatus status = PartnerStatus.PENDING;

    /** The reason for a rejection or suspension. Shown to the partner. */
    @Column(name = "review_note", length = 500)
    private String reviewNote;

    /** Deliberately a bare id, not a User: nothing here needs the reviewer loaded. */
    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Generated(event = EventType.INSERT)
    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    @Generated(event = { EventType.INSERT, EventType.UPDATE })
    @Column(name = "updated_at", insertable = false, updatable = false)
    private Instant updatedAt;
}

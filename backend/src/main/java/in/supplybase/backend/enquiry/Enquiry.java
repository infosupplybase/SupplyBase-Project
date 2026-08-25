package in.supplybase.backend.enquiry;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "enquiries")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Enquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String reference;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 190)
    private String email;

    @Column(name = "project_type", length = 60)
    private String projectType;

    @Column(name = "service_slug", length = 60)
    private String serviceSlug;

    @Column(length = 160)
    private String location;

    @Column(name = "budget_range", length = 60)
    private String budgetRange;

    @Lob
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EnquirySource source = EnquirySource.QUOTE_FORM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EnquiryStatus status = EnquiryStatus.NEW;

    @Lob
    @Column(name = "admin_notes")
    private String adminNotes;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private Instant updatedAt;
}

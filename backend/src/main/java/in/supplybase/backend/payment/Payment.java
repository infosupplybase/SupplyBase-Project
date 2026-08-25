package in.supplybase.backend.payment;

import java.time.Instant;
import java.time.LocalDate;

import in.supplybase.backend.auth.User;
import in.supplybase.backend.project.Project;
import in.supplybase.backend.project.ProjectStage;
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
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One payable amount: an advance, a milestone, or an invoice.
 *
 * amountPaise is the minor unit, matching both the column and Razorpay's API,
 * so no rounding ever happens between here and the gateway.
 */
@Entity
@Table(name = "payments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 24)
    private String reference;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stage_id")
    private ProjectStage stage;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type", nullable = false, length = 20)
    private PaymentType paymentType;

    @Column(nullable = false)
    private String description;

    @Column(name = "amount_paise", nullable = false)
    private long amountPaise;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "INR";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "razorpay_order_id", length = 64)
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id", length = 64)
    private String razorpayPaymentId;

    @Column(name = "razorpay_signature")
    private String razorpaySignature;

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private Instant updatedAt;

    /**
     * Optimistic locking. The browser callback and Razorpay's webhook race to
     * mark the same payment paid; without this, both can read PENDING and both
     * write PAID. The loser gets an exception instead of a silent double-apply.
     */
    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private long version = 0L;

    public boolean isSettled() {
        return status == PaymentStatus.PAID || status == PaymentStatus.REFUNDED;
    }
}

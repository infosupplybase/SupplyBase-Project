package in.supplybase.backend.payment;

import java.time.Instant;

import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

/**
 * An audit row for every webhook received, written before it is acted on.
 *
 * When a client says "I paid and it does not show", this table is the answer:
 * it records what Razorpay sent, whether the signature checked out, and what
 * happened when we processed it.
 */
@Entity
@Table(name = "payment_events")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "razorpay_event_id", unique = true, length = 64)
    private String razorpayEventId;

    @Column(name = "event_type", nullable = false, length = 60)
    private String eventType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id")
    private Payment payment;

    @Column(name = "signature_valid", nullable = false)
    private boolean signatureValid;

    // LONGTEXT rather than MySQL's JSON type. A JSON column validates on
    // insert, so a malformed webhook body would be rejected — losing exactly
    // the audit row worth keeping. An audit log has to accept what it is given.
    @Column(columnDefinition = "LONGTEXT")
    private String payload;

    @Column(nullable = false)
    @Builder.Default
    private boolean processed = false;

    @Column(name = "process_error", length = 500)
    private String processError;

    @Generated(event = EventType.INSERT)
    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;
}

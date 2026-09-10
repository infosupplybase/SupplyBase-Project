package in.supplybase.backend.booking;

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

/**
 * One answer to one booking question.
 *
 * The question TEXT is copied in beside the key. Questions are editable data,
 * and a booking has to keep saying what was actually asked six months ago even
 * if the wording has changed since.
 */
@Entity
@Table(name = "booking_answers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Column(name = "question_key", nullable = false, length = 60)
    private String questionKey;

    @Column(name = "question_text", length = 200)
    private String questionText;

    @Column(name = "answer_value", nullable = false, length = 400)
    private String answerValue;

    @Column(name = "answer_label", length = 300)
    private String answerLabel;

    /**
     * Cart line-item fields — populated only for a 'cart_item' /
     * 'consultation_type' answer whose matched {@link in.supplybase.backend.catalogue.ServiceOption}
     * carries a price. `unitPricePaise` and `lineTotalPaise` are copied from
     * the catalogue at booking time (never trusted from the request), the
     * same way `questionText` already is — see BookingService.storeAnswers.
     * NULL for a plain form answer with no price.
     */
    @Column(nullable = false)
    @Builder.Default
    private int quantity = 1;

    @Column(name = "unit_price_paise")
    private Long unitPricePaise;

    @Column(name = "line_total_paise")
    private Long lineTotalPaise;
}

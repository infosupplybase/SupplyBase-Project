package in.supplybase.backend.catalogue;

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
 * One answer option on one booking question.
 *
 * Rows sharing a questionKey are one question; the question's text and input
 * type are repeated on each row so a single query can build a whole form
 * without a second table to join.
 */
@Entity
@Table(name = "service_options")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(name = "step_no", nullable = false)
    private int stepNo;

    @Column(name = "question_key", nullable = false, length = 60)
    private String questionKey;

    @Column(name = "question_text", nullable = false, length = 200)
    private String questionText;

    /** SINGLE | MULTI | TEXT | NUMBER | FILE */
    @Column(name = "input_type", nullable = false, length = 20)
    private String inputType;

    @Column(nullable = false)
    @Builder.Default
    private boolean required = false;

    @Column(name = "option_value", length = 80)
    private String optionValue;

    @Column(name = "option_label", length = 160)
    private String optionLabel;

    /** The plain-English explanation under an option, e.g. what a putty coat does. */
    @Column(name = "option_hint", length = 300)
    private String optionHint;

    /** Groups options inside one question — "Painting" vs "Waterproofing". */
    @Column(name = "option_group", length = 60)
    private String optionGroup;

    /** Paise. Null for options with no add-on cost of their own (most of them). */
    @Column(name = "price_paise")
    private Long pricePaise;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}

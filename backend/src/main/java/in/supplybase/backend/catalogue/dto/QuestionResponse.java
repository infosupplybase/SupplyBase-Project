package in.supplybase.backend.catalogue.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * One question, ready to render. The frontend walks these in order and draws
 * the right control for inputType — it holds no copy of the question list.
 */
public record QuestionResponse(
        int stepNo, String key, String text, String inputType, boolean required,
        List<OptionResponse> options) {

    /** `price` is null for the vast majority of options — only an add-on
        question's choices carry one. */
    public record OptionResponse(String value, String label, String hint, String group, BigDecimal price) {
    }
}

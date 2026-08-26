package in.supplybase.backend.catalogue.dto;

import java.util.List;

/**
 * One question, ready to render. The frontend walks these in order and draws
 * the right control for inputType — it holds no copy of the question list.
 */
public record QuestionResponse(
        int stepNo, String key, String text, String inputType, boolean required,
        List<OptionResponse> options) {

    public record OptionResponse(String value, String label, String hint, String group) {
    }
}

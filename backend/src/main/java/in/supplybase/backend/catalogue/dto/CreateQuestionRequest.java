package in.supplybase.backend.catalogue.dto;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * What an admin submits to add or replace one question on a service's
 * booking form. A "question" here is one or more {@code ServiceOption} rows
 * sharing a questionKey — one row per option for SINGLE/MULTI, or a single
 * row with no option fields for TEXT/NUMBER/FILE.
 */
public record CreateQuestionRequest(
        int stepNo,

        @NotBlank(message = "A question key is required")
        @Size(max = 60) String questionKey,

        @NotBlank(message = "Question text is required")
        @Size(max = 200) String questionText,

        @NotBlank(message = "An input type is required")
        @Pattern(regexp = "^(SINGLE|MULTI|TEXT|NUMBER|FILE)$",
                message = "inputType must be one of SINGLE, MULTI, TEXT, NUMBER, FILE")
        String inputType,

        boolean required,

        List<OptionInput> options) {

    /** {@code price}, in rupees, is optional — only add-on options price themselves. */
    public record OptionInput(String value, String label, String hint, String group, BigDecimal price) {
    }
}

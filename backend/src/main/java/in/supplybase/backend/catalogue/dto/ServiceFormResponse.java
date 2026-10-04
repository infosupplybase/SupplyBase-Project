package in.supplybase.backend.catalogue.dto;

import java.util.List;

/** The catalogue and its contextual painting package prices. */
public record ServiceFormResponse(
        CategoryResponse category,
        List<QuestionResponse> questions,
        List<PaintingPriceResponse> productPrices) {

    public ServiceFormResponse(
            CategoryResponse category,
            List<QuestionResponse> questions) {
        this(category, questions, List.of());
    }
}
package in.supplybase.backend.catalogue.dto;

import java.util.List;

/** Everything needed to draw one service's booking form. */
public record ServiceFormResponse(CategoryResponse category, List<QuestionResponse> questions) {
}

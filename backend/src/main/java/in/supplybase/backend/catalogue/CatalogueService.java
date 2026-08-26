package in.supplybase.backend.catalogue;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import in.supplybase.backend.catalogue.dto.CategoryResponse;
import in.supplybase.backend.catalogue.dto.QuestionResponse;
import in.supplybase.backend.catalogue.dto.ServiceFormResponse;
import in.supplybase.backend.common.ApiException;

@Service
public class CatalogueService {

    private final ServiceCategoryRepository categories;
    private final ServiceOptionRepository options;

    public CatalogueService(ServiceCategoryRepository categories,
                            ServiceOptionRepository options) {
        this.categories = categories;
        this.options = options;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> listCategories() {
        return categories.findByActiveTrueOrderBySortOrderAsc().stream()
                .map(CategoryResponse::from)
                .toList();
    }

    /**
     * Short and historical names that people type or bookmark.
     *
     * "painting" is the obvious guess for a service actually called
     * painting-waterproofing, and a 404 for a guess that close is a bad
     * answer when we know exactly what they meant.
     */
    private static final Map<String, String> SLUG_ALIASES = Map.of(
            "painting", "painting-waterproofing",
            "waterproofing", "painting-waterproofing",
            "paint", "painting-waterproofing",
            "electrical", "electrician",
            "electric", "electrician",
            "interior", "interior-work",
            "interior-design", "interior-work",
            "interiors", "interior-work",
            "plumber", "plumbing");

    @Transactional(readOnly = true)
    public ServiceCategory requireCategory(String slug) {
        String key = slug == null ? "" : slug.trim().toLowerCase();
        return categories.findBySlugAndActiveTrue(key)
                .or(() -> Optional.ofNullable(SLUG_ALIASES.get(key))
                        .flatMap(categories::findBySlugAndActiveTrue))
                .orElseThrow(() -> ApiException.notFound("That service"));
    }

    /**
     * Builds one service's form from its option rows.
     *
     * The rows arrive flat, already ordered by step then sort order; this
     * folds them into questions. A LinkedHashMap keeps that order, so the
     * form's shape is decided by the data, not by this code.
     */
    @Transactional(readOnly = true)
    public ServiceFormResponse form(String slug) {
        ServiceCategory category = requireCategory(slug);

        Map<String, QuestionBuilder> byKey = new LinkedHashMap<>();
        for (ServiceOption row : options
                .findByCategoryIdAndActiveTrueOrderByStepNoAscSortOrderAsc(category.getId())) {
            QuestionBuilder builder = byKey.computeIfAbsent(
                    row.getStepNo() + ":" + row.getQuestionKey(),
                    key -> new QuestionBuilder(row));
            if (row.getOptionValue() != null) {
                builder.options.add(new QuestionResponse.OptionResponse(
                        row.getOptionValue(), row.getOptionLabel(),
                        row.getOptionHint(), row.getOptionGroup()));
            }
        }

        List<QuestionResponse> questions = byKey.values().stream()
                .map(QuestionBuilder::build)
                .toList();

        return new ServiceFormResponse(CategoryResponse.from(category), questions);
    }

    private static final class QuestionBuilder {
        private final ServiceOption first;
        private final List<QuestionResponse.OptionResponse> options = new ArrayList<>();

        private QuestionBuilder(ServiceOption first) {
            this.first = first;
        }

        private QuestionResponse build() {
            return new QuestionResponse(first.getStepNo(), first.getQuestionKey(),
                    first.getQuestionText(), first.getInputType(), first.isRequired(),
                    List.copyOf(options));
        }
    }
}

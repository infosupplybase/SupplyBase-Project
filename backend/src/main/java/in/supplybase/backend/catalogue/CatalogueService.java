package in.supplybase.backend.catalogue;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import in.supplybase.backend.catalogue.dto.CategoryResponse;
import in.supplybase.backend.catalogue.dto.CreateCategoryRequest;
import in.supplybase.backend.catalogue.dto.CreateQuestionRequest;
import in.supplybase.backend.catalogue.dto.QuestionResponse;
import in.supplybase.backend.catalogue.dto.ServiceFormResponse;
import in.supplybase.backend.catalogue.dto.UpdateCategoryRequest;
import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.Money;

@Service
public class CatalogueService {

    private static final BigDecimal DEFAULT_VISIT_FEE = new BigDecimal("25.00");

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

    /* ----------------------------------------------------------- staff */

    /** Every category, active or not — the admin screen manages both. */
    @Transactional(readOnly = true)
    public List<CategoryResponse> listAllCategories() {
        return categories.findAllByOrderBySortOrderAsc().stream()
                .map(CategoryResponse::from)
                .toList();
    }

    /** Looks a category up by slug regardless of active status, for admin edits. */
    @Transactional(readOnly = true)
    public ServiceCategory requireAnyCategory(String slug) {
        String key = slug == null ? "" : slug.trim().toLowerCase();
        return categories.findBySlug(key)
                .orElseThrow(() -> ApiException.notFound("That service"));
    }

    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        String slug = request.slug().trim().toLowerCase();
        if (categories.existsBySlug(slug)) {
            throw ApiException.conflict("A service with that slug already exists.");
        }

        BigDecimal visitFee = request.visitFee() == null ? DEFAULT_VISIT_FEE : request.visitFee();
        ServiceCategory category = ServiceCategory.builder()
                .slug(slug)
                .name(request.name().trim())
                .tagline(request.tagline())
                .description(request.description())
                .icon(request.icon())
                .heroImage(request.heroImage())
                .visitFeePaise(Money.rupeesToPaise(visitFee))
                .sortOrder(request.sortOrder())
                .active(true)
                .build();

        return CategoryResponse.from(categories.save(category));
    }

    /** The slug is the path identifier and is never changed here. */
    @Transactional
    public CategoryResponse updateCategory(String slug, UpdateCategoryRequest request) {
        ServiceCategory category = requireAnyCategory(slug);

        BigDecimal visitFee = request.visitFee() == null ? DEFAULT_VISIT_FEE : request.visitFee();
        category.setName(request.name().trim());
        category.setTagline(request.tagline());
        category.setDescription(request.description());
        category.setIcon(request.icon());
        category.setHeroImage(request.heroImage());
        category.setVisitFeePaise(Money.rupeesToPaise(visitFee));
        category.setSortOrder(request.sortOrder());

        return CategoryResponse.from(categories.save(category));
    }

    /**
     * Soft delete: {@code active} goes false, the row stays.
     *
     * Bookings and enquiries reference a category by slug/FK, and
     * {@code service_options} cascades on delete from {@code service_categories},
     * so a hard delete here would corrupt history and silently wipe every
     * question this category ever asked.
     */
    @Transactional
    public void deactivateCategory(String slug) {
        ServiceCategory category = requireAnyCategory(slug);
        category.setActive(false);
        categories.save(category);
    }

    /**
     * Creates one question, one {@code ServiceOption} row per option — or a
     * single row with no option fields for a TEXT/NUMBER/FILE question, the
     * same shape {@link #form} already knows how to read.
     */
    @Transactional
    public QuestionResponse createQuestion(String slug, CreateQuestionRequest request) {
        ServiceCategory category = requireAnyCategory(slug);
        List<ServiceOption> rows = buildOptionRows(category.getId(), request);
        options.saveAll(rows);
        return toQuestionResponse(rows);
    }

    /**
     * Replaces every row for {@code questionKey}: the existing rows are
     * deleted and fresh ones inserted from the request body. Simplest correct
     * approach for "a question is really N rows" — trying to diff and patch
     * individual option rows in place would need to match old options to new
     * ones by value, which the request has no stable id to do reliably.
     */
    @Transactional
    public QuestionResponse updateQuestion(String slug, String questionKey, CreateQuestionRequest request) {
        ServiceCategory category = requireAnyCategory(slug);
        List<ServiceOption> existing = options.findByCategoryIdAndQuestionKey(category.getId(), questionKey);
        if (existing.isEmpty()) {
            throw ApiException.notFound("That question");
        }
        options.deleteByCategoryIdAndQuestionKey(category.getId(), questionKey);

        List<ServiceOption> rows = buildOptionRows(category.getId(), request);
        options.saveAll(rows);
        return toQuestionResponse(rows);
    }

    /**
     * Soft delete: {@code active} goes false on every row sharing this key.
     *
     * A booking's stored answers copy the question text and key at booking
     * time (see {@code BookingService.storeAnswers}), so nothing downstream
     * breaks either way — soft delete is kept only for consistency with the
     * category delete, and so it can be undone.
     */
    @Transactional
    public void deactivateQuestion(String slug, String questionKey) {
        ServiceCategory category = requireAnyCategory(slug);
        List<ServiceOption> rows = options.findByCategoryIdAndQuestionKey(category.getId(), questionKey);
        if (rows.isEmpty()) {
            throw ApiException.notFound("That question");
        }
        rows.forEach(row -> row.setActive(false));
        options.saveAll(rows);
    }

    private List<ServiceOption> buildOptionRows(Long categoryId, CreateQuestionRequest request) {
        List<CreateQuestionRequest.OptionInput> optionInputs = request.options();
        if (optionInputs == null || optionInputs.isEmpty()) {
            return List.of(ServiceOption.builder()
                    .categoryId(categoryId)
                    .stepNo(request.stepNo())
                    .questionKey(request.questionKey())
                    .questionText(request.questionText())
                    .inputType(request.inputType())
                    .required(request.required())
                    .sortOrder(0)
                    .active(true)
                    .build());
        }

        List<ServiceOption> rows = new ArrayList<>();
        int sortOrder = 1;
        for (CreateQuestionRequest.OptionInput option : optionInputs) {
            rows.add(ServiceOption.builder()
                    .categoryId(categoryId)
                    .stepNo(request.stepNo())
                    .questionKey(request.questionKey())
                    .questionText(request.questionText())
                    .inputType(request.inputType())
                    .required(request.required())
                    .optionValue(option.value())
                    .optionLabel(option.label())
                    .optionHint(option.hint())
                    .optionGroup(option.group())
                    .sortOrder(sortOrder++)
                    .active(true)
                    .build());
        }
        return rows;
    }

    private QuestionResponse toQuestionResponse(List<ServiceOption> rows) {
        ServiceOption first = rows.get(0);
        List<QuestionResponse.OptionResponse> optionResponses = rows.stream()
                .filter(row -> row.getOptionValue() != null)
                .map(row -> new QuestionResponse.OptionResponse(
                        row.getOptionValue(), row.getOptionLabel(), row.getOptionHint(), row.getOptionGroup()))
                .toList();
        return new QuestionResponse(first.getStepNo(), first.getQuestionKey(), first.getQuestionText(),
                first.getInputType(), first.isRequired(), optionResponses);
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

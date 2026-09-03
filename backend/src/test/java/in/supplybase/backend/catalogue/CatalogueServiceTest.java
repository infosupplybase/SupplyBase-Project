package in.supplybase.backend.catalogue;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;

import in.supplybase.backend.catalogue.dto.CategoryResponse;
import in.supplybase.backend.catalogue.dto.CreateCategoryRequest;
import in.supplybase.backend.catalogue.dto.CreateQuestionRequest;
import in.supplybase.backend.catalogue.dto.QuestionResponse;
import in.supplybase.backend.catalogue.dto.ServiceFormResponse;
import in.supplybase.backend.catalogue.dto.UpdateCategoryRequest;
import in.supplybase.backend.common.ApiException;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CatalogueServiceTest {

    @Mock
    private ServiceCategoryRepository categories;
    @Mock
    private ServiceOptionRepository options;

    private CatalogueService service;

    @BeforeEach
    void setUp() {
        service = new CatalogueService(categories, options);
        when(categories.save(any(ServiceCategory.class))).thenAnswer(inv -> inv.getArgument(0));
        when(options.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
    }

    private ServiceCategory category(long id, String slug, boolean active) {
        return ServiceCategory.builder()
                .id(id).slug(slug).name("Painting & Waterproofing")
                .visitFeePaise(2500L).sortOrder(0).active(active)
                .build();
    }

    @Test
    @DisplayName("listCategories returns only active categories, in sort order")
    void listCategoriesReturnsActiveOnly() {
        when(categories.findByActiveTrueOrderBySortOrderAsc())
                .thenReturn(List.of(category(1L, "painting-waterproofing", true)));

        List<CategoryResponse> result = service.listCategories();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).slug()).isEqualTo("painting-waterproofing");
    }

    @Nested
    @DisplayName("requireCategory")
    class RequireCategory {

        @Test
        @DisplayName("finds a category by its exact slug")
        void found() {
            when(categories.findBySlugAndActiveTrue("plumbing"))
                    .thenReturn(Optional.of(category(1L, "plumbing", true)));

            ServiceCategory result = service.requireCategory("plumbing");

            assertThat(result.getSlug()).isEqualTo("plumbing");
        }

        @Test
        @DisplayName("resolves a known alias to its real slug")
        void aliasResolution() {
            when(categories.findBySlugAndActiveTrue("painting")).thenReturn(Optional.empty());
            when(categories.findBySlugAndActiveTrue("painting-waterproofing"))
                    .thenReturn(Optional.of(category(1L, "painting-waterproofing", true)));

            ServiceCategory result = service.requireCategory("painting");

            assertThat(result.getSlug()).isEqualTo("painting-waterproofing");
        }

        @Test
        @DisplayName("404s for a slug that is neither real nor an alias")
        void notFound() {
            when(categories.findBySlugAndActiveTrue("nonsense")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.requireCategory("nonsense"))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.NOT_FOUND);
        }
    }

    @Test
    @DisplayName("form groups flat option rows into questions, preserving order")
    void formBuildsQuestionsFromFlatRows() {
        ServiceCategory category = category(1L, "plumbing", true);
        when(categories.findBySlugAndActiveTrue("plumbing")).thenReturn(Optional.of(category));

        ServiceOption q1Option1 = ServiceOption.builder()
                .id(1L).categoryId(1L).stepNo(1).questionKey("issue").questionText("What is the issue?")
                .inputType("SINGLE").required(true)
                .optionValue("leak").optionLabel("Leak").sortOrder(1).active(true).build();
        ServiceOption q1Option2 = ServiceOption.builder()
                .id(2L).categoryId(1L).stepNo(1).questionKey("issue").questionText("What is the issue?")
                .inputType("SINGLE").required(true)
                .optionValue("blockage").optionLabel("Blockage").sortOrder(2).active(true).build();
        ServiceOption q2 = ServiceOption.builder()
                .id(3L).categoryId(1L).stepNo(2).questionKey("notes").questionText("Anything else?")
                .inputType("TEXT").required(false).sortOrder(0).active(true).build();

        when(options.findByCategoryIdAndActiveTrueOrderByStepNoAscSortOrderAsc(1L))
                .thenReturn(List.of(q1Option1, q1Option2, q2));

        ServiceFormResponse form = service.form("plumbing");

        assertThat(form.category().slug()).isEqualTo("plumbing");
        assertThat(form.questions()).hasSize(2);

        QuestionResponse issueQuestion = form.questions().get(0);
        assertThat(issueQuestion.key()).isEqualTo("issue");
        assertThat(issueQuestion.options()).extracting(QuestionResponse.OptionResponse::value)
                .containsExactly("leak", "blockage");

        QuestionResponse notesQuestion = form.questions().get(1);
        assertThat(notesQuestion.key()).isEqualTo("notes");
        assertThat(notesQuestion.options()).isEmpty();
    }

    @Nested
    @DisplayName("createCategory")
    class CreateCategory {

        private CreateCategoryRequest request() {
            return new CreateCategoryRequest("electrician", "Electrician", "Tagline", "Description",
                    "bolt", "hero.png", new BigDecimal("30.00"), 1);
        }

        @Test
        @DisplayName("creates a new, active category")
        void success() {
            when(categories.existsBySlug("electrician")).thenReturn(false);

            CategoryResponse response = service.createCategory(request());

            assertThat(response.slug()).isEqualTo("electrician");
            ArgumentCaptor<ServiceCategory> captor = ArgumentCaptor.forClass(ServiceCategory.class);
            verify(categories).save(captor.capture());
            assertThat(captor.getValue().isActive()).isTrue();
            assertThat(captor.getValue().getVisitFeePaise()).isEqualTo(3000L);
        }

        @Test
        @DisplayName("refuses a slug that is already taken")
        void duplicateSlugConflict() {
            when(categories.existsBySlug("electrician")).thenReturn(true);

            assertThatThrownBy(() -> service.createCategory(request()))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.CONFLICT);
            verify(categories, never()).save(any());
        }
    }

    @Nested
    @DisplayName("updateCategory")
    class UpdateCategory {

        private UpdateCategoryRequest request() {
            return new UpdateCategoryRequest("New Name", "New tagline", "New description",
                    "icon", "hero2.png", new BigDecimal("40.00"), 2);
        }

        @Test
        @DisplayName("updates every editable field, leaving the slug untouched")
        void success() {
            ServiceCategory existing = category(1L, "plumbing", true);
            when(categories.findBySlug("plumbing")).thenReturn(Optional.of(existing));

            CategoryResponse response = service.updateCategory("plumbing", request());

            assertThat(response.name()).isEqualTo("New Name");
            assertThat(existing.getSlug()).isEqualTo("plumbing");
            assertThat(existing.getVisitFeePaise()).isEqualTo(4000L);
        }

        @Test
        @DisplayName("404s for an unknown slug")
        void notFound() {
            when(categories.findBySlug("ghost")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.updateCategory("ghost", request()))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.NOT_FOUND);
        }
    }

    @Nested
    @DisplayName("deactivateCategory")
    class DeactivateCategory {

        @Test
        @DisplayName("flips active to false without deleting the row")
        void success() {
            ServiceCategory existing = category(1L, "plumbing", true);
            when(categories.findBySlug("plumbing")).thenReturn(Optional.of(existing));

            service.deactivateCategory("plumbing");

            assertThat(existing.isActive()).isFalse();
            verify(categories).save(existing);
        }

        @Test
        @DisplayName("404s for an unknown slug")
        void notFound() {
            when(categories.findBySlug("ghost")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.deactivateCategory("ghost"))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.NOT_FOUND);
        }
    }

    @Nested
    @DisplayName("createQuestion")
    class CreateQuestion {

        @Test
        @DisplayName("writes one row per option")
        void withOptions() {
            when(categories.findBySlug("plumbing")).thenReturn(Optional.of(category(1L, "plumbing", true)));
            CreateQuestionRequest request = new CreateQuestionRequest(1, "issue", "What is the issue?",
                    "SINGLE", true, List.of(
                            new CreateQuestionRequest.OptionInput("leak", "Leak", null, null),
                            new CreateQuestionRequest.OptionInput("blockage", "Blockage", null, null)));

            QuestionResponse response = service.createQuestion("plumbing", request);

            assertThat(response.options()).hasSize(2);
            ArgumentCaptor<List<ServiceOption>> captor = ArgumentCaptor.forClass(List.class);
            verify(options).saveAll(captor.capture());
            assertThat(captor.getValue()).hasSize(2);
        }

        @Test
        @DisplayName("writes a single row for a question with no options")
        void withoutOptions() {
            when(categories.findBySlug("plumbing")).thenReturn(Optional.of(category(1L, "plumbing", true)));
            CreateQuestionRequest request = new CreateQuestionRequest(2, "notes", "Anything else?",
                    "TEXT", false, List.of());

            QuestionResponse response = service.createQuestion("plumbing", request);

            assertThat(response.options()).isEmpty();
            ArgumentCaptor<List<ServiceOption>> captor = ArgumentCaptor.forClass(List.class);
            verify(options).saveAll(captor.capture());
            assertThat(captor.getValue()).hasSize(1);
        }

        @Test
        @DisplayName("404s for an unknown category slug")
        void categoryNotFound() {
            when(categories.findBySlug("ghost")).thenReturn(Optional.empty());
            CreateQuestionRequest request = new CreateQuestionRequest(1, "issue", "What?",
                    "TEXT", false, List.of());

            assertThatThrownBy(() -> service.createQuestion("ghost", request))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.NOT_FOUND);
        }
    }

    @Nested
    @DisplayName("updateQuestion")
    class UpdateQuestion {

        @Test
        @DisplayName("replaces the existing rows for that question key")
        void success() {
            when(categories.findBySlug("plumbing")).thenReturn(Optional.of(category(1L, "plumbing", true)));
            ServiceOption existingRow = ServiceOption.builder()
                    .id(1L).categoryId(1L).stepNo(1).questionKey("issue").questionText("Old text")
                    .inputType("TEXT").required(false).sortOrder(0).active(true).build();
            when(options.findByCategoryIdAndQuestionKey(1L, "issue")).thenReturn(List.of(existingRow));

            CreateQuestionRequest request = new CreateQuestionRequest(1, "issue", "New text",
                    "TEXT", true, List.of());

            QuestionResponse response = service.updateQuestion("plumbing", "issue", request);

            assertThat(response.text()).isEqualTo("New text");
            verify(options).deleteByCategoryIdAndQuestionKey(1L, "issue");
            verify(options).saveAll(anyList());
        }

        @Test
        @DisplayName("404s when the question key does not exist yet")
        void questionNotFound() {
            when(categories.findBySlug("plumbing")).thenReturn(Optional.of(category(1L, "plumbing", true)));
            when(options.findByCategoryIdAndQuestionKey(1L, "ghost-question")).thenReturn(List.of());

            CreateQuestionRequest request = new CreateQuestionRequest(1, "ghost-question", "New text",
                    "TEXT", true, List.of());

            assertThatThrownBy(() -> service.updateQuestion("plumbing", "ghost-question", request))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.NOT_FOUND);
            verify(options, never()).deleteByCategoryIdAndQuestionKey(any(), any());
        }
    }

    @Nested
    @DisplayName("deactivateQuestion")
    class DeactivateQuestion {

        @Test
        @DisplayName("flips active to false on every row sharing the question key")
        void success() {
            when(categories.findBySlug("plumbing")).thenReturn(Optional.of(category(1L, "plumbing", true)));
            ServiceOption row1 = ServiceOption.builder().id(1L).categoryId(1L).questionKey("issue")
                    .stepNo(1).questionText("t").inputType("SINGLE").optionValue("a").active(true).build();
            ServiceOption row2 = ServiceOption.builder().id(2L).categoryId(1L).questionKey("issue")
                    .stepNo(1).questionText("t").inputType("SINGLE").optionValue("b").active(true).build();
            when(options.findByCategoryIdAndQuestionKey(1L, "issue")).thenReturn(List.of(row1, row2));

            service.deactivateQuestion("plumbing", "issue");

            assertThat(row1.isActive()).isFalse();
            assertThat(row2.isActive()).isFalse();
            verify(options).saveAll(List.of(row1, row2));
        }

        @Test
        @DisplayName("404s when the question key does not exist")
        void notFound() {
            when(categories.findBySlug("plumbing")).thenReturn(Optional.of(category(1L, "plumbing", true)));
            when(options.findByCategoryIdAndQuestionKey(1L, "ghost")).thenReturn(List.of());

            assertThatThrownBy(() -> service.deactivateQuestion("plumbing", "ghost"))
                    .isInstanceOf(ApiException.class)
                    .extracting("status").isEqualTo(HttpStatus.NOT_FOUND);
        }
    }
}

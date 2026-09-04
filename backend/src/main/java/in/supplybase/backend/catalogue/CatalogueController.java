package in.supplybase.backend.catalogue;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import in.supplybase.backend.catalogue.dto.CategoryResponse;
import in.supplybase.backend.catalogue.dto.CreateCategoryRequest;
import in.supplybase.backend.catalogue.dto.CreateQuestionRequest;
import in.supplybase.backend.catalogue.dto.QuestionResponse;
import in.supplybase.backend.catalogue.dto.ServiceFormResponse;
import in.supplybase.backend.catalogue.dto.UpdateCategoryRequest;
import in.supplybase.backend.catalogue.dto.UpdateCategoryActiveRequest;
import org.springframework.web.bind.annotation.PatchMapping;
import jakarta.validation.Valid;

/** Public. The booking form cannot be drawn until this has answered. */
@RestController
public class CatalogueController {

    private final CatalogueService service;

    public CatalogueController(CatalogueService service) {
        this.service = service;
    }

    /** The four services. */
    @GetMapping("/api/catalogue/services")
    public List<CategoryResponse> services() {
        return service.listCategories();
    }

    /** One service's questions, in order, ready to render. */
    @GetMapping("/api/catalogue/services/{slug}/form")
    public ServiceFormResponse form(@PathVariable String slug) {
        return service.form(slug);
    }

    /* ----------------------------------------------------------- staff */

    /** Every category, including inactive ones — there are only ever a handful. */
    @GetMapping("/api/admin/catalogue/categories")
    public List<CategoryResponse> listCategories() {
        return service.listAllCategories();
    }

    @PostMapping("/api/admin/catalogue/categories")
    public ResponseEntity<CategoryResponse> createCategory(
            @Valid @RequestBody CreateCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createCategory(request));
    }

    @PutMapping("/api/admin/catalogue/categories/{slug}")
    public CategoryResponse updateCategory(@PathVariable String slug,
                                           @Valid @RequestBody UpdateCategoryRequest request) {
        return service.updateCategory(slug, request);
    }

    /** Soft delete: sets active=false, keeps the row and its questions. */
    @DeleteMapping("/api/admin/catalogue/categories/{slug}")
    public ResponseEntity<Void> deleteCategory(@PathVariable String slug) {
        service.deactivateCategory(slug);
        return ResponseEntity.noContent().build();
    }

    /** Turns a category back on, or off — same effect as delete when active=false. */
    @PatchMapping("/api/admin/catalogue/categories/{slug}/active")
    public CategoryResponse setCategoryActive(@PathVariable String slug,
            @Valid @RequestBody UpdateCategoryActiveRequest request) {
        return service.setCategoryActive(slug, request);
    }

    /** Every question on this category's form, for the admin editor. */
    @GetMapping("/api/admin/catalogue/categories/{slug}/questions")
    public List<QuestionResponse> listQuestions(@PathVariable String slug) {
        return service.listQuestions(slug);
    }

    @PostMapping("/api/admin/catalogue/categories/{slug}/questions")
    public ResponseEntity<QuestionResponse> createQuestion(@PathVariable String slug,
            @Valid @RequestBody CreateQuestionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createQuestion(slug, request));
    }

    @PutMapping("/api/admin/catalogue/categories/{slug}/questions/{questionKey}")
    public QuestionResponse updateQuestion(@PathVariable String slug, @PathVariable String questionKey,
            @Valid @RequestBody CreateQuestionRequest request) {
        return service.updateQuestion(slug, questionKey, request);
    }

    /** Soft delete: sets active=false on every row sharing this questionKey. */
    @DeleteMapping("/api/admin/catalogue/categories/{slug}/questions/{questionKey}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable String slug, @PathVariable String questionKey) {
        service.deactivateQuestion(slug, questionKey);
        return ResponseEntity.noContent().build();
    }
}

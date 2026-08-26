package in.supplybase.backend.catalogue;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import in.supplybase.backend.catalogue.dto.CategoryResponse;
import in.supplybase.backend.catalogue.dto.ServiceFormResponse;

/** Public. The booking form cannot be drawn until this has answered. */
@RestController
@RequestMapping("/api/catalogue")
public class CatalogueController {

    private final CatalogueService service;

    public CatalogueController(CatalogueService service) {
        this.service = service;
    }

    /** The four services. */
    @GetMapping("/services")
    public List<CategoryResponse> services() {
        return service.listCategories();
    }

    /** One service's questions, in order, ready to render. */
    @GetMapping("/services/{slug}/form")
    public ServiceFormResponse form(@PathVariable String slug) {
        return service.form(slug);
    }
}

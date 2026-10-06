package in.supplybase.backend.catalogue;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PopCeilingPricingController {

    private final PopCeilingPricingService pricing;
    private final CatalogueService catalogue;

    public PopCeilingPricingController(
            PopCeilingPricingService pricing,
            CatalogueService catalogue) {
        this.pricing = pricing;
        this.catalogue = catalogue;
    }

    @GetMapping("/api/catalogue/services/pop-ceiling-design/starting-prices")
    public List<PopCeilingPricingService.StartingPrice> startingPrices() {
        catalogue.requireCategory("pop-ceiling-design");
        return pricing.listPrices();
    }
}

package in.supplybase.backend.catalogue;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import in.supplybase.backend.common.Money;

@RestController
public class PaintingPricingController {

    private final PaintingProductPriceRepository prices;
    private final CatalogueService catalogue;

    public PaintingPricingController(
            PaintingProductPriceRepository prices,
            CatalogueService catalogue) {
        this.prices = prices;
        this.catalogue = catalogue;
    }

    public record ProductPriceResponse(
            String flowKey,
            String paintingType,
            String brand,
            String homeType,
            String productValue,
            BigDecimal price) {
    }

    @GetMapping("/api/catalogue/services/painting/product-prices")
    public List<ProductPriceResponse> productPrices() {
        catalogue.requireCategory("painting");

        return prices.findAllByOrderByIdAsc().stream()
                .map(row -> new ProductPriceResponse(
                        row.getFlowKey(),
                        row.getPaintingType(),
                        row.getBrand(),
                        row.getHomeType(),
                        row.getProductValue(),
                        Money.paiseToRupees(row.getPricePaise())))
                .toList();
    }
}
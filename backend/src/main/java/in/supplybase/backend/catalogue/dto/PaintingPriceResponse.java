package in.supplybase.backend.catalogue.dto;

import java.math.BigDecimal;
import in.supplybase.backend.catalogue.PaintingProductPrice;
import in.supplybase.backend.common.Money;

public record PaintingPriceResponse(
        String flowKey,
        String paintingType,
        String brand,
        String homeType,
        String productValue,
        BigDecimal price) {

    public static PaintingPriceResponse from(PaintingProductPrice row) {
        return new PaintingPriceResponse(
                row.getFlowKey(),
                row.getPaintingType(),
                row.getBrand(),
                row.getHomeType(),
                row.getProductValue(),
                Money.paiseToRupees(row.getPricePaise()));
    }
}
package in.supplybase.backend.catalogue.dto;

import java.math.BigDecimal;

import in.supplybase.backend.catalogue.ServiceCategory;
import in.supplybase.backend.common.Money;

public record CategoryResponse(
        String slug, String name, String tagline, String description,
        String icon, String heroImage, BigDecimal visitFee, String visitFeeDisplay) {

    public static CategoryResponse from(ServiceCategory c) {
        return new CategoryResponse(c.getSlug(), c.getName(), c.getTagline(),
                c.getDescription(), c.getIcon(), c.getHeroImage(),
                Money.paiseToRupees(c.getVisitFeePaise()),
                "₹" + Money.formatRupees(c.getVisitFeePaise()));
    }
}

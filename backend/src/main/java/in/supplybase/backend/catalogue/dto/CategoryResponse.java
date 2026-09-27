package in.supplybase.backend.catalogue.dto;

import java.math.BigDecimal;

import in.supplybase.backend.catalogue.ServiceCategory;
import in.supplybase.backend.common.Money;

public record CategoryResponse(
        String slug, String parentSlug, String name, String tagline, String description,
        String icon, String heroImage, BigDecimal visitFee, String visitFeeDisplay,
        BigDecimal estimateMin, BigDecimal estimateMax,
        int sortOrder, boolean active) {

    public static CategoryResponse from(ServiceCategory c) {
        return new CategoryResponse(c.getSlug(), c.getParentSlug(), c.getName(), c.getTagline(),
                c.getDescription(), c.getIcon(), c.getHeroImage(),
                Money.paiseToRupees(c.getVisitFeePaise()),
                "₹" + Money.formatRupees(c.getVisitFeePaise()),
                c.getEstimateMinPaise() == null ? null : Money.paiseToRupees(c.getEstimateMinPaise()),
                c.getEstimateMaxPaise() == null ? null : Money.paiseToRupees(c.getEstimateMaxPaise()),
                c.getSortOrder(), c.isActive());
    }
}

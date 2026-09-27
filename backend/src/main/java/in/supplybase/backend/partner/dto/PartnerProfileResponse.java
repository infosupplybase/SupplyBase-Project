package in.supplybase.backend.partner.dto;

import java.time.Instant;

import in.supplybase.backend.partner.PartnerProfile;
import in.supplybase.backend.partner.PartnerStatus;

/** A partner's own view of their application: what they gave, and where it stands. */
public record PartnerProfileResponse(
        PartnerStatus status,
        String primaryTrade, String tradeLabel,
        Integer experienceYears, String city, String serviceAreas, String languages,
        String reviewNote, Instant appliedAt, Instant reviewedAt) {

    public static PartnerProfileResponse from(PartnerProfile p, String tradeLabel) {
        return new PartnerProfileResponse(
                p.getStatus(),
                p.getPrimaryTrade(), tradeLabel,
                p.getExperienceYears(), p.getCity(), p.getServiceAreas(), p.getLanguages(),
                p.getReviewNote(), p.getCreatedAt(), p.getReviewedAt());
    }
}

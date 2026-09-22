package in.supplybase.backend.partner.dto;

import java.time.Instant;

import in.supplybase.backend.auth.User;
import in.supplybase.backend.partner.PartnerProfile;
import in.supplybase.backend.partner.PartnerStatus;

/** One row of the admin Partners list. */
public record PartnerSummaryResponse(
        Long userId, String fullName, String email, String phone, boolean enabled,
        PartnerStatus status,
        String primaryTrade, String tradeLabel,
        Integer experienceYears, String city,
        long activeJobs, long completedJobs,
        Instant appliedAt) {

    public static PartnerSummaryResponse from(PartnerProfile p, String tradeLabel,
                                              long activeJobs, long completedJobs) {
        User u = p.getUser();
        return new PartnerSummaryResponse(
                u.getId(), u.getFullName(), u.getEmail(), u.getPhone(), u.isEnabled(),
                p.getStatus(),
                p.getPrimaryTrade(), tradeLabel,
                p.getExperienceYears(), p.getCity(),
                activeJobs, completedJobs,
                p.getCreatedAt());
    }
}

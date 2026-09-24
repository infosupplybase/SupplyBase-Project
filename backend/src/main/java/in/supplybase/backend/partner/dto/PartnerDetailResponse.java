package in.supplybase.backend.partner.dto;

import java.time.Instant;
import java.util.List;

import in.supplybase.backend.auth.Role;
import in.supplybase.backend.auth.User;
import in.supplybase.backend.booking.dto.PartnerEarningsResponse;
import in.supplybase.backend.partner.PartnerProfile;
import in.supplybase.backend.partner.PartnerStatus;

/** Everything the admin drawer shows about one partner, including their jobs. */
public record PartnerDetailResponse(
        Long userId, String fullName, String email, String phone, boolean enabled,
        boolean emailVerified, Role role,
        PartnerStatus status,
        String primaryTrade, String tradeLabel,
        Integer experienceYears, String city, String serviceAreas, String languages,
        String reviewNote, Instant reviewedAt, Instant appliedAt,
        long activeJobs, long completedJobs,
        PartnerEarningsResponse earnings,
        List<PartnerJobResponse> jobs) {

    public static PartnerDetailResponse from(PartnerProfile p, String tradeLabel,
                                             long activeJobs, long completedJobs,
                                             PartnerEarningsResponse earnings,
                                             List<PartnerJobResponse> jobs) {
        User u = p.getUser();
        return new PartnerDetailResponse(
                u.getId(), u.getFullName(), u.getEmail(), u.getPhone(), u.isEnabled(),
                u.isEmailVerified(), u.getRole(),
                p.getStatus(),
                p.getPrimaryTrade(), tradeLabel,
                p.getExperienceYears(), p.getCity(), p.getServiceAreas(), p.getLanguages(),
                p.getReviewNote(), p.getReviewedAt(), p.getCreatedAt(),
                activeJobs, completedJobs, earnings, jobs);
    }
}

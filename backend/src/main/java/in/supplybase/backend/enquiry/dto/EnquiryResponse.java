package in.supplybase.backend.enquiry.dto;

import java.time.Instant;

import in.supplybase.backend.enquiry.Enquiry;
import in.supplybase.backend.enquiry.EnquirySource;
import in.supplybase.backend.enquiry.EnquiryStatus;

public record EnquiryResponse(
        Long id, String reference, String name, String phone, String email,
        String projectType, String serviceSlug, String location, String budgetRange,
        String description, EnquirySource source, EnquiryStatus status,
        String adminNotes, Instant createdAt) {

    public static EnquiryResponse from(Enquiry e) {
        return new EnquiryResponse(e.getId(), e.getReference(), e.getName(), e.getPhone(),
                e.getEmail(), e.getProjectType(), e.getServiceSlug(), e.getLocation(),
                e.getBudgetRange(), e.getDescription(), e.getSource(), e.getStatus(),
                e.getAdminNotes(), e.getCreatedAt());
    }

    /**
     * What the public form gets back. Deliberately not the full record: the
     * POST is unauthenticated, so echoing everything would let anyone confirm
     * what was stored about someone else's enquiry.
     */
    public record Receipt(String reference, String message) {
        public static Receipt of(Enquiry e) {
            return new Receipt(e.getReference(),
                    "Thank you. We have your enquiry and will call you shortly.");
        }
    }
}

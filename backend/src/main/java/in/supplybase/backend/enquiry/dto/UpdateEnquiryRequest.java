package in.supplybase.backend.enquiry.dto;

import in.supplybase.backend.enquiry.EnquiryStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateEnquiryRequest(
        @NotNull(message = "A status is required") EnquiryStatus status,
        @Size(max = 5000) String adminNotes) {
}

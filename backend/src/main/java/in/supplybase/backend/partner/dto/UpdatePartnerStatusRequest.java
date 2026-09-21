package in.supplybase.backend.partner.dto;

import in.supplybase.backend.partner.PartnerStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * An admin's decision on a partner. The note is required when rejecting or
 * suspending (checked in PartnerService) and is shown to the partner, so it
 * should say what to fix or what happened.
 */
public record UpdatePartnerStatusRequest(
        @NotNull(message = "Please choose a status")
        PartnerStatus status,

        @Size(max = 500, message = "Please keep the note under 500 characters")
        String note) {
}

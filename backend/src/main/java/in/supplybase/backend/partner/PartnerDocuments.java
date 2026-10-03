package in.supplybase.backend.partner;

import org.springframework.web.multipart.MultipartFile;

import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.PhotoUploads;

/**
 * The identity documents a partner sends with their application: photos of
 * the front and back of their Aadhaar card and the front of their PAN card.
 *
 * They are stored privately (never served to the public, never returned in
 * an API response) for the team to check before approving the application.
 */
public record PartnerDocuments(MultipartFile aadhaarFront, MultipartFile aadhaarBack, MultipartFile panFront) {

    /**
     * Throws a 400 naming the document unless all three are real photos
     * (JPEG, PNG or WebP, checked by their contents) within the size limit.
     */
    void requirePhotos() {
        check(aadhaarFront, "Aadhaar card (front)");
        check(aadhaarBack, "Aadhaar card (back)");
        check(panFront, "PAN card");
    }

    private static void check(MultipartFile file, String document) {
        try {
            PhotoUploads.require(file);
        } catch (ApiException e) {
            throw ApiException.badRequest(document + ": " + e.getMessage());
        }
    }
}

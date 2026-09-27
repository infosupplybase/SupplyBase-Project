package in.supplybase.backend.project.dto;

import java.time.Instant;

import in.supplybase.backend.project.DocumentType;
import in.supplybase.backend.project.ProjectDocument;

/**
 * Deliberately omits the raw storage key (`fileUrl`) — that's an internal
 * detail, and downloads go through the dedicated download endpoint instead.
 */
public record ProjectDocumentResponse(
        Long id, String title, DocumentType docType, String contentType, Long sizeBytes,
        Instant createdAt) {

    public static ProjectDocumentResponse from(ProjectDocument doc) {
        return new ProjectDocumentResponse(doc.getId(), doc.getTitle(), doc.getDocType(),
                doc.getContentType(), doc.getSizeBytes(), doc.getCreatedAt());
    }
}

package in.supplybase.backend.booking.dto;

import java.time.Instant;

import in.supplybase.backend.booking.BookingFile;

/**
 * Deliberately omits the raw storage key — that's an internal detail, and
 * downloads go through the dedicated download endpoint instead.
 */
public record BookingFileResponse(
        Long id, String originalName, String contentType, long sizeBytes, String kind,
        Instant createdAt) {

    public static BookingFileResponse from(BookingFile file) {
        return new BookingFileResponse(file.getId(), file.getOriginalName(), file.getContentType(),
                file.getSizeBytes(), file.getKind(), file.getCreatedAt());
    }
}

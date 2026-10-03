package in.supplybase.backend.common;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.Locale;
import java.util.Set;

import org.springframework.web.multipart.MultipartFile;

/**
 * What a customer may attach to a booking: ordinary photos (JPEG, PNG, WebP),
 * not too big, not too many.
 *
 * The file's own first bytes are checked, not just its name or the
 * Content-Type the browser claims - both of those are whatever the sender
 * says, so an HTML page or a program renamed "photo.jpg" would otherwise be
 * stored and later handed to our staff. (Staff and project documents go
 * through a different path and may be other file types.)
 */
public final class PhotoUploads {

    /** Per photo. The server-wide multipart limit (15 MB) still applies above this. */
    public static final long MAX_BYTES = 10L * 1024 * 1024;

    /** Photos a booking can hold. The website lets a customer add 5 per booking form. */
    public static final int MAX_PHOTOS_PER_BOOKING = 10;

    private static final Set<String> EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp");

    private static final String MESSAGE = "Only JPG, PNG or WebP photos can be uploaded.";

    private PhotoUploads() {
    }

    /** Throws a 400 unless {@code file} is a JPEG, PNG or WebP photo within the size limit. */
    public static void require(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("The uploaded file is empty.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw ApiException.badRequest("Each photo can be at most 10 MB.");
        }

        String name = file.getOriginalFilename();
        if (name != null) {
            int dot = name.lastIndexOf('.');
            if (dot >= 0 && !EXTENSIONS.contains(name.substring(dot).toLowerCase(Locale.ROOT))) {
                throw ApiException.badRequest(MESSAGE);
            }
        }

        byte[] head = new byte[12];
        int read;
        try (InputStream in = file.getInputStream()) {
            read = in.readNBytes(head, 0, head.length);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not read the uploaded file", e);
        }
        if (!looksLikePhoto(head, read)) {
            throw ApiException.badRequest(MESSAGE);
        }
    }

    /** JPEG (FF D8 FF), PNG (89 "PNG" 0D 0A 1A 0A) or WebP ("RIFF" ... "WEBP"). */
    static boolean looksLikePhoto(byte[] b, int length) {
        if (length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return true;
        }
        if (length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) {
            return true;
        }
        return length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P';
    }
}

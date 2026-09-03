package in.supplybase.backend.common;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import in.supplybase.backend.config.AppProperties;

/**
 * Local-disk file storage.
 *
 * This is deliberately local disk, not S3 — fine for local/current use, but
 * it does NOT survive a redeploy on Render/Railway's ephemeral filesystem.
 * Swap this class for S3-compatible storage before relying on uploads
 * persisting across deploys.
 */
@Service
public class FileStorageService {

    private final Path root;

    public FileStorageService(AppProperties props) {
        this.root = Path.of(props.storageRootDir()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not create storage root directory " + root, e);
        }
    }

    public record StoredFile(String storageKey, String originalName, String contentType, long sizeBytes) {
    }

    /**
     * Writes {@code file} into {@code <root>/<subDirectory>/<generated-name>}
     * under a collision-safe generated name, returning the relative storage
     * key to persist alongside the record that owns the file.
     */
    public StoredFile store(MultipartFile file, String subDirectory) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("The uploaded file is empty.");
        }

        String originalName = file.getOriginalFilename();
        // The generated name is what is actually used on disk, but the
        // original name is stored and shown back to users later — validate
        // it anyway as defense in depth against directory traversal.
        if (originalName != null
                && (originalName.contains("..") || originalName.contains("/") || originalName.contains("\\"))) {
            throw ApiException.badRequest("That file name is not allowed.");
        }

        String extension = extensionOf(originalName);
        String generatedName = UUID.randomUUID() + extension;

        try {
            Path targetDir = root.resolve(subDirectory).normalize();
            Files.createDirectories(targetDir);
            Path targetFile = targetDir.resolve(generatedName);
            file.transferTo(targetFile);

            String storageKey = root.relativize(targetFile).toString().replace('\\', '/');
            return new StoredFile(storageKey, originalName, file.getContentType(), file.getSize());
        } catch (IOException e) {
            throw new UncheckedIOException("Could not store uploaded file", e);
        }
    }

    /**
     * Reads back a file by its storage key.
     *
     * The resolved absolute path is verified to still be inside the storage
     * root before it is read — the actual security control against a
     * manipulated storage key attempting directory traversal.
     */
    public byte[] load(String storageKey) {
        Path resolved = root.resolve(storageKey).normalize();
        if (!resolved.startsWith(root)) {
            throw ApiException.notFound("That file");
        }
        if (!Files.isRegularFile(resolved)) {
            throw ApiException.notFound("That file");
        }
        try {
            return Files.readAllBytes(resolved);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not read stored file " + storageKey, e);
        }
    }

    private static String extensionOf(String originalName) {
        if (originalName == null) {
            return "";
        }
        int dot = originalName.lastIndexOf('.');
        // A dot with nothing sensible after it (e.g. trailing dot, or a
        // hidden-file-style leading dot with no extension) is not an extension.
        if (dot < 0 || dot == originalName.length() - 1) {
            return "";
        }
        return originalName.substring(dot);
    }
}

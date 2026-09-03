package in.supplybase.backend.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Path;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import in.supplybase.backend.config.AppProperties;

/**
 * Genuinely untested and cheap to cover — not the primary target of this
 * pass (that is booking/ and project/), but {@link FileStorageService} is
 * new and every booking/project file test mocks it rather than exercising
 * it, so nothing else pins its actual disk behaviour down.
 *
 * Uses a real, isolated temp directory rather than mocking java.nio.file —
 * this class's entire value is in what it does to a real filesystem
 * (path traversal, collision-safe naming), so a Mockito test of it would
 * verify nothing meaningful.
 */
class FileStorageServiceTest {

    @TempDir
    Path tempDir;

    private FileStorageService newService() {
        AppProperties props = new AppProperties(
                null, null, null, null, null, null, null, null, tempDir.toString());
        return new FileStorageService(props);
    }

    @Test
    @DisplayName("a stored file can be read back byte for byte")
    void roundTripsAFile() {
        FileStorageService storage = newService();
        MockMultipartFile upload = new MockMultipartFile(
                "file", "invoice.pdf", "application/pdf", new byte[] { 1, 2, 3, 4 });

        FileStorageService.StoredFile stored = storage.store(upload, "projects/1");

        assertThat(stored.originalName()).isEqualTo("invoice.pdf");
        assertThat(stored.contentType()).isEqualTo("application/pdf");
        assertThat(stored.sizeBytes()).isEqualTo(4L);
        assertThat(stored.storageKey()).startsWith("projects/1/").endsWith(".pdf");

        assertThat(storage.load(stored.storageKey())).containsExactly(1, 2, 3, 4);
    }

    @Test
    @DisplayName("two uploads with the same original name do not collide")
    void generatesCollisionSafeNames() {
        FileStorageService storage = newService();
        MockMultipartFile first = new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[] { 1 });
        MockMultipartFile second = new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[] { 2 });

        FileStorageService.StoredFile a = storage.store(first, "bookings/1");
        FileStorageService.StoredFile b = storage.store(second, "bookings/1");

        assertThat(a.storageKey()).isNotEqualTo(b.storageKey());
        assertThat(storage.load(a.storageKey())).containsExactly(1);
        assertThat(storage.load(b.storageKey())).containsExactly(2);
    }

    @Test
    @DisplayName("an empty upload is refused")
    void rejectsAnEmptyFile() {
        FileStorageService storage = newService();
        MockMultipartFile empty = new MockMultipartFile("file", "empty.txt", "text/plain", new byte[0]);

        assertThatThrownBy(() -> storage.store(empty, "bookings/1"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("empty");
    }

    @Test
    @DisplayName("a file name attempting to embed a path is refused")
    void rejectsAPathTraversingFileName() {
        FileStorageService storage = newService();
        MockMultipartFile malicious =
                new MockMultipartFile("file", "../../etc/passwd", "text/plain", new byte[] { 1 });

        assertThatThrownBy(() -> storage.store(malicious, "bookings/1"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("not allowed");
    }

    @Test
    @DisplayName("a storage key that resolves outside the storage root is refused on read")
    void rejectsLoadingOutsideTheStorageRoot() {
        FileStorageService storage = newService();

        assertThatThrownBy(() -> storage.load("../outside.txt"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    @DisplayName("loading an unknown key is a not-found, not a crash")
    void rejectsLoadingAMissingFile() {
        FileStorageService storage = newService();

        assertThatThrownBy(() -> storage.load("bookings/1/does-not-exist.jpg"))
                .isInstanceOf(ApiException.class);
    }
}

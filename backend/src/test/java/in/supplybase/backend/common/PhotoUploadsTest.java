package in.supplybase.backend.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class PhotoUploadsTest {

    private static final byte[] JPEG = { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 16, 'J', 'F', 'I', 'F', 0, 1 };
    private static final byte[] PNG = { (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13 };
    private static final byte[] WEBP = { 'R', 'I', 'F', 'F', 1, 2, 3, 4, 'W', 'E', 'B', 'P' };

    private static MockMultipartFile file(String name, byte[] content) {
        return new MockMultipartFile("file", name, "image/jpeg", content);
    }

    @Test
    @DisplayName("a real JPEG, PNG and WebP are accepted (any letter case in the extension)")
    void photosAccepted() {
        assertThatCode(() -> PhotoUploads.require(file("IMG_1.JPG", JPEG))).doesNotThrowAnyException();
        assertThatCode(() -> PhotoUploads.require(file("wall.png", PNG))).doesNotThrowAnyException();
        assertThatCode(() -> PhotoUploads.require(file("room.webp", WEBP))).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("an HTML page renamed photo.jpg is refused: the contents are checked, not the name")
    void disguisedHtml() {
        byte[] html = "<html><script>alert(1)</script></html>".getBytes();

        assertThatThrownBy(() -> PhotoUploads.require(file("photo.jpg", html)))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("JPG, PNG or WebP");
    }

    @Test
    @DisplayName("a real photo with a program's extension is refused")
    void wrongExtension() {
        assertThatThrownBy(() -> PhotoUploads.require(file("photo.exe", JPEG)))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> PhotoUploads.require(file("photo.html", JPEG)))
                .isInstanceOf(ApiException.class);
    }

    @Test
    @DisplayName("GIF and other image types the site does not offer are refused")
    void otherImageTypes() {
        byte[] gif = { 'G', 'I', 'F', '8', '9', 'a', 1, 0, 1, 0, 0, 0 };

        assertThatThrownBy(() -> PhotoUploads.require(file("anim.gif", gif))).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> PhotoUploads.require(file("anim.png", gif))).isInstanceOf(ApiException.class);
    }

    @Test
    @DisplayName("an empty file and one over 10 MB are refused")
    void emptyAndTooBig() {
        assertThatThrownBy(() -> PhotoUploads.require(file("empty.jpg", new byte[0])))
                .isInstanceOf(ApiException.class);

        byte[] big = new byte[(int) PhotoUploads.MAX_BYTES + 1];
        System.arraycopy(JPEG, 0, big, 0, JPEG.length);
        assertThatThrownBy(() -> PhotoUploads.require(file("big.jpg", big)))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("10 MB");
    }

    @Test
    @DisplayName("looksLikePhoto needs the full signature")
    void signatures() {
        assertThat(PhotoUploads.looksLikePhoto(new byte[] { (byte) 0xFF, (byte) 0xD8 }, 2)).isFalse();
        assertThat(PhotoUploads.looksLikePhoto(PNG, PNG.length)).isTrue();
        assertThat(PhotoUploads.looksLikePhoto(new byte[] { 'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'A', 'V', 'E' }, 12))
                .isFalse();
    }
}

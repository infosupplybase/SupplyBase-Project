package in.supplybase.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CorsOriginsCheckTest {

    private static AppProperties props(String frontendUrl, List<String> origins) {
        return new AppProperties(
                origins,
                new AppProperties.Jwt("test-secret-key-at-least-32-bytes-long!!", 15, 30, "supplybase"),
                new AppProperties.Razorpay(null, null, null, "INR"),
                new AppProperties.Google(null),
                new AppProperties.Notifications(null),
                frontendUrl,
                new AppProperties.Bootstrap(null, null),
                new AppProperties.Booking(48),
                "/tmp/storage");
    }

    @Test
    @DisplayName("a public site that still allows localhost origins is flagged")
    void publicSiteWithLocalOrigins() {
        List<String> found = CorsOriginsCheck.localOriginsOnPublicSite(props(
                "https://www.supplybase.co.in",
                List.of("https://www.supplybase.co.in", "http://localhost:[*]", "http://127.0.0.1:[*]")));

        assertThat(found).containsExactly("http://localhost:[*]", "http://127.0.0.1:[*]");
    }

    @Test
    @DisplayName("a public site with only public origins is fine")
    void publicSiteWithPublicOrigins() {
        assertThat(CorsOriginsCheck.localOriginsOnPublicSite(props(
                "https://www.supplybase.co.in",
                List.of("https://www.supplybase.co.in", "https://admin.supplybase.co.in")))).isEmpty();
    }

    @Test
    @DisplayName("a local run (http frontend) keeps its localhost origins without a warning")
    void localRun() {
        assertThat(CorsOriginsCheck.localOriginsOnPublicSite(props(
                "http://localhost:5173", List.of("http://localhost:[*]")))).isEmpty();
    }
}

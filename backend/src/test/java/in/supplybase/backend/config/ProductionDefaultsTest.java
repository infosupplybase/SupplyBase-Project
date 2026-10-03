package in.supplybase.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.util.List;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.ClassPathResource;

/**
 * application.yml settings that production safety depends on, read straight
 * from the file so a careless edit cannot drop them unnoticed. (They are
 * defaults: a real environment variable can still override each one.)
 */
class ProductionDefaultsTest {

    private static PropertySource<?> yml;

    @BeforeAll
    static void load() throws IOException {
        List<PropertySource<?>> sources =
                new YamlPropertySourceLoader().load("application", new ClassPathResource("application.yml"));
        yml = sources.get(0);
    }

    @Test
    @DisplayName("the API trusts nginx's X-Forwarded-* headers, so per-visitor limits see real addresses")
    void forwardedHeaders() {
        assertThat(yml.getProperty("server.forward-headers-strategy")).isEqualTo("native");
    }

    @Test
    @DisplayName("the API docs are off unless API_DOCS_ENABLED=true")
    void apiDocsOffByDefault() {
        assertThat(yml.getProperty("springdoc.api-docs.enabled")).isEqualTo("${API_DOCS_ENABLED:false}");
        assertThat(yml.getProperty("springdoc.swagger-ui.enabled")).isEqualTo("${API_DOCS_ENABLED:false}");
    }
}

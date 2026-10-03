package in.supplybase.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.util.List;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.FileSystemResource;

/**
 * The promises docker-compose.prod.yml makes about the server, checked from
 * the file itself (tests run from the backend/ folder): the database is not
 * reachable from the internet, the API only from nginx on the same machine,
 * and Docker's logs cannot fill the disk.
 */
class ProductionComposeTest {

    private static PropertySource<?> compose;

    @BeforeAll
    static void load() throws IOException {
        List<PropertySource<?>> sources =
                new YamlPropertySourceLoader().load("compose", new FileSystemResource("docker-compose.prod.yml"));
        compose = sources.get(0);
    }

    @Test
    @DisplayName("MySQL publishes no port: only the API container can reach it")
    void databaseIsNotPublished() {
        assertThat(compose.getProperty("services.mysql.image")).isNotNull();
        assertThat(compose.containsProperty("services.mysql.ports[0]")).isFalse();
    }

    @Test
    @DisplayName("the API port is bound to the loopback address, so only nginx can reach it")
    void apiOnlyOnLoopback() {
        assertThat(compose.getProperty("services.api.ports[0]")).isEqualTo("127.0.0.1:8080:8080");
        assertThat(compose.containsProperty("services.api.ports[1]")).isFalse();
    }

    @Test
    @DisplayName("both containers rotate their logs")
    void logsAreRotated() {
        for (String service : List.of("mysql", "api")) {
            assertThat(compose.getProperty("services." + service + ".logging.options.max-size")).isEqualTo("10m");
            assertThat(compose.getProperty("services." + service + ".logging.options.max-file")).isEqualTo("5");
        }
    }
}

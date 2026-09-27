package in.supplybase.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import in.supplybase.backend.config.AppProperties;

/**
 * Covers JwtService's own construction-time secret handling — mocked
 * everywhere else it is used (AuthServiceTest, WebSecurityTestConfig), so
 * this is the only place resolveSecret's three branches are actually
 * exercised.
 */
class JwtServiceTest {

    private static AppProperties propsWithSecret(String secret) {
        AppProperties.Jwt jwt = new AppProperties.Jwt(secret, 15, 30, "supplybase-projects");
        return new AppProperties(null, jwt, null, null, null, null, null, null, null);
    }

    private static User user() {
        return User.builder()
                .id(1L)
                .email("client@example.com")
                .fullName("A Client")
                .role(Role.CUSTOMER)
                .enabled(true)
                .build();
    }

    @Test
    @DisplayName("a configured secret of at least 32 bytes issues a token that parses back to the same user")
    void roundTripsWithAConfiguredSecret() {
        JwtService service = new JwtService(propsWithSecret("a".repeat(32)));
        User user = user();

        String token = service.issueAccessToken(user);

        assertThat(service.parseUserId(token)).isEqualTo(user.getId());
    }

    @Test
    @DisplayName("a secret under 32 bytes is refused at startup rather than accepted")
    void rejectsATooShortSecret() {
        assertThatThrownBy(() -> new JwtService(propsWithSecret("too-short")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32 bytes");
    }

    @Test
    @DisplayName("a blank secret does not fail startup, and still issues a usable token")
    void blankSecretFallsBackToAGeneratedOne() {
        JwtService service = new JwtService(propsWithSecret(""));
        User user = user();

        String token = service.issueAccessToken(user);

        assertThat(service.parseUserId(token)).isEqualTo(user.getId());
    }

    @Test
    @DisplayName("a null secret behaves the same as a blank one")
    void nullSecretFallsBackToAGeneratedOne() {
        JwtService service = new JwtService(propsWithSecret(null));
        User user = user();

        String token = service.issueAccessToken(user);

        assertThat(service.parseUserId(token)).isEqualTo(user.getId());
    }

    @Test
    @DisplayName("two instances left to generate their own secret do not agree on one — a token from one is rejected by the other")
    void generatedSecretsAreNotShared() {
        JwtService first = new JwtService(propsWithSecret(null));
        JwtService second = new JwtService(propsWithSecret(null));

        String token = first.issueAccessToken(user());

        assertThatThrownBy(() -> second.parseUserId(token))
                .isInstanceOf(in.supplybase.backend.common.ApiException.class);
    }
}

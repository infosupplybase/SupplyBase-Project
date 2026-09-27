package in.supplybase.backend.support;

import java.util.List;

import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;

import in.supplybase.backend.auth.CurrentUser;
import in.supplybase.backend.auth.JwtAuthenticationFilter;
import in.supplybase.backend.auth.JwtService;
import in.supplybase.backend.auth.UserRepository;
import in.supplybase.backend.common.RestAccessDeniedHandler;
import in.supplybase.backend.common.RestAuthenticationEntryPoint;
import in.supplybase.backend.config.AppProperties;
import in.supplybase.backend.config.SecurityConfig;

import tools.jackson.databind.ObjectMapper;

/**
 * Wires the real {@link SecurityConfig} into a {@code @WebMvcTest} slice so
 * role-based authorization (401 / 403 / 200) is exercised the same way it
 * runs in production, without a database.
 *
 * No other test in this codebase had settled on a pattern for this when
 * these tests were written (only {@code common/MoneyTest} and
 * {@code common/PhoneNumbersTest} existed), so this is a fresh design:
 * {@code JwtService} and {@code UserRepository} are mocked purely so the
 * real {@link JwtAuthenticationFilter} bean can be constructed — no test
 * here relies on decoding an actual bearer token. Tests that need to act as
 * a signed-in user instead inject an {@code Authentication} directly with
 * {@code SecurityMockMvcRequestPostProcessors.authentication(...)}, which
 * populates the security context before the filter chain runs. The real
 * {@code JwtAuthenticationFilter} sees an authentication already present
 * (its own early-return check) and steps aside, leaving the injected
 * {@code AuthenticatedUser} principal in place for
 * {@code SecurityContextHolder} reads in the controllers and for
 * {@link CurrentUser}.
 *
 * If the auth/catalogue/appointment test suite later settles on a different
 * convention for this, reconcile the two rather than keeping both.
 */
@TestConfiguration
@Import(SecurityConfig.class)
public class WebSecurityTestConfig {

    @Bean
    JwtService jwtService() {
        return Mockito.mock(JwtService.class);
    }

    @Bean
    UserRepository userRepository() {
        return Mockito.mock(UserRepository.class);
    }

    @Bean
    JwtAuthenticationFilter jwtAuthenticationFilter(JwtService jwtService, UserRepository users) {
        return new JwtAuthenticationFilter(jwtService, users);
    }

    @Bean
    RestAuthenticationEntryPoint restAuthenticationEntryPoint(ObjectMapper mapper) {
        return new RestAuthenticationEntryPoint(mapper);
    }

    @Bean
    RestAccessDeniedHandler restAccessDeniedHandler(ObjectMapper mapper) {
        return new RestAccessDeniedHandler(mapper);
    }

    @Bean
    AppProperties appProperties() {
        return new AppProperties(
                List.of("*"),
                null,
                null,
                null,
                new AppProperties.Notifications(null),
                null,
                null,
                new AppProperties.Booking(24),
                null);
    }

    @Bean
    CurrentUser currentUser() {
        return new CurrentUser();
    }
}

package in.supplybase.backend.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import in.supplybase.backend.auth.JwtAuthenticationFilter;
import in.supplybase.backend.common.RestAccessDeniedHandler;
import in.supplybase.backend.common.RestAuthenticationEntryPoint;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final RestAuthenticationEntryPoint entryPoint;
    private final RestAccessDeniedHandler accessDeniedHandler;
    private final AppProperties props;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter,
                          RestAuthenticationEntryPoint entryPoint,
                          RestAccessDeniedHandler accessDeniedHandler,
                          AppProperties props) {
        this.jwtFilter = jwtFilter;
        this.entryPoint = entryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
        this.props = props;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // Cost 12. The default 10 is cheap on 2026 hardware; 12 costs a client
        // login roughly a quarter-second and costs an offline attacker far more.
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // No cookies are issued, so there is no session for an attacker's
            // form to ride. CSRF protection guards cookie-authenticated
            // requests; a Bearer-token API has nothing for it to protect.
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(entryPoint)
                .accessDeniedHandler(accessDeniedHandler))
            .authorizeHttpRequests(auth -> auth
                // --- public
                .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login",
                                 "/api/auth/google", "/api/auth/refresh",
                                 "/api/auth/logout").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/enquiries").permitAll()
                // Public, but the JWT filter still runs first — so a signed-in
                // visitor's booking gets attached to their account.
                .requestMatchers(HttpMethod.POST, "/api/bookings").permitAll()
                // Razorpay authenticates itself with an HMAC signature in the
                // request body, not with our JWT, so this must stay open.
                .requestMatchers(HttpMethod.POST, "/api/payments/webhook").permitAll()
                .requestMatchers("/actuator/health", "/error").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // --- staff only
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/professional/**").hasAnyRole("PROFESSIONAL", "ADMIN")
                .requestMatchers("/api/customer/**").hasAnyRole("CUSTOMER", "ADMIN")

                // The service catalogue is what the booking form is built from,
                // so it has to be readable before anyone signs in.
                .requestMatchers(HttpMethod.GET, "/api/catalogue/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/appointments/available-slots").permitAll()

                // --- everything else needs a token
                .anyRequest().authenticated())
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        /*
         * setAllowedOriginPatterns, not setAllowedOrigins.
         *
         * Two reasons. Vite moves to 5174, 5175 and so on whenever the
         * previous port is still held by an old dev server, and a hard-coded
         * 5173 then rejects the browser with a 403 that surfaces to the user
         * as "could not reach the server" — a confusing way to say "wrong
         * port". Patterns let one entry cover them all.
         *
         * The second reason is that allowCredentials(true) makes a literal
         * "*" illegal, while patterns remain legal. Production still lists
         * exact origins through CORS_ORIGINS; only the development default
         * is a pattern, and it is still restricted to localhost.
         */
        config.setAllowedOriginPatterns(props.corsAllowedOrigins());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With"));
        config.setExposedHeaders(List.of("Location"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}

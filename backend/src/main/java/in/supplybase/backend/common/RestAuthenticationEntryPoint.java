package in.supplybase.backend.common;

import java.io.IOException;

import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

// Jackson 3 (tools.jackson), not the Jackson 2 com.fasterxml package —
// Spring Boot 4 ships Jackson 3, and 2.x is only present at runtime scope
// because jjwt-jackson drags it in.
import tools.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Without this, an unauthenticated request gets Spring's default HTML login
 * redirect — useless to a fetch() call. This returns the same JSON error shape
 * as every other failure.
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper mapper;

    public RestAuthenticationEntryPoint(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        mapper.writeValue(response.getOutputStream(),
                ApiError.of(401, "Unauthorized", "You need to sign in to do that.",
                        request.getRequestURI()));
    }
}

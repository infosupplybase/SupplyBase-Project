package in.supplybase.backend.auth;

import java.io.IOException;
import java.util.List;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Reads the Bearer token and, if it is valid, puts the user in the security
 * context for the rest of the request.
 *
 * The user is loaded from the database on every authenticated request rather
 * than trusted from the token's claims. It costs one primary-key lookup and
 * buys immediate effect for disabling an account or changing a role — with
 * claims alone, a sacked manager keeps their access until the token expires.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String HEADER = "Authorization";
    private static final String PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserRepository users;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository users) {
        this.jwtService = jwtService;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader(HEADER);
        if (header == null || !header.startsWith(PREFIX)
                || SecurityContextHolder.getContext().getAuthentication() != null) {
            chain.doFilter(request, response);
            return;
        }

        try {
            Long userId = jwtService.parseUserId(header.substring(PREFIX.length()).trim());
            users.findById(userId)
                    .filter(User::isEnabled)
                    .ifPresent(user -> {
                        var authentication = new UsernamePasswordAuthenticationToken(
                                new AuthenticatedUser(user.getId(), user.getEmail(), user.getRole()),
                                null,
                                List.of(new SimpleGrantedAuthority(user.getRole().authority())));
                        authentication.setDetails(
                                new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    });
        } catch (Exception ex) {
            // A bad token is not an error worth a 500 — leave the request
            // unauthenticated and let the entry point return a clean 401.
            SecurityContextHolder.clearContext();
        }

        chain.doFilter(request, response);
    }
}

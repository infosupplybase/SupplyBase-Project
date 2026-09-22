package in.supplybase.backend.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;

import javax.crypto.SecretKey;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * Issues and reads the two token types.
 *
 * ACCESS tokens are JWTs: short-lived, self-contained, never stored. They can
 * not be revoked before expiry, which is exactly why they are short.
 *
 * REFRESH tokens are opaque random strings, stored hashed in MySQL. Being
 * database-backed is what makes "sign out everywhere" possible at all — you
 * cannot un-issue a JWT, but you can delete a row.
 */
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private static final String CLAIM_ROLE = "role";
    private static final String CLAIM_NAME = "name";

    // HS256 wants 256 bits — the same size Keys.secretKeyFor(HS256) itself
    // would generate, so a fallback ephemeral key (see resolveSecret) is
    // exactly as strong as a properly configured one.
    private static final int MIN_SECRET_BYTES = 32;

    private final SecretKey key;
    private final AppProperties.Jwt config;
    private final SecureRandom random = new SecureRandom();

    public JwtService(AppProperties props) {
        this.config = props.jwt();
        this.key = Keys.hmacShaKeyFor(resolveSecret(config.secret()));
    }

    /**
     * A blank JWT_SECRET does not fall back to any fixed value baked into
     * application.yml — a fixed value there is sitting in source control,
     * so anyone who has read this file could forge a token for any user,
     * including an admin, against a deployment that forgot to set the real
     * one. (An earlier version of this class did exactly that: the fallback
     * secret was deliberately padded to clear the 32-byte check below, which
     * meant a missing JWT_SECRET failed silently instead of loudly.)
     *
     * Instead, a fresh 256-bit secret is generated for this process only.
     * The app still boots — nothing here should ever crash a deployment
     * that simply forgot an optional-looking setting — but every existing
     * session is invalidated on the next restart, and a multi-instance
     * deployment would reject tokens issued by a sibling instance. Both are
     * loud, immediately visible failures, which is the point: they get
     * fixed, rather than sitting unnoticed as a permanently guessable key.
     */
    private byte[] resolveSecret(String configured) {
        if (configured == null || configured.isBlank()) {
            log.error("JWT_SECRET is not set. Using a random secret generated for THIS RUN ONLY: "
                    + "every signed-in session will be invalidated on the next restart, and this "
                    + "instance will reject tokens issued by any other instance in a multi-instance "
                    + "deployment. Set the JWT_SECRET environment variable (openssl rand -base64 48) "
                    + "before running in production.");
            byte[] generated = new byte[MIN_SECRET_BYTES];
            random.nextBytes(generated);
            return generated;
        }

        byte[] secret = configured.getBytes(StandardCharsets.UTF_8);
        if (secret.length < MIN_SECRET_BYTES) {
            // Fail at startup rather than issuing forgeable tokens all day.
            throw new IllegalStateException(
                    "app.jwt.secret must be at least 32 bytes for HS256. Set the JWT_SECRET environment variable.");
        }
        return secret;
    }

    public String issueAccessToken(User user) {
        Instant now = Instant.now();
        Instant expiry = now.plus(Duration.ofMinutes(config.accessTokenMinutes()));
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .issuer(config.issuer())
                .claim(CLAIM_ROLE, user.getRole().name())
                .claim(CLAIM_NAME, user.getFullName())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(key)
                .compact();
    }

    public Duration accessTokenLifetime() {
        return Duration.ofMinutes(config.accessTokenMinutes());
    }

    public Duration refreshTokenLifetime() {
        return Duration.ofDays(config.refreshTokenDays());
    }

    /** @return the user id carried by a valid token */
    public Long parseUserId(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer(config.issuer())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Long.valueOf(claims.getSubject());
        } catch (JwtException | IllegalArgumentException ex) {
            throw ApiException.unauthorized("Your session is not valid. Please sign in again.");
        }
    }

    /** A 256-bit opaque refresh token. Not a JWT — it carries no claims at all. */
    public String generateRefreshToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * SHA-256, not BCrypt. A refresh token is 256 bits of entropy from a CSPRNG,
     * so it is not brute-forceable and needs no slow hash — and lookup has to
     * be a plain indexed equality match, which BCrypt's per-row salt prevents.
     */
    public String hashRefreshToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(64);
            for (byte b : hashed) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("SHA-256 is unavailable", ex);
        }
    }
}

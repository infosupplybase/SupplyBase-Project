package in.supplybase.backend.auth;

import java.util.Collections;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.config.AppProperties;

/**
 * Checks that a Google ID token is genuine and meant for us.
 *
 * The browser hands us a token it claims came from Google. Verification is the
 * only thing standing between that claim and an account: the library checks
 * the RSA signature against Google's published keys, that the issuer really is
 * Google, that the audience is OUR client id, and that it has not expired.
 *
 * The audience check is the one people skip and the one that matters most —
 * without it, a token minted for any other Google app would be accepted here.
 */
@Service
public class GoogleTokenVerifier {

    private static final Logger log = LoggerFactory.getLogger(GoogleTokenVerifier.class);

    private final AppProperties.Google config;
    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenVerifier(AppProperties props) {
        this.config = props.google();
        if (config.configured()) {
            this.verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(config.clientId()))
                    .build();
        } else {
            this.verifier = null;
            log.warn("Google sign-in is not configured — /api/auth/google will refuse until "
                    + "GOOGLE_CLIENT_ID is set.");
        }
    }

    public boolean isConfigured() {
        return config.configured();
    }

    /** @return the verified claims, never null */
    public GoogleIdToken.Payload verify(String idTokenString) {
        if (!config.configured()) {
            throw new ApiException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "Google sign-in is not switched on yet. Please use your email and password.");
        }
        try {
            GoogleIdToken token = verifier.verify(idTokenString);
            if (token == null) {
                // null means the token failed a check, not that something broke.
                throw ApiException.unauthorized("That Google sign-in could not be verified.");
            }
            GoogleIdToken.Payload payload = token.getPayload();
            if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
                // An unverified Google address could belong to someone else, and
                // accepting it would let a stranger claim their account by email.
                throw ApiException.unauthorized(
                        "That Google account has an unverified email address.");
            }
            return payload;
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Google ID token verification threw", ex);
            throw ApiException.unauthorized("That Google sign-in could not be verified.");
        }
    }
}

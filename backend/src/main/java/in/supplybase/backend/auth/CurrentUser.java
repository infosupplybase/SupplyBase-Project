package in.supplybase.backend.auth;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import in.supplybase.backend.common.ApiException;

/** Reads the signed-in user out of the security context. */
@Component
public class CurrentUser {

    public AuthenticatedUser require() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            throw ApiException.unauthorized("You need to sign in to do that.");
        }
        return user;
    }

    /**
     * Staff may act on anyone's records; a client only on their own.
     * Every endpoint that takes an id someone could tamper with calls this.
     */
    public void requireSelfOrStaff(Long ownerId) {
        AuthenticatedUser user = require();
        if (!user.isStaff() && !user.id().equals(ownerId)) {
            throw ApiException.forbidden("That is not yours to view.");
        }
    }
}

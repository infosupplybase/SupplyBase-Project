package in.supplybase.backend.auth;

import java.security.Principal;

/**
 * What sits in the security context: the few facts a controller needs, with
 * no password hash and no JPA session attached to it.
 */
public record AuthenticatedUser(Long id, String email, Role role) implements Principal {

    @Override
    public String getName() {
        return email;
    }

    /** See User.isStaff — PROFESSIONAL is intentionally excluded. */
    public boolean isStaff() {
        return role == Role.ADMIN;
    }

    public boolean isProfessional() {
        return role == Role.PROFESSIONAL;
    }
}

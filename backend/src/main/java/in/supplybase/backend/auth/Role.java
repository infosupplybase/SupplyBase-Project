package in.supplybase.backend.auth;

public enum Role {
    /** A customer. Sees only their own projects and payments. */
    CLIENT,
    /** Runs projects day to day: stages, documents, raising payments. */
    MANAGER,
    /** Everything a manager can do, plus user administration. */
    ADMIN;

    /** Spring Security expects the ROLE_ prefix on authorities. */
    public String authority() {
        return "ROLE_" + name();
    }
}

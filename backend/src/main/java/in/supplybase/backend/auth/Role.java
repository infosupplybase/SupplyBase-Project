package in.supplybase.backend.auth;

public enum Role {
    /** The person paying. Sees only their own bookings, projects and payments. */
    CUSTOMER,
    /** Does the work: site visits, job updates, work photos. Sees only jobs
     *  assigned to them, and never the commercial side of a booking. */
    PROFESSIONAL,
    /** Runs the business: assignment, quotations, payments, everything. */
    ADMIN;

    /** Spring Security expects the ROLE_ prefix on authorities. */
    public String authority() {
        return "ROLE_" + name();
    }

    /** Anyone who works here, as opposed to a paying customer. */
    public boolean isStaff() {
        return this == ADMIN || this == PROFESSIONAL;
    }
}

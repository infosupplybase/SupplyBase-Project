package in.supplybase.backend.partner;

/**
 * Where a partner stands with SupplyBase. Only an admin moves a partner out
 * of PENDING — see PartnerService.review for the allowed moves.
 */
public enum PartnerStatus {
    /** Applied, waiting for an admin to look at the application. */
    PENDING,
    /** Approved: the account holds the PROFESSIONAL role and can take jobs. */
    APPROVED,
    /** Turned down. The account stays a plain customer account. */
    REJECTED,
    /** Was approved, now stopped. Loses the PROFESSIONAL role until reinstated. */
    SUSPENDED
}

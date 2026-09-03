package in.supplybase.backend.payment;

/** The rendered invoice PDF plus the reference the controller names the download after. */
public record InvoiceFile(String reference, byte[] content) {
}

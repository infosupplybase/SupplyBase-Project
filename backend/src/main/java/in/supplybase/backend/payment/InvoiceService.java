package in.supplybase.backend.payment;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.Money;

/**
 * Builds a plain one-page PDF invoice for a payment. No logo, no multi-page
 * layout — just enough for a client to have a record of what they paid.
 */
@Service
public class InvoiceService {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd MMM yyyy")
            .withZone(ZoneId.of("Asia/Kolkata"));
    private static final float MARGIN = 60f;
    private static final float LEADING = 22f;

    public byte[] generate(Payment payment) {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            PDType1Font heading = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font body = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

            float y = page.getMediaBox().getHeight() - MARGIN;

            try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
                y = writeLine(stream, heading, 20, MARGIN, y, "SupplyBase");
                y -= 6;
                y = writeLine(stream, body, 12, MARGIN, y, "Payment Invoice");
                y -= LEADING;

                y = writeField(stream, heading, body, MARGIN, y, "Reference", payment.getReference());
                y = writeField(stream, heading, body, MARGIN, y, "Date", formatDate(payment));
                y = writeField(stream, heading, body, MARGIN, y, "Description", payment.getDescription());
                if (payment.getProject() != null) {
                    y = writeField(stream, heading, body, MARGIN, y, "Project", payment.getProject().getName());
                }
                // "Rs." rather than "₹": the standard PDF fonts PDFBox
                // ships (WinAnsiEncoding) do not include the rupee sign, and
                // showText throws for a glyph the font cannot encode.
                y = writeField(stream, heading, body, MARGIN, y, "Amount",
                        "Rs. " + Money.formatRupees(payment.getAmountPaise()));
                y = writeField(stream, heading, body, MARGIN, y, "Status", payment.getStatus().name());
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        } catch (IOException ex) {
            throw new ApiException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "We could not generate that invoice. Please try again in a moment.");
        }
    }

    private String formatDate(Payment payment) {
        java.time.Instant when = payment.getPaidAt() != null ? payment.getPaidAt() : payment.getCreatedAt();
        return when == null ? "-" : DATE.format(when);
    }

    private float writeField(PDPageContentStream stream, PDType1Font heading, PDType1Font body,
                             float x, float y, String label, String value) throws IOException {
        writeLine(stream, heading, 11, x, y, label + ":");
        writeLine(stream, body, 11, x + 110, y, value == null ? "-" : value);
        return y - LEADING;
    }

    private float writeLine(PDPageContentStream stream, PDType1Font font, float size,
                            float x, float y, String text) throws IOException {
        stream.beginText();
        stream.setFont(font, size);
        stream.newLineAtOffset(x, y);
        stream.showText(text);
        stream.endText();
        return y;
    }
}

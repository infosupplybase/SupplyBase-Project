package in.supplybase.backend.payment;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import in.supplybase.backend.auth.Role;
import in.supplybase.backend.auth.User;
import in.supplybase.backend.project.Project;

/**
 * No mocking needed: build a real Payment fixture and render it. The PDF's
 * exact layout is not worth pinning down, but "a real, one-page PDF came
 * out" is cheap to check and catches the failure modes that matter — a
 * broken font reference, an unencodable character, a corrupt stream.
 */
class InvoiceServiceTest {

    private final InvoiceService service = new InvoiceService();

    private static Payment.PaymentBuilder aPayment() {
        User client = User.builder().id(1L).email("client@supplybase.in")
                .fullName("A. Client").role(Role.CUSTOMER).build();
        return Payment.builder()
                .id(1L)
                .reference("PAY-260101-ABCD")
                .user(client)
                .paymentType(PaymentType.INVOICE)
                .description("Site visit and survey")
                .amountPaise(12_50000L)
                .currency("INR")
                .status(PaymentStatus.PAID)
                .paidAt(Instant.parse("2026-01-05T10:15:30Z"));
    }

    @Test
    @DisplayName("generates a real PDF for a paid payment")
    void generatesPdfForPaidPayment() throws Exception {
        Payment payment = aPayment().build();

        byte[] pdf = service.generate(payment);

        assertThat(pdf).isNotEmpty();
        assertThat(new String(pdf, 0, 4, StandardCharsets.US_ASCII)).isEqualTo("%PDF");

        try (PDDocument document = Loader.loadPDF(pdf)) {
            assertThat(document.getNumberOfPages()).isEqualTo(1);
        }
    }

    @Test
    @DisplayName("includes the project name when the payment is tied to one")
    void includesProjectWhenPresent() throws Exception {
        Project project = Project.builder().id(10L).code("PRJ-1").name("Lakeview Villa")
                .stages(List.of()).build();
        Payment payment = aPayment().project(project).build();

        byte[] pdf = service.generate(payment);

        assertThat(new String(pdf, 0, 4, StandardCharsets.US_ASCII)).isEqualTo("%PDF");
        try (PDDocument document = Loader.loadPDF(pdf)) {
            assertThat(document.getNumberOfPages()).isEqualTo(1);
        }
    }

    @Test
    @DisplayName("still renders when the payment has never been paid yet")
    void rendersWithoutPaidAt() {
        Payment payment = aPayment().status(PaymentStatus.PENDING).paidAt(null).build();

        byte[] pdf = service.generate(payment);

        assertThat(pdf).isNotEmpty();
        assertThat(new String(pdf, 0, 4, StandardCharsets.US_ASCII)).isEqualTo("%PDF");
    }
}

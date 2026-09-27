package in.supplybase.backend.payment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import in.supplybase.backend.auth.AuthenticatedUser;
import in.supplybase.backend.auth.Role;
import in.supplybase.backend.auth.User;
import in.supplybase.backend.auth.UserRepository;
import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.payment.dto.CreatePaymentRequest;
import in.supplybase.backend.payment.dto.PaymentResponse;
import in.supplybase.backend.payment.dto.RazorpayOrderResponse;
import in.supplybase.backend.payment.dto.VerifyPaymentRequest;
import in.supplybase.backend.project.Project;
import in.supplybase.backend.project.ProjectRepository;
import in.supplybase.backend.project.ProjectStage;

/**
 * Pure-Mockito coverage of the payment lifecycle: raising a payable, opening
 * and confirming Razorpay checkout, applying webhooks, initiating a refund,
 * and rendering an invoice. No database, no real Razorpay call — every
 * collaborator is a mock so the business rules are pinned down in isolation.
 */
@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository payments;
    @Mock
    private PaymentEventRepository events;
    @Mock
    private UserRepository users;
    @Mock
    private ProjectRepository projects;
    @Mock
    private RazorpayService razorpay;
    @Mock
    private InvoiceService invoices;

    private PaymentService service;

    @BeforeEach
    void setUp() {
        service = new PaymentService(payments, events, users, projects, razorpay, invoices);
        // Most tests only care that save happened, not what it returns beyond
        // the entity handed to it — echo the argument back like a real save.
        lenient().when(payments.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private static User user(long id, Role role) {
        return User.builder().id(id).email("user" + id + "@supplybase.in")
                .fullName("Client " + id).role(role).build();
    }

    private static AuthenticatedUser callerFor(User u) {
        return new AuthenticatedUser(u.getId(), u.getEmail(), u.getRole());
    }

    private static Payment.PaymentBuilder aPayment(User owner) {
        return Payment.builder()
                .id(1L)
                .reference("PAY-260101-ABCD")
                .user(owner)
                .paymentType(PaymentType.INVOICE)
                .description("Site visit invoice")
                .amountPaise(10_000_00L)
                .currency("INR")
                .status(PaymentStatus.PENDING);
    }

    /* ------------------------------------------------------------ reads */

    @Nested
    class Reads {

        @Test
        @DisplayName("myPayments maps every row for that user")
        void myPayments() {
            User owner = user(1L, Role.CUSTOMER);
            Payment payment = aPayment(owner).build();
            when(payments.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(payment));

            List<PaymentResponse> result = service.myPayments(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).reference()).isEqualTo("PAY-260101-ABCD");
        }

        @Test
        @DisplayName("listAll pages every payment regardless of owner")
        void listAll() {
            User owner = user(1L, Role.CUSTOMER);
            Payment payment = aPayment(owner).build();
            PageRequest page = PageRequest.of(0, 20);
            when(payments.findAllByOrderByCreatedAtDesc(page)).thenReturn(new PageImpl<>(List.of(payment)));

            Page<PaymentResponse> result = service.listAll(page);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).id()).isEqualTo(1L);
        }
    }

    /* --------------------------------------------------------- creation */

    @Nested
    class Raise {

        @Test
        @DisplayName("raises a plain payment against just a client")
        void raisesAgainstClientOnly() {
            User client = user(5L, Role.CUSTOMER);
            when(users.findById(5L)).thenReturn(Optional.of(client));
            CreatePaymentRequest request = new CreatePaymentRequest(5L, null, null, PaymentType.INVOICE,
                    "Advance for site visit", new BigDecimal("500.00"), null);

            PaymentResponse response = service.raise(request);

            assertThat(response.amount()).isEqualByComparingTo("500.00");
            assertThat(response.paymentType()).isEqualTo(PaymentType.INVOICE);
            verify(payments).save(any(Payment.class));
        }

        @Test
        @DisplayName("raises a milestone payment tied to a project stage")
        void raisesAgainstProjectAndStage() {
            User client = user(5L, Role.CUSTOMER);
            when(users.findById(5L)).thenReturn(Optional.of(client));

            ProjectStage stage = ProjectStage.builder().id(9L).stageNo(1).title("Foundation").build();
            Project project = Project.builder().id(10L).code("PRJ-1").name("Villa build")
                    .stages(List.of(stage)).build();
            when(projects.findById(10L)).thenReturn(Optional.of(project));

            CreatePaymentRequest request = new CreatePaymentRequest(5L, 10L, 9L, PaymentType.MILESTONE,
                    "Foundation milestone", new BigDecimal("50000.00"), null);

            PaymentResponse response = service.raise(request);

            assertThat(response.projectName()).isEqualTo("Villa build");
            ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
            verify(payments).save(captor.capture());
            assertThat(captor.getValue().getStage()).isEqualTo(stage);
        }

        @Test
        @DisplayName("rejects a stage id that does not belong to that project")
        void rejectsStageNotOnProject() {
            User client = user(5L, Role.CUSTOMER);
            when(users.findById(5L)).thenReturn(Optional.of(client));

            ProjectStage otherStage = ProjectStage.builder().id(1L).stageNo(1).title("Foundation").build();
            Project project = Project.builder().id(10L).code("PRJ-1").name("Villa build")
                    .stages(List.of(otherStage)).build();
            when(projects.findById(10L)).thenReturn(Optional.of(project));

            CreatePaymentRequest request = new CreatePaymentRequest(5L, 10L, 999L, PaymentType.MILESTONE,
                    "Bad stage", new BigDecimal("1000.00"), null);

            assertThatThrownBy(() -> service.raise(request))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("not on that project");
        }

        @Test
        @DisplayName("rejects a milestone payment with no project")
        void rejectsMilestoneWithoutProject() {
            User client = user(5L, Role.CUSTOMER);
            when(users.findById(5L)).thenReturn(Optional.of(client));

            CreatePaymentRequest request = new CreatePaymentRequest(5L, null, 9L, PaymentType.MILESTONE,
                    "Floating stage", new BigDecimal("1000.00"), null);

            assertThatThrownBy(() -> service.raise(request))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("needs a project");
        }
    }

    /* ---------------------------------------------------------- checkout */

    @Nested
    class StartCheckout {

        @Test
        @DisplayName("creates a new order when the payment has none yet")
        void createsNewOrder() {
            User owner = user(1L, Role.CUSTOMER);
            Payment payment = aPayment(owner).razorpayOrderId(null).build();
            when(payments.findById(1L)).thenReturn(Optional.of(payment));
            when(razorpay.createOrder(payment.getAmountPaise(), payment.getCurrency(), payment.getReference()))
                    .thenReturn("order_new123");
            when(razorpay.keyId()).thenReturn("rzp_test_key");

            RazorpayOrderResponse response = service.startCheckout(1L, callerFor(owner));

            assertThat(response.orderId()).isEqualTo("order_new123");
            assertThat(response.keyId()).isEqualTo("rzp_test_key");
            assertThat(payment.getRazorpayOrderId()).isEqualTo("order_new123");
            verify(razorpay).createOrder(payment.getAmountPaise(), payment.getCurrency(), payment.getReference());
            verify(payments).save(payment);
        }

        @Test
        @DisplayName("reuses an existing order rather than creating a second one")
        void reusesExistingOrder() {
            User owner = user(1L, Role.CUSTOMER);
            Payment payment = aPayment(owner).razorpayOrderId("order_existing").build();
            when(payments.findById(1L)).thenReturn(Optional.of(payment));
            when(razorpay.keyId()).thenReturn("rzp_test_key");

            RazorpayOrderResponse response = service.startCheckout(1L, callerFor(owner));

            assertThat(response.orderId()).isEqualTo("order_existing");
            verify(razorpay, never()).createOrder(anyLong(), anyString(), anyString());
            verify(payments, never()).save(any());
        }

        @ParameterizedTest
        @ValueSource(strings = { "PAID", "CANCELLED" })
        @DisplayName("refuses to open checkout on a settled or cancelled payment")
        void rejectsSettledOrCancelled(String statusName) {
            User owner = user(1L, Role.CUSTOMER);
            Payment payment = aPayment(owner).status(PaymentStatus.valueOf(statusName)).build();
            when(payments.findById(1L)).thenReturn(Optional.of(payment));

            assertThatThrownBy(() -> service.startCheckout(1L, callerFor(owner)))
                    .isInstanceOf(ApiException.class);
            verify(razorpay, never()).createOrder(anyLong(), anyString(), anyString());
        }

        @Test
        @DisplayName("a customer cannot open checkout on someone else's payment")
        void rejectsNonOwner() {
            User owner = user(1L, Role.CUSTOMER);
            User stranger = user(2L, Role.CUSTOMER);
            Payment payment = aPayment(owner).build();
            when(payments.findById(1L)).thenReturn(Optional.of(payment));

            assertThatThrownBy(() -> service.startCheckout(1L, callerFor(stranger)))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("was not found");
            verify(razorpay, never()).createOrder(anyLong(), anyString(), anyString());
        }

        @Test
        @DisplayName("staff may open checkout on any client's payment")
        void staffMayActOnAnyPayment() {
            User owner = user(1L, Role.CUSTOMER);
            User admin = user(99L, Role.ADMIN);
            Payment payment = aPayment(owner).razorpayOrderId("order_existing").build();
            when(payments.findById(1L)).thenReturn(Optional.of(payment));
            when(razorpay.keyId()).thenReturn("rzp_test_key");

            assertThat(service.startCheckout(1L, callerFor(admin)).orderId()).isEqualTo("order_existing");
        }
    }

    /* ----------------------------------------------------- confirm-from-checkout */

    @Nested
    class ConfirmFromCheckout {

        @Test
        @DisplayName("a verified signature marks the payment paid")
        void validSignatureMarksPaid() {
            User owner = user(1L, Role.CUSTOMER);
            Payment payment = aPayment(owner).build();
            when(payments.findByRazorpayOrderId("order_1")).thenReturn(Optional.of(payment));
            when(razorpay.verifyCheckoutSignature("order_1", "pay_1", "sig_1")).thenReturn(true);

            VerifyPaymentRequest request = new VerifyPaymentRequest("order_1", "pay_1", "sig_1");
            PaymentResponse response = service.confirmFromCheckout(request, callerFor(owner));

            assertThat(response.status()).isEqualTo(PaymentStatus.PAID);
            assertThat(payment.getRazorpayPaymentId()).isEqualTo("pay_1");
            assertThat(payment.getRazorpaySignature()).isEqualTo("sig_1");
            assertThat(payment.getPaidAt()).isNotNull();
            verify(payments).save(payment);
        }

        @Test
        @DisplayName("an unverifiable signature records the failure and refuses")
        void invalidSignatureRecordsFailure() {
            User owner = user(1L, Role.CUSTOMER);
            Payment payment = aPayment(owner).build();
            when(payments.findByRazorpayOrderId("order_1")).thenReturn(Optional.of(payment));
            when(razorpay.verifyCheckoutSignature("order_1", "pay_1", "bad_sig")).thenReturn(false);

            VerifyPaymentRequest request = new VerifyPaymentRequest("order_1", "pay_1", "bad_sig");

            assertThatThrownBy(() -> service.confirmFromCheckout(request, callerFor(owner)))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("could not verify");
            assertThat(payment.getFailureReason()).contains("did not verify");
            assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PENDING);
            verify(payments).save(payment);
        }

        @Test
        @DisplayName("a customer cannot confirm someone else's checkout")
        void rejectsNonOwner() {
            User owner = user(1L, Role.CUSTOMER);
            User stranger = user(2L, Role.CUSTOMER);
            Payment payment = aPayment(owner).build();
            when(payments.findByRazorpayOrderId("order_1")).thenReturn(Optional.of(payment));

            VerifyPaymentRequest request = new VerifyPaymentRequest("order_1", "pay_1", "sig_1");

            assertThatThrownBy(() -> service.confirmFromCheckout(request, callerFor(stranger)))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("was not found");
            verify(razorpay, never()).verifyCheckoutSignature(any(), any(), any());
        }
    }

    /* ----------------------------------------------------------- webhook */

    @Nested
    class Webhook {

        @Test
        @DisplayName("a duplicate event id is ignored outright")
        void duplicateEventIgnored() {
            when(events.existsByRazorpayEventId("evt_1")).thenReturn(true);

            service.recordAndApplyWebhook("evt_1", "payment.captured", "{}", true, "order_1", "pay_1");

            verify(events, never()).save(any());
            verify(payments, never()).findByRazorpayOrderId(any());
        }

        @Test
        @DisplayName("an invalid webhook signature is recorded but never applied")
        void invalidSignatureRecordedNotApplied() {
            when(events.existsByRazorpayEventId("evt_1")).thenReturn(false);

            service.recordAndApplyWebhook("evt_1", "payment.captured", "{}", false, "order_1", "pay_1");

            ArgumentCaptor<PaymentEvent> captor = ArgumentCaptor.forClass(PaymentEvent.class);
            verify(events).save(captor.capture());
            assertThat(captor.getValue().isProcessed()).isFalse();
            assertThat(captor.getValue().getProcessError()).contains("Signature did not verify");
            verify(payments, never()).findByRazorpayOrderId(any());
        }

        @Test
        @DisplayName("payment.captured marks a pending payment paid")
        void paymentCapturedMarksPaid() {
            User owner = user(1L, Role.CUSTOMER);
            Payment payment = aPayment(owner).status(PaymentStatus.PENDING).build();
            when(payments.findByRazorpayOrderId("order_1")).thenReturn(Optional.of(payment));

            service.recordAndApplyWebhook("evt_1", "payment.captured", "{}", true, "order_1", "pay_new");

            assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PAID);
            assertThat(payment.getRazorpayPaymentId()).isEqualTo("pay_new");
            assertThat(payment.getPaidAt()).isNotNull();
            verify(payments).save(payment);

            ArgumentCaptor<PaymentEvent> captor = ArgumentCaptor.forClass(PaymentEvent.class);
            verify(events).save(captor.capture());
            assertThat(captor.getValue().isProcessed()).isTrue();
        }

        @Test
        @DisplayName("order.paid is a no-op on a payment that is already paid")
        void orderPaidDoesNotDoubleFire() {
            User owner = user(1L, Role.CUSTOMER);
            Instant firstPaidAt = Instant.parse("2026-01-01T00:00:00Z");
            Payment payment = aPayment(owner).status(PaymentStatus.PAID)
                    .razorpayPaymentId("pay_old").paidAt(firstPaidAt).build();
            when(payments.findByRazorpayOrderId("order_1")).thenReturn(Optional.of(payment));

            service.recordAndApplyWebhook("evt_2", "order.paid", "{}", true, "order_1", "pay_new");

            // markPaid must not have run a second time: neither field it
            // touches was overwritten with the new event's data.
            assertThat(payment.getRazorpayPaymentId()).isEqualTo("pay_old");
            assertThat(payment.getPaidAt()).isEqualTo(firstPaidAt);
            assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PAID);
        }

        @Test
        @DisplayName("payment.failed flips a pending payment to failed")
        void paymentFailedFlipsPending() {
            User owner = user(1L, Role.CUSTOMER);
            Payment payment = aPayment(owner).status(PaymentStatus.PENDING).build();
            when(payments.findByRazorpayOrderId("order_1")).thenReturn(Optional.of(payment));

            service.recordAndApplyWebhook("evt_1", "payment.failed", "{}", true, "order_1", "pay_1");

            assertThat(payment.getStatus()).isEqualTo(PaymentStatus.FAILED);
            assertThat(payment.getFailureReason()).isNotBlank();
        }

        @Test
        @DisplayName("payment.failed cannot undo a payment that already succeeded")
        void paymentFailedNeverUndoesSuccess() {
            User owner = user(1L, Role.CUSTOMER);
            Payment payment = aPayment(owner).status(PaymentStatus.PAID).build();
            when(payments.findByRazorpayOrderId("order_1")).thenReturn(Optional.of(payment));

            service.recordAndApplyWebhook("evt_1", "payment.failed", "{}", true, "order_1", "pay_1");

            assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PAID);
        }

        @ParameterizedTest
        @ValueSource(strings = { "refund.processed", "refund.created" })
        @DisplayName("a refund event settles the payment as refunded")
        void refundEventMarksRefunded(String eventType) {
            User owner = user(1L, Role.CUSTOMER);
            Payment payment = aPayment(owner).status(PaymentStatus.PAID).build();
            when(payments.findByRazorpayOrderId("order_1")).thenReturn(Optional.of(payment));

            service.recordAndApplyWebhook("evt_1", eventType, "{}", true, "order_1", "pay_1");

            assertThat(payment.getStatus()).isEqualTo(PaymentStatus.REFUNDED);
        }

        @Test
        @DisplayName("an order id that matches nothing is recorded as an error, not thrown")
        void unmatchedOrderRecordsError() {
            when(payments.findByRazorpayOrderId("order_missing")).thenReturn(Optional.empty());

            service.recordAndApplyWebhook("evt_1", "payment.captured", "{}", true, "order_missing", "pay_1");

            ArgumentCaptor<PaymentEvent> captor = ArgumentCaptor.forClass(PaymentEvent.class);
            verify(events).save(captor.capture());
            assertThat(captor.getValue().isProcessed()).isFalse();
            assertThat(captor.getValue().getProcessError()).contains("No payment matches order order_missing");
            verify(payments, never()).save(any());
        }
    }

    /* ----------------------------------------------------------- refund */

    @Nested
    class InitiateRefund {

        @Test
        @DisplayName("a full refund on a paid payment delegates straight to Razorpay")
        void fullRefundSucceeds() {
            User owner = user(1L, Role.CUSTOMER);
            Payment payment = aPayment(owner).status(PaymentStatus.PAID).razorpayPaymentId("pay_1").build();
            when(payments.findById(1L)).thenReturn(Optional.of(payment));
            when(razorpay.refund("pay_1", null)).thenReturn("rfnd_1");

            String refundId = service.initiateRefund(1L, null, callerFor(user(99L, Role.ADMIN)));

            assertThat(refundId).isEqualTo("rfnd_1");
            // The whole point: this method never itself flips the status or saves.
            assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PAID);
            verify(payments, never()).save(any());
        }

        @Test
        @DisplayName("a partial refund within the original amount is passed through")
        void partialRefundSucceeds() {
            User owner = user(1L, Role.CUSTOMER);
            Payment payment = aPayment(owner).status(PaymentStatus.PAID).razorpayPaymentId("pay_1").build();
            when(payments.findById(1L)).thenReturn(Optional.of(payment));
            when(razorpay.refund("pay_1", 500_00L)).thenReturn("rfnd_2");

            String refundId = service.initiateRefund(1L, 500_00L, callerFor(user(99L, Role.ADMIN)));

            assertThat(refundId).isEqualTo("rfnd_2");
            verify(payments, never()).save(any());
        }

        @Test
        @DisplayName("only a paid payment can be refunded")
        void rejectsNonPaid() {
            User owner = user(1L, Role.CUSTOMER);
            Payment payment = aPayment(owner).status(PaymentStatus.PENDING).build();
            when(payments.findById(1L)).thenReturn(Optional.of(payment));

            assertThatThrownBy(() -> service.initiateRefund(1L, null, callerFor(user(99L, Role.ADMIN))))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Only a paid payment");
            verify(razorpay, never()).refund(any(), any());
        }

        @Test
        @DisplayName("a payment with no recorded Razorpay payment id cannot be refunded")
        void rejectsMissingRazorpayPaymentId() {
            User owner = user(1L, Role.CUSTOMER);
            Payment payment = aPayment(owner).status(PaymentStatus.PAID).razorpayPaymentId(null).build();
            when(payments.findById(1L)).thenReturn(Optional.of(payment));

            assertThatThrownBy(() -> service.initiateRefund(1L, null, callerFor(user(99L, Role.ADMIN))))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("no recorded Razorpay payment id");
            verify(razorpay, never()).refund(any(), any());
        }

        @Test
        @DisplayName("a partial refund cannot exceed the original amount")
        void rejectsOversizedPartialRefund() {
            User owner = user(1L, Role.CUSTOMER);
            Payment payment = aPayment(owner).status(PaymentStatus.PAID).razorpayPaymentId("pay_1").build();
            when(payments.findById(1L)).thenReturn(Optional.of(payment));

            long tooMuch = payment.getAmountPaise() + 1;

            assertThatThrownBy(() -> service.initiateRefund(1L, tooMuch, callerFor(user(99L, Role.ADMIN))))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("cannot exceed the original payment");
            verify(razorpay, never()).refund(any(), any());
        }
    }

    /* ---------------------------------------------------------- invoice */

    @Nested
    class GetInvoicePdf {

        @Test
        @DisplayName("a paid payment gets its invoice rendered")
        void paidPaymentSucceeds() {
            User owner = user(1L, Role.CUSTOMER);
            Payment payment = aPayment(owner).status(PaymentStatus.PAID).build();
            when(payments.findById(1L)).thenReturn(Optional.of(payment));
            byte[] pdf = { 1, 2, 3 };
            when(invoices.generate(payment)).thenReturn(pdf);

            InvoiceFile file = service.getInvoicePdf(1L, callerFor(owner));

            assertThat(file.reference()).isEqualTo(payment.getReference());
            assertThat(file.content()).isEqualTo(pdf);
        }

        @Test
        @DisplayName("a refunded payment still counts as settled for invoicing")
        void refundedPaymentSucceeds() {
            User owner = user(1L, Role.CUSTOMER);
            Payment payment = aPayment(owner).status(PaymentStatus.REFUNDED).build();
            when(payments.findById(1L)).thenReturn(Optional.of(payment));
            byte[] pdf = { 4, 5, 6 };
            when(invoices.generate(payment)).thenReturn(pdf);

            InvoiceFile file = service.getInvoicePdf(1L, callerFor(owner));

            assertThat(file.content()).isEqualTo(pdf);
        }

        @ParameterizedTest
        @ValueSource(strings = { "PENDING", "FAILED" })
        @DisplayName("an unsettled payment has no invoice yet")
        void unsettledPaymentRejected(String statusName) {
            User owner = user(1L, Role.CUSTOMER);
            Payment payment = aPayment(owner).status(PaymentStatus.valueOf(statusName)).build();
            when(payments.findById(1L)).thenReturn(Optional.of(payment));

            assertThatThrownBy(() -> service.getInvoicePdf(1L, callerFor(owner)))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("only available once");
            verify(invoices, never()).generate(any());
        }

        @Test
        @DisplayName("a customer cannot fetch someone else's invoice")
        void rejectsNonOwner() {
            User owner = user(1L, Role.CUSTOMER);
            User stranger = user(2L, Role.CUSTOMER);
            Payment payment = aPayment(owner).status(PaymentStatus.PAID).build();
            when(payments.findById(1L)).thenReturn(Optional.of(payment));

            assertThatThrownBy(() -> service.getInvoicePdf(1L, callerFor(stranger)))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("was not found");
            verify(invoices, never()).generate(any());
        }
    }
}

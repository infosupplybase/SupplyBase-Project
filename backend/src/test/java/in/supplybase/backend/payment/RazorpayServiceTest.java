package in.supplybase.backend.payment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.concurrent.atomic.AtomicReference;

import org.json.JSONObject;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import com.razorpay.Order;
import com.razorpay.OrderClient;
import com.razorpay.PaymentClient;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Refund;

import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.config.AppProperties;

/**
 * RazorpayService wraps a real SDK client built lazily inside the class
 * itself (clientOrCreate()), so there is no constructor seam to inject a
 * mock through. Two techniques are used here instead, and both stop short of
 * ever touching the network:
 *
 * 1. The "not configured" guard (requireConfigured) is exercised with a real
 *    RazorpayService built on empty keys — every network-facing method must
 *    refuse before it ever tries to build a client.
 * 2. For the request-building logic in createOrder/refund, the private
 *    `AtomicReference<RazorpayClient> client` field is seeded — via
 *    ReflectionTestUtils, reaching into the AtomicReference Spring already
 *    constructed rather than fighting to replace a private final field
 *    itself — with a Mockito mock of RazorpayClient whose public `orders`/
 *    `payments` fields are, in turn, mocked OrderClient/PaymentClient
 *    instances. clientOrCreate() then finds a non-null client already
 *    present and returns it without ever constructing a real one, which is
 *    exactly the seam this class doesn't otherwise offer for testing.
 */
class RazorpayServiceTest {

    private static AppProperties.Razorpay configured() {
        return new AppProperties.Razorpay("rzp_test_key123", "rzp_test_secret", "whsec_test", "INR");
    }

    private static AppProperties.Razorpay unconfigured() {
        return new AppProperties.Razorpay("", "", "", "INR");
    }

    /** Seeds the lazily-built client with a mock so no network call is possible. */
    @SuppressWarnings("unchecked")
    private static RazorpayClient injectMockClient(RazorpayService service) {
        RazorpayClient mockClient = mock(RazorpayClient.class);
        mockClient.orders = mock(OrderClient.class);
        mockClient.payments = mock(PaymentClient.class);
        AtomicReference<RazorpayClient> ref =
                (AtomicReference<RazorpayClient>) ReflectionTestUtils.getField(service, "client");
        ref.set(mockClient);
        return mockClient;
    }

    @Nested
    @DisplayName("when Razorpay is not configured")
    class Unconfigured {

        private final RazorpayService service = new RazorpayService(
                new AppProperties(null, null, unconfigured(), null, null, null, null, null, null));

        @Test
        @DisplayName("isConfigured reports false")
        void isConfiguredFalse() {
            assertThat(service.isConfigured()).isFalse();
        }

        @Test
        @DisplayName("createOrder refuses before touching the network")
        void createOrderRefuses() {
            assertThatThrownBy(() -> service.createOrder(1000L, "INR", "REF-1"))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getStatus())
                            .isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
        }

        @Test
        @DisplayName("verifyCheckoutSignature refuses before touching the network")
        void verifyCheckoutSignatureRefuses() {
            assertThatThrownBy(() -> service.verifyCheckoutSignature("order_1", "pay_1", "sig_1"))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getStatus())
                            .isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
        }

        @Test
        @DisplayName("refund refuses before touching the network")
        void refundRefuses() {
            assertThatThrownBy(() -> service.refund("pay_1", null))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getStatus())
                            .isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
        }
    }

    @Nested
    @DisplayName("webhook signature with no secret configured")
    class MissingWebhookSecret {

        @Test
        @DisplayName("returns false instead of throwing")
        void returnsFalseNotThrows() {
            AppProperties.Razorpay noWebhookSecret =
                    new AppProperties.Razorpay("rzp_test_key123", "rzp_test_secret", null, "INR");
            RazorpayService service = new RazorpayService(
                    new AppProperties(null, null, noWebhookSecret, null, null, null, null, null, null));

            boolean result = service.verifyWebhookSignature("{}", "some-signature");

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("a blank secret is treated the same as a missing one")
        void blankSecretAlsoRefuses() {
            AppProperties.Razorpay blankWebhookSecret =
                    new AppProperties.Razorpay("rzp_test_key123", "rzp_test_secret", "   ", "INR");
            RazorpayService service = new RazorpayService(
                    new AppProperties(null, null, blankWebhookSecret, null, null, null, null, null, null));

            assertThat(service.verifyWebhookSignature("{}", "some-signature")).isFalse();
        }
    }

    @Nested
    @DisplayName("request building against an injected client mock")
    class WithInjectedClient {

        private final RazorpayService service = new RazorpayService(
                new AppProperties(null, null, configured(), null, null, null, null, null, null));

        @Test
        @DisplayName("keyId exposes the public key")
        void keyIdExposed() {
            assertThat(service.keyId()).isEqualTo("rzp_test_key123");
        }

        @Test
        @DisplayName("createOrder builds the right request and returns the order id")
        void createOrderBuildsRequest() throws RazorpayException {
            RazorpayClient mockClient = injectMockClient(service);
            Order order = new Order(new JSONObject().put("id", "order_abc123"));
            when(mockClient.orders.create(any(JSONObject.class))).thenReturn(order);

            String orderId = service.createOrder(150000L, "INR", "PAY-260101-ABCD");

            assertThat(orderId).isEqualTo("order_abc123");
            ArgumentCaptor<JSONObject> captor = ArgumentCaptor.forClass(JSONObject.class);
            verify(mockClient.orders).create(captor.capture());
            JSONObject sent = captor.getValue();
            assertThat(sent.getLong("amount")).isEqualTo(150000L);
            assertThat(sent.getString("currency")).isEqualTo("INR");
            assertThat(sent.getString("receipt")).isEqualTo("PAY-260101-ABCD");
            // Auto-capture, or the money is only authorised and silently
            // reverses after a few days.
            assertThat(sent.getInt("payment_capture")).isEqualTo(1);
        }

        @Test
        @DisplayName("createOrder falls back to the configured currency when none is given")
        void createOrderDefaultsCurrency() throws RazorpayException {
            RazorpayClient mockClient = injectMockClient(service);
            Order order = new Order(new JSONObject().put("id", "order_xyz"));
            when(mockClient.orders.create(any(JSONObject.class))).thenReturn(order);

            service.createOrder(1000L, null, "REF-2");

            ArgumentCaptor<JSONObject> captor = ArgumentCaptor.forClass(JSONObject.class);
            verify(mockClient.orders).create(captor.capture());
            assertThat(captor.getValue().getString("currency")).isEqualTo("INR");
        }

        @Test
        @DisplayName("a failure from the SDK becomes a clean bad-gateway ApiException")
        void createOrderWrapsSdkFailure() throws RazorpayException {
            RazorpayClient mockClient = injectMockClient(service);
            when(mockClient.orders.create(any(JSONObject.class)))
                    .thenThrow(new RazorpayException("boom"));

            assertThatThrownBy(() -> service.createOrder(1000L, "INR", "REF-3"))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getStatus())
                            .isEqualTo(HttpStatus.BAD_GATEWAY));
        }

        @Test
        @DisplayName("refund omits the amount for a full refund")
        void fullRefundOmitsAmount() throws RazorpayException {
            RazorpayClient mockClient = injectMockClient(service);
            Refund refund = new Refund(new JSONObject().put("id", "rfnd_1"));
            when(mockClient.payments.refund(any(String.class), any(JSONObject.class))).thenReturn(refund);

            String refundId = service.refund("pay_1", null);

            assertThat(refundId).isEqualTo("rfnd_1");
            ArgumentCaptor<JSONObject> captor = ArgumentCaptor.forClass(JSONObject.class);
            verify(mockClient.payments).refund(org.mockito.ArgumentMatchers.eq("pay_1"), captor.capture());
            assertThat(captor.getValue().has("amount")).isFalse();
        }

        @Test
        @DisplayName("refund carries the amount for a partial refund")
        void partialRefundIncludesAmount() throws RazorpayException {
            RazorpayClient mockClient = injectMockClient(service);
            Refund refund = new Refund(new JSONObject().put("id", "rfnd_2"));
            when(mockClient.payments.refund(any(String.class), any(JSONObject.class))).thenReturn(refund);

            String refundId = service.refund("pay_1", 5000L);

            assertThat(refundId).isEqualTo("rfnd_2");
            ArgumentCaptor<JSONObject> captor = ArgumentCaptor.forClass(JSONObject.class);
            verify(mockClient.payments).refund(org.mockito.ArgumentMatchers.eq("pay_1"), captor.capture());
            assertThat(captor.getValue().getLong("amount")).isEqualTo(5000L);
        }

        @Test
        @DisplayName("a refund failure from the SDK becomes a clean bad-gateway ApiException")
        void refundWrapsSdkFailure() throws RazorpayException {
            RazorpayClient mockClient = injectMockClient(service);
            when(mockClient.payments.refund(any(String.class), any(JSONObject.class)))
                    .thenThrow(new RazorpayException("boom"));

            assertThatThrownBy(() -> service.refund("pay_1", null))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getStatus())
                            .isEqualTo(HttpStatus.BAD_GATEWAY));
        }

        @Test
        @DisplayName("verifyCheckoutSignature returns false rather than throwing on a bad signature")
        void verifyCheckoutSignatureFalseOnMismatch() {
            // No client needed: signature verification is pure HMAC math over
            // the configured secret, never a network call.
            boolean result = service.verifyCheckoutSignature("order_1", "pay_1", "not-a-real-signature");
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("an injected client is reused rather than rebuilt")
        void reusesInjectedClient() throws RazorpayException {
            RazorpayClient mockClient = injectMockClient(service);
            Order order = new Order(new JSONObject().put("id", "order_1"));
            when(mockClient.orders.create(any(JSONObject.class))).thenReturn(order);

            service.createOrder(1000L, "INR", "REF-4");
            service.createOrder(1000L, "INR", "REF-5");

            verify(mockClient.orders, org.mockito.Mockito.times(2)).create(any(JSONObject.class));
            verify(mockClient, never()).addHeaders(any());
        }
    }
}

package in.supplybase.backend.payment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;

import tools.jackson.databind.json.JsonMapper;

class RazorpayWebhookControllerTest {

    private RazorpayService razorpay;
    private PaymentService payments;
    private RazorpayWebhookController controller;

    @BeforeEach
    void setUp() {
        razorpay = mock(RazorpayService.class);
        payments = mock(PaymentService.class);
        controller = new RazorpayWebhookController(razorpay, payments, JsonMapper.builder().build());
    }

    private static MockHttpServletRequest post(byte[] body) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/payments/webhook");
        request.setContentType("application/json");
        request.setContent(body);
        return request;
    }

    @Test
    @DisplayName("a normal-sized event is read and handed on with its exact body")
    void normalEvent() throws Exception {
        String body = "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":"
                + "{\"id\":\"pay_1\",\"order_id\":\"order_1\"}}}}";
        when(razorpay.verifyWebhookSignature(body, "sig")).thenReturn(true);

        var response = controller.receive(post(body.getBytes(StandardCharsets.UTF_8)), "sig", "evt_1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(payments).recordAndApplyWebhook("evt_1", "payment.captured", body, true,
                "order_1", "pay_1", null);
    }

    @Test
    @DisplayName("a body over the cap is refused with 413 and never stored")
    void oversizedBodyRefused() throws Exception {
        byte[] big = new byte[RazorpayWebhookController.MAX_BODY_BYTES + 1];
        java.util.Arrays.fill(big, (byte) 'a');

        var response = controller.receive(post(big), null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONTENT_TOO_LARGE);
        verify(payments, never()).recordAndApplyWebhook(any(), anyString(), anyString(), anyBoolean(),
                any(), any(), any());
        verify(razorpay, never()).verifyWebhookSignature(anyString(), eq("x"));
    }
}

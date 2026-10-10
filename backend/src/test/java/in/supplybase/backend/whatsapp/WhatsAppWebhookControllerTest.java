package in.supplybase.backend.whatsapp;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;

class WhatsAppWebhookControllerTest {

    private static final String TOKEN = "test-verify-token";
    private static final String SECRET = "test-app-secret";
    private static final byte[] BODY =
            "{\"object\":\"whatsapp_business_account\",\"entry\":[]}".getBytes(StandardCharsets.UTF_8);

    private final WhatsAppWebhookController controller = new WhatsAppWebhookController(TOKEN, SECRET);

    private static MockHttpServletRequest post(byte[] body) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/whatsapp/webhook");
        request.setContentType("application/json");
        request.setContent(body);
        return request;
    }

    private static String sign(byte[] body, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return "sha256=" + HexFormat.of().formatHex(mac.doFinal(body));
    }

    @Test
    @DisplayName("the handshake echoes the challenge when the token matches")
    void handshakeOk() {
        var response = controller.verify("subscribe", TOKEN, "12345");
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo("12345");
    }

    @Test
    @DisplayName("the handshake is refused with a wrong token, a wrong mode, or no token configured")
    void handshakeRefused() {
        assertThat(controller.verify("subscribe", "wrong", "1").getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(controller.verify("unsubscribe", TOKEN, "1").getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(controller.verify("subscribe", null, "1").getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        var unset = new WhatsAppWebhookController("", SECRET);
        assertThat(unset.verify("subscribe", "", "1").getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("an event signed with the app secret is accepted")
    void signedEventAccepted() throws Exception {
        var response = controller.receive(post(BODY), sign(BODY, SECRET));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("unsigned, wrongly signed, malformed or tampered events are refused")
    void badSignaturesRefused() throws Exception {
        assertThat(controller.receive(post(BODY), null).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(controller.receive(post(BODY), sign(BODY, "other")).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(controller.receive(post(BODY), "sha256=not-hex").getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(controller.receive(post(BODY), sign(BODY, SECRET).substring(7)).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
        byte[] tampered = "{\"object\":\"other\"}".getBytes(StandardCharsets.UTF_8);
        assertThat(controller.receive(post(tampered), sign(BODY, SECRET)).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("with no app secret configured, even a correctly formed signature is refused")
    void noSecretRefuses() throws Exception {
        var unset = new WhatsAppWebhookController(TOKEN, "");
        assertThat(unset.receive(post(BODY), sign(BODY, SECRET)).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("a body over the cap is refused with 413")
    void oversizedBodyRefused() throws Exception {
        byte[] big = new byte[WhatsAppWebhookController.MAX_BODY_BYTES + 1];
        java.util.Arrays.fill(big, (byte) 'a');
        assertThat(controller.receive(post(big), sign(big, SECRET)).getStatusCode())
                .isEqualTo(HttpStatus.CONTENT_TOO_LARGE);
    }
}

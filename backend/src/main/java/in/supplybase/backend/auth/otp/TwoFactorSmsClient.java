package in.supplybase.backend.auth.otp;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Sends a login code by SMS through 2Factor.in.
 *
 * The API key comes only from TWOFACTOR_API_KEY in the server's backend/.env.
 * The repository is public, so the key is never written in code, and the
 * request URL (which carries the key) is never logged.
 *
 * 2Factor call: GET https://2factor.in/API/V1/{key}/SMS/{91XXXXXXXXXX}/{code}[/{template}]
 * answers {"Status":"Success","Details":"<session id>"} or {"Status":"Error",...}.
 * TWOFACTOR_OTP_TEMPLATE optionally names an SMS template approved in the
 * 2Factor dashboard; blank uses 2Factor's default OTP message.
 */
@Component
public class TwoFactorSmsClient implements OtpSender {

    private static final Logger log = LoggerFactory.getLogger(TwoFactorSmsClient.class);
    private static final String BASE = "https://2factor.in/API/V1/";

    private final String apiKey;
    private final String template;
    private final ObjectMapper json = new ObjectMapper();
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public TwoFactorSmsClient(@Value("${TWOFACTOR_API_KEY:}") String apiKey,
                              @Value("${TWOFACTOR_OTP_TEMPLATE:}") String template) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.template = template == null ? "" : template.trim();
    }

    @Override
    public boolean configured() {
        return !apiKey.isEmpty();
    }

    @Override
    public boolean send(String nationalPhone, String code) {
        if (!configured()) {
            return false;
        }
        String url = BASE + enc(apiKey) + "/SMS/91" + enc(nationalPhone) + "/" + enc(code)
                + (template.isEmpty() ? "" : "/" + enc(template));
        try {
            HttpResponse<String> response = http.send(
                    HttpRequest.newBuilder(URI.create(url))
                            .timeout(Duration.ofSeconds(15))
                            .GET()
                            .build(),
                    HttpResponse.BodyHandlers.ofString());
            JsonNode body = json.readTree(response.body());
            if (response.statusCode() == 200 && "Success".equalsIgnoreCase(body.path("Status").asText())) {
                return true;
            }
            // Details is 2Factor's error text (e.g. "Invalid API Key"); it never contains the key.
            log.warn("2Factor did not send the OTP: HTTP {} {}", response.statusCode(),
                    body.path("Details").asText(""));
            return false;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            log.warn("2Factor OTP request interrupted");
            return false;
        } catch (Exception ex) {
            // Only the exception type: some HTTP errors echo the request URL, which holds the key.
            log.warn("2Factor OTP request failed: {}", ex.getClass().getSimpleName());
            return false;
        }
    }

    private static String enc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }
}

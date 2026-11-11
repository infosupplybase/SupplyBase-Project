package in.supplybase.backend.chatbot;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;

import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.InMemoryRateLimiter;

class ChatbotControllerTest {

    private ChatbotService service;
    private ChatbotController controller;

    @BeforeEach
    void setUp() {
        service = mock(ChatbotService.class);
        when(service.chat(any(), any()))
                .thenReturn(new ChatbotService.ChatResult("token", "Hello", false, "AI"));
        controller = new ChatbotController(service, new InMemoryRateLimiter());
    }

    private static MockHttpServletRequest from(String ip) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(ip);
        return request;
    }

    @Test
    void oneAddressIsCappedButOthersStillChat() {
        ChatRequest message = new ChatRequest("What does painting cost?", null);
        for (int i = 0; i < ChatbotController.MAX_MESSAGES_PER_WINDOW; i++) {
            assertThat(controller.chat(message, from("203.0.113.5")).getStatusCode().value()).isEqualTo(200);
        }

        assertThatThrownBy(() -> controller.chat(message, from("203.0.113.5")))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getStatus())
                .isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        verify(service, times(ChatbotController.MAX_MESSAGES_PER_WINDOW)).chat(any(), any());

        assertThat(controller.chat(message, from("198.51.100.7")).getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void emptyMessagesDoNotUseUpTheLimit() {
        for (int i = 0; i < ChatbotController.MAX_MESSAGES_PER_WINDOW + 5; i++) {
            assertThat(controller.chat(new ChatRequest("  ", null), from("203.0.113.9"))
                    .getStatusCode().value()).isEqualTo(400);
        }
        assertThat(controller.chat(new ChatRequest("Hi", null), from("203.0.113.9"))
                .getStatusCode().value()).isEqualTo(200);
    }
}

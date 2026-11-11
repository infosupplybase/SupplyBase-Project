package in.supplybase.backend.chatbot;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import in.supplybase.backend.common.ApiException;
import in.supplybase.backend.common.InMemoryRateLimiter;
import jakarta.servlet.http.HttpServletRequest;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    private static final int MAX_MESSAGE_LENGTH = 1000;

    /*
     * The chat URL is public and every message can be a paid AI call and a
     * stored row, so one address gets a generous but finite number of
     * messages: plenty for a real conversation, not enough to run up the
     * AI bill or fill the database.
     */
    static final int MAX_MESSAGES_PER_WINDOW = 30;
    static final Duration MESSAGE_WINDOW = Duration.ofMinutes(10);

    private final ChatbotService chatbotService;
    private final InMemoryRateLimiter rateLimiter;

    public ChatbotController(ChatbotService chatbotService, InMemoryRateLimiter rateLimiter) {
        this.chatbotService = chatbotService;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(
            @RequestBody ChatRequest request,
            HttpServletRequest httpRequest
    ) {

        if (request.message() == null
                || request.message().isBlank()) {

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            "Message cannot be empty"
                    ));
        }

        if (request.message().length() > MAX_MESSAGE_LENGTH) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            "Please keep your message under "
                                    + MAX_MESSAGE_LENGTH + " characters"
                    ));
        }

        String clientIp = httpRequest.getRemoteAddr();
        if (!rateLimiter.tryAcquire("chatbot:" + (clientIp == null ? "unknown" : clientIp),
                MAX_MESSAGES_PER_WINDOW, MESSAGE_WINDOW)) {
            throw ApiException.tooManyRequests("You have sent a lot of messages in a short time."
                    + " Please wait a few minutes, or call us on +91 91373 06446.");
        }

        ChatbotService.ChatResult result =
                chatbotService.chat(
                        request.message(),
                        request.conversationToken()
                );

        return ResponseEntity.ok(result);
    }

    @GetMapping("/conversations/{token}")
    public ResponseEntity<?> conversation(
            @PathVariable String token
    ) {
        ChatbotConversation conversation =
                chatbotService.getConversation(token);

        return ResponseEntity.ok(conversation);
    }
}
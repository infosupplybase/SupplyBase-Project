package in.supplybase.backend.chatbot;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    private static final int MAX_MESSAGE_LENGTH = 1000;

    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(
            @RequestBody ChatRequest request
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

        ChatbotService.ChatResult result =
                chatbotService.chat(
                        request.message(),
                        request.conversationToken(),
                        request.page()
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
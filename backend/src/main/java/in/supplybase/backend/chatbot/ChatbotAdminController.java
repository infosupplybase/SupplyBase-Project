package in.supplybase.backend.chatbot;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/chatbot")
public class ChatbotAdminController {

    private final ChatbotAdminService chatbotAdminService;

    public ChatbotAdminController(
            ChatbotAdminService chatbotAdminService
    ) {
        this.chatbotAdminService = chatbotAdminService;
    }

    @GetMapping("/conversations")
    public ResponseEntity<?> conversations(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {

        ChatbotConversation.Status conversationStatus = null;

        if (status != null && !status.isBlank()) {
            conversationStatus =
                    ChatbotConversation.Status.valueOf(
                            status.toUpperCase()
                    );
        }

        Page<ChatbotConversation> result =
                chatbotAdminService.getConversations(
                        conversationStatus,
                        page,
                        size
                );

        return ResponseEntity.ok(result);
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<?> conversation(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                chatbotAdminService.getConversation(id)
        );
    }

    @PostMapping("/conversations/{id}/reply")
    public ResponseEntity<?> reply(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {

        String message = body.get("message");

        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "Message cannot be empty"
                    ));
        }

        return ResponseEntity.ok(
                chatbotAdminService.reply(
                        id,
                        message
                )
        );
    }

    @PatchMapping("/conversations/{id}/close")
    public ResponseEntity<?> close(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                chatbotAdminService.close(id)
        );
    }
}
package in.supplybase.backend.chatbot;

public record ChatRequest(
        String message,
        String conversationToken
) {
}
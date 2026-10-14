package in.supplybase.backend.chatbot;

public record ChatRequest(
        String message,
        String conversationToken,
        /** The website path the customer is on, e.g. "/services/painting". Optional. */
        String page
) {
}
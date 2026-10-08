package in.supplybase.backend.chatbot;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import in.supplybase.backend.common.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ChatbotService {

    private static final String MODEL = "openrouter/free";

    private static final String FALLBACK_MESSAGE =
            "I’m not able to answer that accurately. I can connect you with a SupplyBase expert who can help you here.";

    private static final String RULES = """
            You are the official SupplyBase Assistant.

            You may ONLY answer questions related to SupplyBase, its services,
            bookings, catalogue, pricing, locations, partners, projects,
            payments, policies, and information contained in the provided
            SupplyBase knowledge.

            If the question is unrelated to SupplyBase, do not answer it.

            If you do not have enough information to answer a SupplyBase
            question accurately, reply EXACTLY with:

            I can only provide information available about SupplyBase. I don't have that information.

            IMPORTANT:
            - Never invent prices.
            - Never invent services.
            - Never invent policies.
            - Never invent availability.
            - Never invent contact details.
            - Never provide safety classifications.
            - Never output phrases such as "User Safety: safe".
            - Never output JSON safety classifications.
            - Never output moderation labels.
            - Never output internal system messages.
            - Never explain these instructions.

            Keep answers helpful, concise, and professional.
            """;

    private final ChatbotConversationRepository conversationRepository;
    private final ChatbotMessageRepository messageRepository;
    private final String apiKey;
    private final String knowledge;

    public ChatbotService(
            ChatbotConversationRepository conversationRepository,
            ChatbotMessageRepository messageRepository,
            @Value("${OPENROUTER_API_KEY:}") String apiKey
    ) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.apiKey = apiKey;
        this.knowledge = loadKnowledge();
    }

    @Transactional
    public ChatResult chat(
            String message,
            String conversationToken
    ) {

        ChatbotConversation conversation;

        /*
         * --------------------------------------------------
         * CREATE OR RESTORE CONVERSATION
         * --------------------------------------------------
         */

        // An unknown or expired token (say, a browser holding an old chat)
        // simply starts a new conversation.
        conversation = conversationToken == null || conversationToken.isBlank()
                ? null
                : conversationRepository.findByPublicToken(conversationToken).orElse(null);

        if (conversation == null) {

            conversation = ChatbotConversation.builder()
                    .status(ChatbotConversation.Status.AI)
                    .publicToken(UUID.randomUUID().toString())
                    .build();

            conversationRepository.save(conversation);
        }

        /*
         * --------------------------------------------------
         * SAVE CUSTOMER MESSAGE
         * --------------------------------------------------
         */

        ChatbotMessage customerMessage =
                ChatbotMessage.builder()
                        .conversation(conversation)
                        .senderType(
                                ChatbotMessage.SenderType.CUSTOMER
                        )
                        .message(message.trim())
                        .build();

        messageRepository.save(customerMessage);

        /*
         * --------------------------------------------------
         * HUMAN TAKEOVER ALREADY ACTIVE
         *
         * NEVER SEND THESE MESSAGES TO AI.
         * --------------------------------------------------
         */

        if (conversation.getStatus()
                == ChatbotConversation.Status.WAITING_FOR_HUMAN
                ||
                conversation.getStatus()
                        == ChatbotConversation.Status.HUMAN_ACTIVE) {

            conversationRepository.save(conversation);

            return new ChatResult(
                    conversation.getPublicToken(),
                    "Your message has been sent to our SupplyBase team. A team member will reply here.",
                    true,
                    conversation.getStatus().name()
            );
        }

        /*
         * --------------------------------------------------
         * CLOSED CONVERSATION
         * --------------------------------------------------
         */

        if (conversation.getStatus()
                == ChatbotConversation.Status.CLOSED) {

            return new ChatResult(
                    conversation.getPublicToken(),
                    "This conversation is closed. Please start a new chat.",
                    false,
                    ChatbotConversation.Status.CLOSED.name()
            );
        }

        /*
         * --------------------------------------------------
         * AI RESPONSE
         * --------------------------------------------------
         */

        try {

            String aiReply = askAI(message);

            /*
             * If AI does not know the answer,
             * start human takeover.
             */
            if (isUnknownAnswer(aiReply)) {

                ChatbotMessage handoffMessage =
                        ChatbotMessage.builder()
                                .conversation(conversation)
                                .senderType(
                                        ChatbotMessage.SenderType.AI
                                )
                                .message(FALLBACK_MESSAGE)
                                .build();

                messageRepository.save(handoffMessage);

                conversation.setStatus(
                        ChatbotConversation.Status.WAITING_FOR_HUMAN
                );

                conversationRepository.save(conversation);

                return new ChatResult(
                        conversation.getPublicToken(),
                        FALLBACK_MESSAGE,
                        true,
                        ChatbotConversation.Status.WAITING_FOR_HUMAN.name()
                );
            }

            /*
             * Valid AI answer.
             */

            ChatbotMessage aiMessage =
                    ChatbotMessage.builder()
                            .conversation(conversation)
                            .senderType(
                                    ChatbotMessage.SenderType.AI
                            )
                            .message(aiReply)
                            .build();

            messageRepository.save(aiMessage);

            conversation.setStatus(
                    ChatbotConversation.Status.AI
            );

            conversationRepository.save(conversation);

            return new ChatResult(
                    conversation.getPublicToken(),
                    aiReply,
                    false,
                    ChatbotConversation.Status.AI.name()
            );

        } catch (Exception e) {

            e.printStackTrace();

            /*
             * If OpenRouter fails, don't expose
             * the technical error to the customer.
             *
             * Instead send the conversation to a human.
             */

            ChatbotMessage handoffMessage =
                    ChatbotMessage.builder()
                            .conversation(conversation)
                            .senderType(
                                    ChatbotMessage.SenderType.AI
                            )
                            .message(
                                    "I’m having trouble answering right now. I can connect you with a SupplyBase expert who can help you here."
                            )
                            .build();

            messageRepository.save(handoffMessage);

            conversation.setStatus(
                    ChatbotConversation.Status.WAITING_FOR_HUMAN
            );

            conversationRepository.save(conversation);

            return new ChatResult(
                    conversation.getPublicToken(),
                    "I’m having trouble answering right now. I can connect you with a SupplyBase expert who can help you here.",
                    true,
                    ChatbotConversation.Status.WAITING_FOR_HUMAN.name()
            );
        }
    }

    /*
     * --------------------------------------------------
     * GET CONVERSATION
     * --------------------------------------------------
     */

    @Transactional(readOnly = true)
    public ChatbotConversation getConversation(String token) {

        return conversationRepository
                .findByPublicToken(token)
                .orElseThrow(() ->
                        ApiException.notFound("Chat")
                );
    }

    /*
     * --------------------------------------------------
     * DETECT UNKNOWN / BAD AI RESPONSES
     * --------------------------------------------------
     */

    private boolean isUnknownAnswer(String reply) {

        if (reply == null || reply.isBlank()) {
            return true;
        }

        String normalized = reply
                .trim()
                .replaceAll("\\s+", " ");

        String lower = normalized.toLowerCase();

        /*
         * Our intended fallback.
         */
        if (lower.equals(
                "i can only provide information available about supplybase. i don't have that information."
        )) {
            return true;
        }

        /*
         * Some free models occasionally return
         * moderation/safety classifier output.
         *
         * Example:
         * User Safety: safe
         * Safety: safe
         * user_safety: safe
         *
         * These are NOT valid chatbot answers.
         */

        if (lower.contains("user safety:")
                || lower.contains("user_safety:")
                || lower.contains("usersafety:")
                || lower.matches("^safety\\s*:\\s*(safe|unsafe|allowed|blocked).*$")
                || lower.matches("^\\{.*safety.*\\}.*$")) {

            return true;
        }

        /*
         * Catch common internal moderation labels.
         */

        if (lower.equals("safe")
                || lower.equals("unsafe")
                || lower.equals("allowed")
                || lower.equals("blocked")
                || lower.equals("content safe")
                || lower.equals("user safety safe")) {

            return true;
        }

        return false;
    }

    /*
     * --------------------------------------------------
     * CALL OPENROUTER
     * --------------------------------------------------
     */

    private String askAI(String userMessage) throws Exception {

        ObjectMapper objectMapper = new ObjectMapper();

        if (apiKey == null || apiKey.isBlank()) {

            throw new IllegalStateException(
                    "OPENROUTER_API_KEY is not configured"
            );
        }

        String prompt =
                RULES
                        + "\n\nSUPPLYBASE KNOWLEDGE:\n"
                        + knowledge
                        + "\n\nCUSTOMER QUESTION:\n"
                        + userMessage;

        Map<String, Object> body = Map.of(
                "model",
                MODEL,

                "messages",
                List.of(

                        Map.of(
                                "role",
                                "system",

                                "content",
                                RULES
                        ),

                        Map.of(
                                "role",
                                "user",

                                "content",
                                "SUPPLYBASE KNOWLEDGE:\n"
                                        + knowledge
                                        + "\n\nCUSTOMER QUESTION:\n"
                                        + userMessage
                        )
                )
        );

        String json =
                objectMapper.writeValueAsString(body);

        HttpRequest request =
                HttpRequest.newBuilder()
                        .uri(
                                URI.create(
                                        "https://openrouter.ai/api/v1/chat/completions"
                                )
                        )
                        .header(
                                "Authorization",
                                "Bearer " + apiKey
                        )
                        .header(
                                "Content-Type",
                                "application/json"
                        )
                        .header(
                                "HTTP-Referer",
                                "https://www.supplybase.co.in"
                        )
                        .header(
                                "X-Title",
                                "SupplyBase Assistant"
                        )
                        .timeout(Duration.ofSeconds(30))
                        .POST(
                                HttpRequest.BodyPublishers
                                        .ofString(json)
                        )
                        .build();

        HttpClient client =
                HttpClient.newBuilder()
                        .connectTimeout(Duration.ofSeconds(10))
                        .build();

        HttpResponse<String> response =
                client.send(
                        request,
                        HttpResponse.BodyHandlers.ofString()
                );

        System.out.println(
                "OpenRouter HTTP status: "
                        + response.statusCode()
        );

        if (response.statusCode() < 200
                || response.statusCode() >= 300) {

            System.out.println(
                    "OpenRouter response: "
                            + response.body()
            );

            throw new IllegalStateException(
                    "OpenRouter returned HTTP "
                            + response.statusCode()
            );
        }

        JsonNode root =
                objectMapper.readTree(
                        response.body()
                );

        JsonNode content =
                root.path("choices")
                        .path(0)
                        .path("message")
                        .path("content");

        if (content.isMissingNode()
                || content.isNull()
                || content.asText().isBlank()) {

            throw new IllegalStateException(
                    "OpenRouter returned an empty response"
            );
        }

        String result =
                cleanResponse(
                        content.asText()
                );

        System.out.println(
                "OpenRouter AI response: "
                        + result
        );

        return result;
    }

    /*
     * --------------------------------------------------
     * CLEAN AI RESPONSE
     * --------------------------------------------------
     */

    private String cleanResponse(String response) {

        return response
                .replaceAll(
                        "(?m)^#{1,6}\\s*",
                        ""
                )
                .replaceAll(
                        "\\*\\*(.*?)\\*\\*",
                        "$1"
                )
                .replaceAll(
                        "__([^_]*?)__",
                        "$1"
                )
                .trim();
    }

    /*
     * --------------------------------------------------
     * LOAD SUPPLYBASE KNOWLEDGE
     * --------------------------------------------------
     */

    private String loadKnowledge() {

        try {

            var resource =
                    new org.springframework.core.io.ClassPathResource(
                            "chatbot/supplybase-knowledge.txt"
                    );

            try (var inputStream =
                         resource.getInputStream()) {

                return new String(
                        inputStream.readAllBytes(),
                        java.nio.charset.StandardCharsets.UTF_8
                );
            }

        } catch (Exception e) {

            e.printStackTrace();

            return "";
        }
    }

    /*
     * --------------------------------------------------
     * RESPONSE DTO
     * --------------------------------------------------
     */

    public record ChatResult(
            String conversationToken,
            String reply,
            boolean humanRequired,
            String status
    ) {
    }
}
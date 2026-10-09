package in.supplybase.backend.chatbot;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatbotMessageRepository
        extends JpaRepository<ChatbotMessage, Long> {

    List<ChatbotMessage> findByConversationIdOrderByCreatedAtAsc(
            Long conversationId
    );
}
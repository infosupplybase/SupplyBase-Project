package in.supplybase.backend.chatbot;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatbotConversationRepository
        extends JpaRepository<ChatbotConversation, Long> {

    Page<ChatbotConversation> findAllByOrderByUpdatedAtDesc(
            Pageable pageable
    );

    Page<ChatbotConversation> findByStatusOrderByUpdatedAtDesc(
            ChatbotConversation.Status status,
            Pageable pageable
    );

    Optional<ChatbotConversation> findByPublicToken(String publicToken);
}
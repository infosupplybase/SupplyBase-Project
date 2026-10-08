package in.supplybase.backend.chatbot;

import in.supplybase.backend.common.ApiException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChatbotAdminService {

    private final ChatbotConversationRepository conversationRepository;
    private final ChatbotMessageRepository messageRepository;

    public ChatbotAdminService(
            ChatbotConversationRepository conversationRepository,
            ChatbotMessageRepository messageRepository
    ) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
    }

    @Transactional(readOnly = true)
    public Page<ChatbotConversation> getConversations(
            ChatbotConversation.Status status,
            int page,
            int size
    ) {
        PageRequest pageable = PageRequest.of(page, size);

        if (status == null) {
            return conversationRepository
                    .findAllByOrderByUpdatedAtDesc(pageable);
        }

        return conversationRepository
                .findByStatusOrderByUpdatedAtDesc(
                        status,
                        pageable
                );
    }

    @Transactional(readOnly = true)
    public ChatbotConversation getConversation(Long id) {
        return conversationRepository.findById(id)
                .orElseThrow(() ->
                        ApiException.notFound("Chat " + id)
                );
    }

    @Transactional
    public ChatbotMessage reply(
            Long conversationId,
            String message
    ) {
        ChatbotConversation conversation =
                getConversation(conversationId);

        if (conversation.getStatus()
                == ChatbotConversation.Status.CLOSED) {

            throw ApiException.conflict("This conversation is already closed");
        }

        ChatbotMessage chatbotMessage =
                ChatbotMessage.builder()
                        .conversation(conversation)
                        .senderType(
                                ChatbotMessage.SenderType.ADMIN
                        )
                        .message(message.trim())
                        .build();

        conversation.setStatus(
                ChatbotConversation.Status.HUMAN_ACTIVE
        );

        conversationRepository.save(conversation);

        return messageRepository.save(chatbotMessage);
    }

    @Transactional
    public ChatbotConversation close(Long id) {

        ChatbotConversation conversation =
                getConversation(id);

        conversation.setStatus(
                ChatbotConversation.Status.CLOSED
        );

        return conversationRepository.save(conversation);
    }
}
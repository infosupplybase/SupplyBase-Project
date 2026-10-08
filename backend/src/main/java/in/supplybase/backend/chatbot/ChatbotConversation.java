package in.supplybase.backend.chatbot;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import in.supplybase.backend.auth.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "chatbot_conversations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotConversation {

    public enum Status {
        AI,
        WAITING_FOR_HUMAN,
        HUMAN_ACTIVE,
        CLOSED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    @JsonIgnore
    private User customer;

    @Column(name = "public_token", nullable = false, unique = true, length = 36)
    private String publicToken;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private Status status = Status.AI;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(
        mappedBy = "conversation",
        cascade = CascadeType.ALL,
        orphanRemoval = true,
        fetch = FetchType.EAGER
)
    @OrderBy("createdAt ASC")
    @JsonManagedReference
    @Builder.Default
    private List<ChatbotMessage> messages = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();

        if (publicToken == null || publicToken.isBlank()) {
            publicToken = UUID.randomUUID().toString();
        }

        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
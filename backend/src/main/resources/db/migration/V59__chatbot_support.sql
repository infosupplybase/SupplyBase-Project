CREATE TABLE chatbot_conversations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    customer_id BIGINT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'AI',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_chatbot_conversation_customer
        FOREIGN KEY (customer_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE TABLE chatbot_messages (
    id BIGINT NOT NULL AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL,
    sender_type VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_chatbot_message_conversation
        FOREIGN KEY (conversation_id)
        REFERENCES chatbot_conversations(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_chatbot_conversations_status
    ON chatbot_conversations(status);

CREATE INDEX idx_chatbot_conversations_customer
    ON chatbot_conversations(customer_id);

CREATE INDEX idx_chatbot_messages_conversation
    ON chatbot_messages(conversation_id);
ALTER TABLE chatbot_conversations
    ADD COLUMN public_token CHAR(36) NULL;

UPDATE chatbot_conversations
SET public_token = UUID()
WHERE public_token IS NULL;

ALTER TABLE chatbot_conversations
    MODIFY public_token CHAR(36) NOT NULL;

CREATE UNIQUE INDEX uk_chatbot_conversations_public_token
    ON chatbot_conversations(public_token);
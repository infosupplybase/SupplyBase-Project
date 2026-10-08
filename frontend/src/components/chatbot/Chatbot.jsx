import { useState, useRef, useEffect, useCallback } from "react";
import "./Chatbot.css";

// Same API host as lib/api.js (VITE_API_URL on the live site).
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");
const API_URL = `${API_BASE}/api/chatbot/chat`;
const CONVERSATION_API = `${API_BASE}/api/chatbot/conversations`;

const TOKEN_KEY = "supplybase_chatbot_token";

const WELCOME_TEXT =
  "Hi! I'm the SupplyBase Assistant. How can I help you today?";

const QUICK_REPLIES = [
  "What services do you offer?",
  "Tell me about Interior by Choice",
  "How can I book a home visit?",
];

const time = (date = new Date()) =>
  new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const welcomeMessage = (id = "welcome") => ({
  id,
  sender: "bot",
  text: WELCOME_TEXT,
  time: time(),
});

// --------------------------------------------------
// Smart auto-scroll
//
// - Scrolls down only when a NEW message arrives
//   AND the user is already near the bottom.
// - If the user scrolled up, their position is kept
//   and a "New messages" button is shown instead.
// - Polling that returns the same messages never
//   touches the scroll position.
// --------------------------------------------------
function useChatScroll(itemCount, resetKey) {
  const listRef = useRef(null);
  const stickToBottom = useRef(true);
  const prevCount = useRef(0);
  const [showNew, setShowNew] = useState(false);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    stickToBottom.current = true;
    setShowNew(false);
  }, []);

  const onScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottom.current = distance < 80;
    if (stickToBottom.current) setShowNew(false);
  }, []);

  // A different conversation started: reset
  useEffect(() => {
    prevCount.current = 0;
    stickToBottom.current = true;
    setShowNew(false);
  }, [resetKey]);

  // React only to the COUNT growing
  useEffect(() => {
    const isFirstLoad = prevCount.current === 0;
    const hasNew = itemCount > prevCount.current;
    prevCount.current = itemCount;

    if (!hasNew) return;

    if (isFirstLoad) scrollToBottom("auto");
    else if (stickToBottom.current) scrollToBottom("smooth");
    else setShowNew(true);
  }, [itemCount, resetKey, scrollToBottom]);

  return { listRef, onScroll, showNew, scrollToBottom };
}

function FormattedText({ text }) {
  const clean = (s) =>
    s
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/`/g, "");

  const lines = text.split("\n").map((line) => line.trim());
  const blocks = [];
  let list = null;

  lines.forEach((line) => {
    const bullet = line.match(/^[-*•]\s+(.*)/);
    const numbered = line.match(/^\d+[.)]\s+(.*)/);

    if (bullet || numbered) {
      const type = numbered ? "ol" : "ul";

      if (!list || list.type !== type) {
        list = { type, items: [] };
        blocks.push(list);
      }

      list.items.push(clean((bullet || numbered)[1]));
    } else {
      list = null;

      if (line) {
        blocks.push({ type: "p", text: clean(line) });
      }
    }
  });

  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "p") {
          return <p key={index}>{block.text}</p>;
        }

        const Tag = block.type;
        return (
          <Tag key={index}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>{item}</li>
            ))}
          </Tag>
        );
      })}
    </>
  );
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const [conversationToken, setConversationToken] = useState(
    () => localStorage.getItem(TOKEN_KEY) || ""
  );

  const [status, setStatus] = useState("AI");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([welcomeMessage()]);

  const inputRef = useRef(null);

  const humanActive =
    status === "WAITING_FOR_HUMAN" || status === "HUMAN_ACTIVE";

  const { listRef, onScroll, showNew, scrollToBottom } = useChatScroll(
    messages.length + (loading ? 1 : 0),
    conversationToken
  );

  // --------------------------------------------------
  // Convert backend messages into chatbot messages
  // --------------------------------------------------
  const convertServerMessages = (serverMessages) =>
    serverMessages.map((msg) => ({
      id: `server-${msg.id}`,
      sender:
        msg.senderType === "CUSTOMER"
          ? "user"
          : msg.senderType === "ADMIN"
          ? "admin"
          : "bot",
      text: msg.message,
      time: time(msg.createdAt),
    }));

  // Backend is the single source of truth: REPLACE messages.
  const applyConversation = (conversation) => {
    setStatus(conversation.status || "AI");

    if (Array.isArray(conversation.messages)) {
      setMessages([
        welcomeMessage(),
        ...convertServerMessages(conversation.messages),
      ]);
    }
  };

  // --------------------------------------------------
  // Restore existing conversation
  // --------------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    fetch(`${CONVERSATION_API}/${token}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Conversation not found");
        return response.json();
      })
      .then(applyConversation)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setConversationToken("");
        setStatus("AI");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------------------
  // Poll backend while human support is active
  // --------------------------------------------------
  useEffect(() => {
    if (!conversationToken || !humanActive) return;

    const pollConversation = async () => {
      try {
        const response = await fetch(
          `${CONVERSATION_API}/${conversationToken}`
        );
        if (!response.ok) return;

        applyConversation(await response.json());
      } catch (error) {
        console.error("Chatbot polling error:", error);
      }
    };

    pollConversation();
    const interval = setInterval(pollConversation, 2500);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationToken, humanActive]);

  // --------------------------------------------------
  // When the window opens: focus input, jump to latest
  // (the message list is unmounted while closed, so it
  // starts at scrollTop 0 every time it opens)
  // --------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    inputRef.current?.focus();
    const frame = requestAnimationFrame(() => scrollToBottom("auto"));

    return () => cancelAnimationFrame(frame);
  }, [isOpen, scrollToBottom]);

  // --------------------------------------------------
  // Start a completely new conversation
  // --------------------------------------------------
  const startNewChat = () => {
    const confirmed = window.confirm(
      "Start a new chat? Your current conversation will remain available to the SupplyBase team."
    );
    if (!confirmed) return;

    localStorage.removeItem(TOKEN_KEY);

    setConversationToken("");
    setStatus("AI");
    setMessage("");
    setMessages([welcomeMessage("welcome-" + Date.now())]);

    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // --------------------------------------------------
  // Send message
  // --------------------------------------------------
  const sendMessage = async (override) => {
    const trimmed = (override ?? message).trim();
    if (!trimmed || loading) return;

    // The user just sent something: always follow the conversation
    scrollToBottom("smooth");

    setMessages((prev) => [
      ...prev,
      {
        id: "local-" + Date.now(),
        sender: "user",
        text: trimmed,
        time: time(),
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          conversationToken: conversationToken || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Something went wrong"
        );
      }

      if (data.conversationToken) {
        setConversationToken(data.conversationToken);
        localStorage.setItem(TOKEN_KEY, data.conversationToken);
      }

      if (data.status) {
        setStatus(data.status);
      }

      // Normal AI conversation: show the reply immediately.
      if (data.reply && data.status === "AI") {
        setMessages((prev) => [
          ...prev,
          {
            id: "reply-" + Date.now(),
            sender: "bot",
            text: data.reply,
            time: time(),
          },
        ]);
      }

      // Human support started: sync the real conversation now.
      if (
        data.conversationToken &&
        (data.status === "WAITING_FOR_HUMAN" ||
          data.status === "HUMAN_ACTIVE")
      ) {
        try {
          const conversationResponse = await fetch(
            `${CONVERSATION_API}/${data.conversationToken}`
          );

          if (conversationResponse.ok) {
            applyConversation(await conversationResponse.json());
          }
        } catch (error) {
          console.error("Conversation sync error:", error);
        }
      }
    } catch (error) {
      console.error("Chatbot error:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: "error-" + Date.now(),
          sender: "bot",
          text: "Sorry, something went wrong. Please try again.",
          time: time(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const showQuickReplies = messages.length === 1 && status === "AI";

  const statusText =
    status === "WAITING_FOR_HUMAN"
      ? "Waiting for SupplyBase team"
      : status === "HUMAN_ACTIVE"
      ? "SupplyBase team is helping"
      : status === "CLOSED"
      ? "Conversation closed"
      : "Online · Replies instantly";

  return (
    <>
      {!isOpen && (
        <button
          className="cb-launcher"
          onClick={() => setIsOpen(true)}
          aria-label="Open SupplyBase Assistant"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.6c-.5.4-1.3.1-1.3-.6V16A2.5 2.5 0 0 1 4 13.5v-8Z"
              fill="currentColor"
            />
          </svg>

          <span className="cb-launcher-dot" />
        </button>
      )}

      {isOpen && (
        <div className="cb-window" role="dialog" aria-label="SupplyBase Assistant">
          {/* HEADER */}
          <div className="cb-header">
            <div className="cb-avatar">
              <img src="/assets/brand/logo-stacked.webp" alt="SupplyBase" />
            </div>

            <div className="cb-header-text">
              <div className="cb-title">SupplyBase Assistant</div>

              <div className="cb-status">
                <span className="cb-status-dot" />
                {statusText}
              </div>
            </div>

            <button
              className="cb-new-chat"
              onClick={startNewChat}
              aria-label="Start a new chat"
              title="New chat"
            >
              +
            </button>

            <button
              className="cb-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* MESSAGES */}
          <div
            style={{
              position: "relative",
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="cb-messages" ref={listRef} onScroll={onScroll}>
              {messages.map((msg) => (
                <div key={msg.id} className={`cb-row ${msg.sender}`}>
                  {(msg.sender === "bot" || msg.sender === "admin") && (
                    <div className="cb-mini-avatar">
                      <img
                        src="/assets/brand/logo-stacked.webp"
                        alt="SupplyBase"
                      />
                    </div>
                  )}

                  <div className="cb-bubble-wrap">
                    {msg.sender === "admin" && (
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#6b7280",
                          marginBottom: "4px",
                        }}
                      >
                        SupplyBase Team
                      </div>
                    )}

                    <div className={`cb-bubble ${msg.sender}`}>
                      {msg.sender === "bot" || msg.sender === "admin" ? (
                        <FormattedText text={msg.text} />
                      ) : (
                        msg.text
                      )}
                    </div>

                    <div className="cb-time">{msg.time}</div>
                  </div>
                </div>
              ))}

              {/* QUICK REPLIES */}
              {showQuickReplies && (
                <div className="cb-chips">
                  {QUICK_REPLIES.map((quickReply) => (
                    <button
                      key={quickReply}
                      className="cb-chip"
                      onClick={() => sendMessage(quickReply)}
                    >
                      {quickReply}
                    </button>
                  ))}
                </div>
              )}

              {/* TYPING */}
              {loading && (
                <div className="cb-row bot">
                  <div className="cb-mini-avatar">
                    <img
                      src="/assets/brand/logo-stacked.webp"
                      alt="SupplyBase"
                    />
                  </div>

                  <div className="cb-bubble bot cb-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
            </div>

            {showNew && (
              <button
                type="button"
                onClick={() => scrollToBottom("smooth")}
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: "12px",
                  transform: "translateX(-50%)",
                  padding: "6px 14px",
                  border: 0,
                  borderRadius: "999px",
                  background: "#1c1814",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                }}
              >
                New messages ↓
              </button>
            )}
          </div>

          {/* INPUT */}
          <div className="cb-input-area">
            <input
              ref={inputRef}
              type="text"
              maxLength={1000}
              placeholder={
                humanActive
                  ? "Message the SupplyBase team..."
                  : status === "CLOSED"
                  ? "Conversation closed"
                  : "Type your message..."
              }
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || status === "CLOSED"}
            />

            <button
              className="cb-send"
              onClick={() => sendMessage()}
              disabled={!message.trim() || loading || status === "CLOSED"}
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.4 20.4 21 12 3.4 3.6 3.3 10l12 2 .1 6.4Z" />
              </svg>
            </button>
          </div>

          {/* FOOTER */}
          {status === "CLOSED" ? (
            <button
              className="cb-footer"
              onClick={startNewChat}
              style={{ cursor: "pointer", border: "none", width: "100%" }}
            >
              Start a new chat
            </button>
          ) : (
            <div className="cb-footer">Powered by SupplyBase AI</div>
          )}
        </div>
      )}
    </>
  );
}
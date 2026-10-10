import { useState, useRef, useEffect, useCallback, Fragment } from "react";
import { Link } from "react-router-dom";
import { contact } from "../../data/siteConfig";
import "./Chatbot.css";

// Same API host as lib/api.js (VITE_API_URL on the live site).
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");
const API_URL = `${API_BASE}/api/chatbot/chat`;
const CONVERSATION_API = `${API_BASE}/api/chatbot/conversations`;

const TOKEN_KEY = "supplybase_chatbot_token";
const LOGO = "/assets/brand/logo-stacked.webp";

const WELCOME_TEXT =
  "Hello, welcome to SupplyBase! I can help you choose the right service, explain how our work is done, or get you booked for a home visit. What are you planning?";

const TALK_TO_TEAM = "Talk to our team";

const QUICK_REPLIES = [
  "What services do you offer?",
  "How do I book a home visit?",
  "Tell me about Interior by Choice",
  TALK_TO_TEAM,
];

// What the customer "says" when they ask for a person. The API recognises
// it and passes the chat to the team in the admin Chatbot inbox.
const HUMAN_REQUEST = "I'd like to talk to your team, please.";

const WHATSAPP_URL = `https://wa.me/${contact.phoneRaw}?text=${encodeURIComponent(
  "Hi SupplyBase, I have a question."
)}`;

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

// localStorage can throw in private windows or with site data blocked.
const storage = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY) || "";
    } catch {
      return "";
    }
  },
  set: (value) => {
    try {
      localStorage.setItem(TOKEN_KEY, value);
    } catch {
      /* the chat still works, it just won't survive a reload */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* nothing to clear */
    }
  },
};

const isSmallScreen = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 600px)").matches;

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

// --------------------------------------------------
// Links, emails and phone numbers inside a message
// --------------------------------------------------
const LINKABLE =
  /(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])|([\w.+-]+@[\w-]+\.[\w.-]*\w)|(\+91[\s-]?\d{5}[\s-]?\d{5})/g;

// Links to our own site open inside the app instead of reloading it.
const SITE_HOST = /^https?:\/\/(www\.)?supplybase\.co\.in(?=\/|$)/i;

function Linkified({ text, onNavigate }) {
  const parts = [];
  let last = 0;

  for (const match of text.matchAll(LINKABLE)) {
    const [value, url, email, phone] = match;
    if (match.index > last) parts.push(text.slice(last, match.index));

    if (url && SITE_HOST.test(url)) {
      parts.push(
        <Link key={match.index} to={url.replace(SITE_HOST, "") || "/"} className="cb-link" onClick={onNavigate}>
          {url.replace(/^https?:\/\/(www\.)?/i, "")}
        </Link>
      );
    } else if (url) {
      parts.push(
        <a key={match.index} href={url} className="cb-link" target="_blank" rel="noopener noreferrer">
          {url.replace(/^https?:\/\//i, "")}
        </a>
      );
    } else if (email) {
      parts.push(
        <a key={match.index} href={`mailto:${email}`} className="cb-link">
          {email}
        </a>
      );
    } else if (phone) {
      parts.push(
        <a key={match.index} href={`tel:+${phone.replace(/\D/g, "")}`} className="cb-link">
          {phone}
        </a>
      );
    }

    last = match.index + value.length;
  }

  if (last < text.length) parts.push(text.slice(last));

  return parts.map((part, index) => <Fragment key={index}>{part}</Fragment>);
}

function FormattedText({ text, onNavigate }) {
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
          return (
            <p key={index}>
              <Linkified text={block.text} onNavigate={onNavigate} />
            </p>
          );
        }

        const Tag = block.type;
        return (
          <Tag key={index}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                <Linkified text={item} onNavigate={onNavigate} />
              </li>
            ))}
          </Tag>
        );
      })}
    </>
  );
}

const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
  </svg>
);

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [conversationToken, setConversationToken] = useState(storage.get);
  const [status, setStatus] = useState("AI");
  const [loading, setLoading] = useState(false);
  const [confirmingNewChat, setConfirmingNewChat] = useState(false);
  const [messages, setMessages] = useState([welcomeMessage()]);

  const inputRef = useRef(null);
  const launcherRef = useRef(null);

  const humanActive =
    status === "WAITING_FOR_HUMAN" || status === "HUMAN_ACTIVE";
  const closed = status === "CLOSED";

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
    const token = storage.get();
    if (!token) return;

    fetch(`${CONVERSATION_API}/${token}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Conversation not found");
        return response.json();
      })
      .then(applyConversation)
      .catch(() => {
        storage.clear();
        setConversationToken("");
        setStatus("AI");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------------------
  // Poll backend while human support is active:
  // quickly while the chat is open, slowly when closed.
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
    const interval = setInterval(pollConversation, isOpen ? 2500 : 15000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationToken, humanActive, isOpen]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setConfirmingNewChat(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  // --------------------------------------------------
  // When the window opens: focus input, jump to latest
  // (the message list is unmounted while closed, so it
  // starts at scrollTop 0 every time it opens).
  // Escape closes it.
  // --------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    // On phones focusing would pop the keyboard over the welcome message.
    if (!isSmallScreen()) inputRef.current?.focus();
    const frame = requestAnimationFrame(() => scrollToBottom("auto"));

    const onKeyDown = (event) => {
      if (event.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, scrollToBottom, closeChat]);

  // A link to another page of the site: on a phone the chat covers
  // the whole screen, so close it to show the page.
  const onNavigate = () => {
    if (isSmallScreen()) setIsOpen(false);
  };

  // --------------------------------------------------
  // Start a completely new conversation
  // --------------------------------------------------
  const startNewChat = () => {
    storage.clear();

    setConfirmingNewChat(false);
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
    if (!trimmed || loading || closed) return;

    // The user just sent something: always follow the conversation
    scrollToBottom("smooth");
    setConfirmingNewChat(false);

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

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Something went wrong"
        );
      }

      if (data.conversationToken) {
        setConversationToken(data.conversationToken);
        storage.set(data.conversationToken);
      }

      if (data.status) {
        setStatus(data.status);
      }

      // AI answer (or "this chat has ended"): show the reply immediately.
      if (data.reply && (data.status === "AI" || data.status === "CLOSED")) {
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
          text: `Sorry, I couldn't send that. Please check your connection and try again, or call us on ${contact.phoneDisplay}.`,
          time: time(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Keep the cursor in the box after each reply (not on phones, where
  // it would re-open the keyboard over the answer).
  useEffect(() => {
    if (isOpen && !loading && !isSmallScreen()) inputRef.current?.focus();
  }, [loading, isOpen]);

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  const sendQuickReply = (quickReply) =>
    sendMessage(quickReply === TALK_TO_TEAM ? HUMAN_REQUEST : quickReply);

  const showQuickReplies = messages.length === 1 && status === "AI" && !loading;

  const statusText =
    status === "WAITING_FOR_HUMAN"
      ? "Connecting you to our team"
      : status === "HUMAN_ACTIVE"
      ? "Chatting with the SupplyBase team"
      : closed
      ? "This chat has ended"
      : "Online · Usually replies instantly";

  return (
    <>
      {!isOpen && (
        <button
          ref={launcherRef}
          type="button"
          className="cb-launcher"
          onClick={() => setIsOpen(true)}
          aria-label="Chat with SupplyBase"
          title="Chat with us"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.6c-.5.4-1.3.1-1.3-.6V16A2.5 2.5 0 0 1 4 13.5v-8Z"
              fill="currentColor"
            />
          </svg>
          <span className="cb-launcher-dot" />
        </button>
      )}

      {isOpen && (
        <div className="cb-window" role="dialog" aria-labelledby="cb-title">
          {/* HEADER */}
          <div className="cb-header">
            <div className="cb-avatar">
              <img src={LOGO} alt="" />
            </div>

            <div className="cb-header-text">
              <div className="cb-title" id="cb-title">
                SupplyBase Assistant
              </div>
              <div className={`cb-status${humanActive ? " is-team" : ""}${closed ? " is-closed" : ""}`}>
                <span className="cb-status-dot" />
                {statusText}
              </div>
            </div>

            <button
              type="button"
              className="cb-icon-btn"
              onClick={() => setConfirmingNewChat((value) => !value)}
              aria-label="Start a new chat"
              title="New chat"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>

            <button
              type="button"
              className="cb-icon-btn"
              onClick={closeChat}
              aria-label="Close chat"
              title="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* NEW CHAT CONFIRMATION */}
          {confirmingNewChat && (
            <div className="cb-confirm" role="alert">
              <span>Start a new chat? This conversation will be cleared from this window.</span>
              <div className="cb-confirm-actions">
                <button type="button" className="cb-btn-ghost" onClick={() => setConfirmingNewChat(false)}>
                  Cancel
                </button>
                <button type="button" className="cb-btn" onClick={startNewChat}>
                  Start new chat
                </button>
              </div>
            </div>
          )}

          {/* MESSAGES */}
          <div className="cb-body">
            <div
              className="cb-messages"
              ref={listRef}
              onScroll={onScroll}
              aria-live="polite"
              aria-relevant="additions"
            >
              {messages.map((msg) => (
                <div key={msg.id} className={`cb-row ${msg.sender}`}>
                  {(msg.sender === "bot" || msg.sender === "admin") && (
                    <div className="cb-mini-avatar">
                      <img src={LOGO} alt="" />
                    </div>
                  )}

                  <div className="cb-bubble-wrap">
                    {msg.sender === "admin" && (
                      <div className="cb-sender">SupplyBase Team</div>
                    )}

                    <div className={`cb-bubble ${msg.sender}`}>
                      {msg.sender === "bot" || msg.sender === "admin" ? (
                        <FormattedText text={msg.text} onNavigate={onNavigate} />
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
                <div className="cb-chips" aria-label="Suggested questions">
                  {QUICK_REPLIES.map((quickReply) => (
                    <button
                      type="button"
                      key={quickReply}
                      className="cb-chip"
                      onClick={() => sendQuickReply(quickReply)}
                    >
                      {quickReply}
                    </button>
                  ))}
                </div>
              )}

              {/* TYPING */}
              {loading && (
                <div className="cb-row bot" aria-label="SupplyBase Assistant is typing">
                  <div className="cb-mini-avatar">
                    <img src={LOGO} alt="" />
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
                className="cb-new-messages"
                onClick={() => scrollToBottom("smooth")}
              >
                New messages ↓
              </button>
            )}
          </div>

          {/* INPUT */}
          {closed ? (
            <div className="cb-closed">
              <span>This chat has ended.</span>
              <button type="button" className="cb-btn" onClick={startNewChat}>
                Start a new chat
              </button>
            </div>
          ) : (
            <form className="cb-input-area" onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                maxLength={1000}
                aria-label="Type your message"
                placeholder={
                  humanActive ? "Message the SupplyBase team..." : "Ask about a service..."
                }
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                disabled={loading}
                autoComplete="off"
                enterKeyHint="send"
              />

              <button
                type="submit"
                className="cb-send"
                disabled={!message.trim() || loading}
                aria-label="Send message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M3.4 20.4 21 12 3.4 3.6 3.3 10l12 2 .1 6.4Z" />
                </svg>
              </button>
            </form>
          )}

          {/* FOOTER: other ways to reach us */}
          <div className="cb-footer">
            <a href={`tel:+${contact.phoneRaw}`} className="cb-footer-link">
              <PhoneIcon /> Call
            </a>
            <a href={WHATSAPP_URL} className="cb-footer-link" target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon /> WhatsApp
            </a>
            {status === "AI" && (
              <button
                type="button"
                className="cb-footer-link"
                onClick={() => sendMessage(HUMAN_REQUEST)}
                disabled={loading}
              >
                {TALK_TO_TEAM}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

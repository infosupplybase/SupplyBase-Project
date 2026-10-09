import { useEffect, useState } from 'react';
import api, { friendlyError } from '../lib/api';
import useChatScroll from './useChatScroll';
import './AdminChatbot.css';

const STATUS_OPTIONS = [
  { value: '', label: 'All conversations' },
  { value: 'WAITING_FOR_HUMAN', label: 'Needs attention' },
  { value: 'HUMAN_ACTIVE', label: 'Human active' },
  { value: 'AI', label: 'AI' },
  { value: 'CLOSED', label: 'Closed' },
];

const STATUS_LABELS = {
  WAITING_FOR_HUMAN: 'Needs attention',
  HUMAN_ACTIVE: 'Human active',
  AI: 'AI',
  CLOSED: 'Closed',
};

const customerName = (c) => c?.fullName || c?.email || 'Guest customer';

const formatTime = (value) =>
  value
    ? new Date(value).toLocaleString([], {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

// AI replies come back as one long line with " - " between list items.
// Put each item on its own line so the message is readable.
const formatMessageText = (text = '') =>
  text.replace(/\s+-\s+(?=[A-Z0-9])/g, '\n• ').replace(/^- /, '• ');

export default function AdminChatbot() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const { listRef, onScroll, showNew, scrollToBottom } = useChatScroll(
    selected?.messages?.length || 0,
    selected?.id
  );

  const loadConversations = async () => {
    try {
      setError('');
      setLoading(true);

      const data = await api.admin.chatbot.conversations({
        status: status || undefined,
        page: 0,
        size: 50,
      });

      setConversations(data?.content || []);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const openConversation = async (id) => {
    try {
      setError('');
      setDetailLoading(true);

      const data = await api.admin.chatbot.conversation(id);

      setSelected(data);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setDetailLoading(false);
    }
  };

  // Refresh the open conversation every 2.5s
  useEffect(() => {
    if (!selected?.id) return;

    const interval = setInterval(async () => {
      try {
        const updated = await api.admin.chatbot.conversation(selected.id);
        setSelected(updated);
      } catch (err) {
        console.error('Chatbot conversation refresh failed:', err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [selected?.id]);

  useEffect(() => {
    loadConversations();
  }, [status]);

  const sendReply = async () => {
    const trimmed = reply.trim();
    if (!trimmed || !selected || sending) return;

    try {
      setSending(true);
      setError('');

      await api.admin.chatbot.reply(selected.id, trimmed);
      setReply('');

      await openConversation(selected.id);
      await loadConversations();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSending(false);
    }
  };

  const closeConversation = async () => {
    if (!selected) return;

    try {
      setError('');
      await api.admin.chatbot.close(selected.id);
      await openConversation(selected.id);
      await loadConversations();
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendReply();
    }
  };

  const senderClass = (type) =>
    type === 'ADMIN' ? 'admin' : type === 'CUSTOMER' ? 'customer' : 'ai';

  const senderLabel = (type) =>
    type === 'ADMIN' ? 'You' : type === 'CUSTOMER' ? 'Customer' : 'SupplyBase AI';

  return (
    <div className="admin-page chatbot-page">
      <div className="admin-page-header">
        <div>
          <h1>Chatbot Support</h1>
          <p>Help customers when the AI cannot answer their question.</p>
        </div>

        <select
          className="chatbot-filter"
          value={status}
          onChange={(event) => {
            setSelected(null);
            setStatus(event.target.value);
          }}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="chatbot-admin-layout">
        {/* ---------- Conversation list ---------- */}
        <section className="chatbot-conversation-list">
          <div className="chatbot-section-title">
            Conversations
            <span className="chatbot-count">{conversations.length}</span>
          </div>

          <div className="chatbot-list-scroll">
            {loading ? (
              <div className="chatbot-empty">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="chatbot-empty">No conversations found.</div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  className={`chatbot-conversation-item ${
                    selected?.id === conversation.id ? 'selected' : ''
                  }`}
                  onClick={() => openConversation(conversation.id)}
                >
                  <div className="conversation-top">
                    <strong>Conversation #{conversation.id}</strong>
                    <span className={`conversation-status ${conversation.status}`}>
                      {STATUS_LABELS[conversation.status] || conversation.status}
                    </span>
                  </div>

                  <div className="conversation-customer">
                    {customerName(conversation.customer)}
                  </div>

                  <div className="conversation-time">
                    {formatTime(conversation.updatedAt)}
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* ---------- Conversation detail ---------- */}
        <section className="chatbot-conversation-detail">
          {!selected ? (
            <div className="chatbot-empty chatbot-detail-empty">
              Select a conversation to view the chat.
            </div>
          ) : (
            <>
              <div className="chatbot-detail-header">
                <div>
                  <h2>Conversation #{selected.id}</h2>
                  <p>
                    {customerName(selected.customer)}
                    <span className={`conversation-status ${selected.status}`}>
                      {STATUS_LABELS[selected.status] || selected.status}
                    </span>
                  </p>
                </div>

                {selected.status !== 'CLOSED' && (
                  <button
                    type="button"
                    className="chatbot-close-conversation"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to close this conversation?')) {
                        closeConversation();
                      }
                    }}
                  >
                    Close conversation
                  </button>
                )}
              </div>

              <div className="chatbot-message-wrap">
              <div
                className="chatbot-message-list"
                ref={listRef}
                onScroll={onScroll}
              >
                {detailLoading && !selected.messages ? (
                  <div className="chatbot-empty">Loading conversation...</div>
                ) : (
                  (selected.messages || []).map((message) => (
                    <div
                      key={message.id}
                      className={`admin-chat-message ${senderClass(message.senderType)}`}
                    >
                      <div className="admin-chat-sender">
                        {senderLabel(message.senderType)}
                      </div>

                      <div className="admin-chat-text">
                        {formatMessageText(message.message)}
                      </div>

                      <div className="admin-chat-time">
                        {formatTime(message.createdAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {showNew && (
                <button
                  type="button"
                  className="chatbot-new-messages"
                  onClick={() => scrollToBottom('smooth')}
                >
                  New messages ↓
                </button>
              )}
              </div>

              {selected.status !== 'CLOSED' ? (
                <div className="chatbot-reply-area">
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your reply. Enter to send, Shift+Enter for a new line."
                    rows={2}
                    disabled={sending}
                  />

                  <button
                    type="button"
                    onClick={sendReply}
                    disabled={!reply.trim() || sending}
                  >
                    {sending ? 'Sending...' : 'Send reply'}
                  </button>
                </div>
              ) : (
                <div className="chatbot-closed-message">
                  This conversation is closed.
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
import { useState, useRef, useEffect } from "react";
import { useWebSocket, STATUS } from "./useWebSocket";
import "./App.css";

const STATUS_META = {
  [STATUS.CONNECTING]: { label: "Connecting…", color: "var(--yellow)", dot: "dot-pulse" },
  [STATUS.CONNECTED]: { label: "Connected", color: "var(--green)", dot: "dot-solid" },
  [STATUS.DISCONNECTED]: { label: "Disconnected", color: "var(--red)", dot: "dot-solid" },
  [STATUS.ERROR]: { label: "Error", color: "var(--red)", dot: "dot-solid" },
};

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function MessageBubble({ msg, myClientId }) {
  const isOwn = msg.type === "echo";
  const isSystem = msg.type === "system" || msg.type === "welcome" || msg.type === "user_joined" || msg.type === "user_left";
  const isOther = msg.type === "message";

  if (isSystem) {
    return (
      <div className="msg-system">
        <span>{msg.message}</span>
        {msg.timestamp && <span className="msg-time">{formatTime(msg.timestamp)}</span>}
      </div>
    );
  }

  return (
    <div className={`msg-row ${isOwn ? "msg-row--own" : "msg-row--other"}`}>
      <div className={`msg-bubble ${isOwn ? "msg-bubble--own" : "msg-bubble--other"}`}>
        {isOther && (
          <span className="msg-sender">Client #{msg.clientId}</span>
        )}
        <p className="msg-text">{msg.message}</p>
        <span className="msg-time">{formatTime(msg.timestamp)}</span>
      </div>
    </div>
  );
}

export default function App() {
  const { messages, status, clientId, send, clearMessages } = useWebSocket();
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const meta = STATUS_META[status] ?? STATUS_META[STATUS.DISCONNECTED];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    send(text);
    setInput("");
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">WebSocket Chat</span>
          </div>
          {clientId && <span className="client-badge">You are Client #{clientId}</span>}
        </div>
        <div className="header-right">
          <div className="status-pill" style={{ "--status-color": meta.color }}>
            <span className={`status-dot ${meta.dot}`} style={{ background: meta.color }} />
            <span className="status-label">{meta.label}</span>
          </div>
          <button
            id="clear-btn"
            className="btn btn-ghost"
            onClick={clearMessages}
            title="Clear messages"
          >
            Clear
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="messages" id="messages-panel" aria-label="Chat messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">💬</span>
            <p>No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} myClientId={clientId} />
        ))}
        <div ref={bottomRef} />
      </main>

      {/* Input */}
      <footer className="composer">
        <form id="chat-form" className="composer-form" onSubmit={handleSend}>
          <input
            id="message-input"
            className="composer-input"
            type="text"
            placeholder={status === STATUS.CONNECTED ? "Type a message…" : "Waiting for connection…"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={status !== STATUS.CONNECTED}
            autoComplete="off"
            aria-label="Message input"
          />
          <button
            id="send-btn"
            type="submit"
            className="btn btn-primary"
            disabled={status !== STATUS.CONNECTED || !input.trim()}
            aria-label="Send message"
          >
            Send ↑
          </button>
        </form>
      </footer>
    </div>
  );
}

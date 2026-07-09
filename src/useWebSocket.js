import { useState, useEffect, useRef, useCallback } from "react";

const WS_URL = "ws://localhost:8080";

export const STATUS = {
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERROR: "error",
};

/**
 * Custom hook that manages a WebSocket connection lifecycle.
 * Returns { messages, status, clientId, send, clearMessages }.
 */
export function useWebSocket() {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState(STATUS.DISCONNECTED);
  const [clientId, setClientId] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  const addMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, { ...msg, id: crypto.randomUUID() }]);
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus(STATUS.CONNECTING);

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus(STATUS.CONNECTED);
      addMessage({ type: "system", message: "Connected to server." });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "welcome") {
          setClientId(data.clientId);
        }
        addMessage(data);
      } catch {
        addMessage({ type: "system", message: event.data });
      }
    };

    ws.onclose = () => {
      setStatus(STATUS.DISCONNECTED);
      addMessage({ type: "system", message: "Disconnected. Reconnecting in 3s…" });
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      setStatus(STATUS.ERROR);
      ws.close();
    };
  }, [addMessage]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((text) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text }));
    }
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, status, clientId, send, clearMessages };
}

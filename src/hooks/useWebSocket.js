import { useEffect, useRef, useState, useCallback } from "react";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3001";
const HEARTBEAT_INTERVAL = 20_000; // ping a cada 20s para manter conexão viva
const RECONNECT_DELAY    = 2_000;  // espera 2s antes de reconectar

export function useWebSocket(onMessage) {
  const wsRef            = useRef(null);
  const onMessageRef     = useRef(onMessage);
  const reconnectTimer   = useRef(null);
  const heartbeatTimer   = useRef(null);
  const unmounted        = useRef(false);
  const [connected, setConnected] = useState(false);

  // Mantém o callback sempre atualizado sem recriar a conexão
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

  const stopHeartbeat = useCallback(() => {
    clearInterval(heartbeatTimer.current);
    heartbeatTimer.current = null;
  }, []);

  const startHeartbeat = useCallback((ws) => {
    stopHeartbeat();
    heartbeatTimer.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        // ping leve — o servidor ignora mensagens desconhecidas sem problema
        try { ws.send(JSON.stringify({ type: "ping" })); } catch (_) {}
      } else {
        stopHeartbeat();
      }
    }, HEARTBEAT_INTERVAL);
  }, [stopHeartbeat]);

  const connect = useCallback(() => {
    if (unmounted.current) return;

    // Já conectado ou conectando — não abre outra
    const state = wsRef.current?.readyState;
    if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;

    // Fecha instância antiga se existir
    try { wsRef.current?.close(); } catch (_) {}

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (unmounted.current) return;
      setConnected(true);
      startHeartbeat(ws);
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        // Ignora pong silenciosamente
        if (data.type === "pong") return;
        onMessageRef.current?.(data);
      } catch {
        console.error("[WS] parse error", e.data);
      }
    };

    ws.onclose = () => {
      if (unmounted.current) return;
      setConnected(false);
      stopHeartbeat();
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws.close(); // dispara onclose que agenda o reconect
    };
  }, [startHeartbeat, stopHeartbeat]);

  const scheduleReconnect = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
  }, [connect]);

  // Reconecta imediatamente quando a aba/tela volta ao foco
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === "visible") {
      const state = wsRef.current?.readyState;
      if (state !== WebSocket.OPEN && state !== WebSocket.CONNECTING) {
        clearTimeout(reconnectTimer.current);
        connect();
      }
    }
  }, [connect]);

  // Reconecta quando o dispositivo volta à rede
  const handleOnline = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    connect();
  }, [connect]);

  useEffect(() => {
    unmounted.current = false;
    connect();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      unmounted.current = true;
      clearTimeout(reconnectTimer.current);
      stopHeartbeat();
      wsRef.current?.close();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [connect, handleVisibilityChange, handleOnline, stopHeartbeat]);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  return { connected, send };
}

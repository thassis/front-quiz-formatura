import { useState, useCallback } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

export default function AdminApp() {
  const [authed, setAuthed] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [gameState, setGameState] = useState({
    phase: "lobby",
    players: [],
    leaderboard: [],
    currentQuestion: null,
    answerStats: [0, 0, 0, 0],
    totalQuestions: 0,
    currentIndex: -1,
    answeredCount: 0,
  });

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case "admin_auth_result":
        if (msg.success) {
          setAuthed(true);
          setLoginError("");
        } else {
          setLoginError(msg.message || "Senha incorreta.");
        }
        break;

      case "game_state":
        setGameState({
          phase: msg.phase,
          players: msg.players || [],
          leaderboard: msg.leaderboard || [],
          currentQuestion: msg.currentQuestion || null,
          answerStats: msg.answerStats || [0, 0, 0, 0],
          totalQuestions: msg.totalQuestions || 0,
          currentIndex: msg.currentIndex ?? -1,
          answeredCount: msg.answeredCount || 0,
        });
        break;

      case "player_joined":
        setGameState((s) => ({
          ...s,
          players: msg.players || s.players,
        }));
        break;

      case "player_left":
        setGameState((s) => ({
          ...s,
          players: msg.players || s.players,
        }));
        break;

      case "answer_update":
        setGameState((s) => ({
          ...s,
          answerStats: msg.answerStats || s.answerStats,
          answeredCount: msg.answeredCount ?? s.answeredCount,
          players: msg.players || s.players,
        }));
        break;

      case "game_reset":
        setGameState({
          phase: "lobby",
          players: [],
          leaderboard: [],
          currentQuestion: null,
          answerStats: [0, 0, 0, 0],
          totalQuestions: 0,
          currentIndex: -1,
          answeredCount: 0,
        });
        break;

      case "error":
        console.warn("[Admin] Error:", msg.message);
        break;
    }
  }, []);

  const { connected, send } = useWebSocket(handleMessage);

  const handleLogin = (password) => {
    setLoginError("");
    send({ type: "admin_auth", password });
  };

  const handleSend = (data) => {
    send(data);
  };

  if (!authed) {
    return (
      <AdminLogin
        onLogin={handleLogin}
        error={loginError}
        connected={connected}
      />
    );
  }

  return (
    <AdminDashboard
      gameState={gameState}
      onSend={handleSend}
      connected={connected}
    />
  );
}

import { useState, useCallback, useEffect } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import JoinPage from "./pages/JoinPage";
import WaitingRoom from "./pages/WaitingRoom";
import QuestionPage from "./pages/QuestionPage";
import AnswerReveal from "./pages/AnswerReveal";
import Leaderboard from "./pages/Leaderboard";

// ─── Cookie helpers ───────────────────────────────────────────────────────────
// Cookies NÃO sincronizam entre dispositivos (ao contrário do localStorage
// quando o Chrome Sync está ativo). São persistidos mesmo fechando o navegador.

const COOKIE_NAME = "quiz_session";
const COOKIE_HOURS = 24;

function setCookie(value) {
  const expires = new Date(Date.now() + COOKIE_HOURS * 3600 * 1000).toUTCString();
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
  // Limpa qualquer localStorage legado que possa causar conflito
  localStorage.removeItem("quiz_session_token");
}

function getCookie() {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function clearCookie() {
  document.cookie = `${COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
  localStorage.removeItem("quiz_session_token"); // limpa legado também
}

// ─── App ──────────────────────────────────────────────────────────────────────

/*
 * appState:
 *   reconnecting → tentando rejoin automático
 *   join         → entrada do jogador
 *   lobby        → sala de espera após entrar
 *   question     → pergunta ativa
 *   reveal       → resposta revelada
 *   ended        → placar final
 */

function resetPlayerState(setAppState, setPlayerName, setPlayerScore, setPlayerCount, setCurrentQuestion, setRevealData, setHasAnswered) {
  clearCookie();
  setAppState("join");
  setPlayerName("");
  setPlayerScore({ name: "", score: 0, lastPoints: 0, lastCorrect: false });
  setPlayerCount(0);
  setCurrentQuestion(null);
  setRevealData(null);
  setHasAnswered(false);
}

export default function App() {
  const [appState, setAppState]         = useState("reconnecting");
  const [playerName, setPlayerName]     = useState("");
  const [playerScore, setPlayerScore]   = useState({ name: "", score: 0, lastPoints: 0, lastCorrect: false });
  const [joinError, setJoinError]       = useState("");
  const [playerCount, setPlayerCount]   = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [revealData, setRevealData]     = useState(null);
  const [finalLeaderboard, setFinalLeaderboard] = useState([]);
  const [hasAnswered, setHasAnswered]   = useState(false);

  const doReset = useCallback(() => {
    resetPlayerState(setAppState, setPlayerName, setPlayerScore, setPlayerCount, setCurrentQuestion, setRevealData, setHasAnswered);
  }, []);

  // Tenta rejoin usando o cookie assim que conecta
  const tryRejoin = useCallback((send) => {
    const token = getCookie();
    if (token) {
      send({ type: "rejoin", sessionToken: token });
    } else {
      setAppState("join");
    }
  }, []);

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case "connected":
        break;

      // ── Rejoin ──────────────────────────────────────────────
      case "rejoin_success":
        setPlayerName(msg.name);
        setPlayerScore(s => ({ ...s, name: msg.name, score: msg.score }));
        setJoinError("");
        setAppState(msg.phase === "lobby" ? "lobby" : "reconnecting");
        break;

      case "rejoin_failed":
        clearCookie();
        setAppState("join");
        break;

      // ── Join ─────────────────────────────────────────────────
      case "joined":
        setCookie(msg.sessionToken);
        setAppState("lobby");
        setPlayerName(msg.name);
        setPlayerScore(s => ({ ...s, name: msg.name }));
        setJoinError("");
        break;

      case "error":
        if (appState === "join" || appState === "reconnecting") {
          setJoinError(msg.message);
          setAppState("join");
        }
        break;

      // ── Lobby ────────────────────────────────────────────────
      case "lobby":
        setPlayerCount(msg.playerCount);
        if (appState !== "lobby") setAppState("lobby");
        break;

      // ── Pergunta ─────────────────────────────────────────────
      case "question":
        setCurrentQuestion(msg);
        setHasAnswered(msg.alreadyAnswered ?? false);
        setRevealData(null);
        setAppState("question");
        break;

      case "answer_ack":
        setHasAnswered(true);
        break;

      // ── Reveal ───────────────────────────────────────────────
      case "answer_reveal": {
        const myEntry = msg.leaderboard.find(e => e.name === playerName);
        const prevScore = playerScore.score;
        const newScore  = myEntry?.score ?? prevScore;
        const diff = newScore - prevScore;

        setPlayerScore(s => ({
          ...s,
          score: newScore,
          lastPoints: diff,
          lastCorrect: diff > 0,
        }));
        setRevealData(msg);
        setAppState("reveal");
        break;
      }

      // ── Fim ──────────────────────────────────────────────────
      case "game_ended":
        setFinalLeaderboard(msg.leaderboard);
        setAppState("ended");
        break;

      // ── Kick ─────────────────────────────────────────────────
      case "kicked":
        clearCookie();
        setJoinError("Você foi removido pelo administrador.");
        setAppState("join");
        setPlayerName("");
        setPlayerScore({ name: "", score: 0, lastPoints: 0, lastCorrect: false });
        break;

      // ── Reset ─────────────────────────────────────────────────
      case "game_reset":
        doReset();
        break;
    }
  }, [appState, playerName, playerScore.score, doReset]);

  const { connected, send } = useWebSocket(handleMessage);

  // Tenta rejoin a cada (re)conexão
  useEffect(() => {
    if (connected) tryRejoin(send);
  }, [connected]); // eslint-disable-line

  const handleJoin = (name) => {
    setJoinError("");
    send({ type: "join", name });
  };

  const handleAnswer = (answerIndex) => {
    send({ type: "answer", answerIndex });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (appState === "reconnecting") {
    return (
      <div className="page">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div className="spinner" />
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            {connected ? "Reconectando sessão..." : "Conectando ao servidor..."}
          </p>
        </div>
      </div>
    );
  }

  if (appState === "join") {
    return <JoinPage onJoin={handleJoin} error={joinError} connected={connected} />;
  }

  if (appState === "lobby") {
    return <WaitingRoom playerName={playerName} playerCount={playerCount} />;
  }

  if (appState === "question" && currentQuestion) {
    return (
      <QuestionPage
        question={currentQuestion}
        onAnswer={handleAnswer}
        hasAnswered={hasAnswered}
      />
    );
  }

  if (appState === "reveal" && revealData && currentQuestion) {
    return (
      <AnswerReveal
        reveal={revealData}
        question={currentQuestion}
        playerScore={playerScore}
      />
    );
  }

  if (appState === "ended") {
    return (
      <Leaderboard
        leaderboard={finalLeaderboard}
        playerName={playerName}
        isEnd={true}
      />
    );
  }

  return null;
}

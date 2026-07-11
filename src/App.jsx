import { useState, useCallback, useEffect } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import JoinPage from "./pages/JoinPage";
import WaitingRoom from "./pages/WaitingRoom";
import QuestionPage from "./pages/QuestionPage";
import AnswerReveal from "./pages/AnswerReveal";
import Leaderboard from "./pages/Leaderboard";

const SESSION_KEY = "quiz_session_token";

/*
 * appState:
 *   join         → entrada do jogador
 *   reconnecting → tentando rejoin automático
 *   lobby        → sala de espera após entrar
 *   question     → pergunta ativa
 *   reveal       → resposta revelada
 *   ended        → placar final
 */

export default function App() {
  const [appState, setAppState]         = useState("reconnecting"); // começa tentando rejoin
  const [playerName, setPlayerName]     = useState("");
  const [playerScore, setPlayerScore]   = useState({ name: "", score: 0, lastPoints: 0, lastCorrect: false });
  const [joinError, setJoinError]       = useState("");
  const [playerCount, setPlayerCount]   = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [revealData, setRevealData]     = useState(null);
  const [finalLeaderboard, setFinalLeaderboard] = useState([]);
  const [hasAnswered, setHasAnswered]   = useState(false);

  // Tenta rejoin assim que conecta, se houver token salvo
  const tryRejoin = useCallback((send) => {
    const token = localStorage.getItem(SESSION_KEY);
    if (token) {
      send({ type: "rejoin", sessionToken: token });
    } else {
      setAppState("join");
    }
  }, []);

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case "connected":
        // Sempre tenta rejoin ao conectar/reconectar
        break;

      // ── Rejoin ──────────────────────────────────────────────
      case "rejoin_success":
        setPlayerName(msg.name);
        setPlayerScore(s => ({ ...s, name: msg.name, score: msg.score }));
        setJoinError("");
        // O estado da tela vem logo depois via sendCurrentStateToPlayer
        // mas garantimos pelo menos o lobby caso não venha nada
        setAppState(msg.phase === "lobby" ? "lobby" : appState);
        break;

      case "rejoin_failed":
        localStorage.removeItem(SESSION_KEY);
        setAppState("join");
        break;

      // ── Join ─────────────────────────────────────────────────
      case "joined":
        localStorage.setItem(SESSION_KEY, msg.sessionToken);
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

      case "game_reset":
        localStorage.removeItem(SESSION_KEY);
        setAppState("join");
        setPlayerName("");
        setPlayerScore({ name: "", score: 0, lastPoints: 0, lastCorrect: false });
        setPlayerCount(0);
        setCurrentQuestion(null);
        setRevealData(null);
        setHasAnswered(false);
        break;
    }
  }, [appState, playerName, playerScore.score]);

  const { connected, send } = useWebSocket(handleMessage);

  // Quando conecta pela primeira vez (ou reconecta), tenta rejoin
  useEffect(() => {
    if (connected) {
      tryRejoin(send);
    }
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

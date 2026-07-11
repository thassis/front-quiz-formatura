import { useState, useCallback } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import JoinPage from "./pages/JoinPage";
import WaitingRoom from "./pages/WaitingRoom";
import QuestionPage from "./pages/QuestionPage";
import AnswerReveal from "./pages/AnswerReveal";
import Leaderboard from "./pages/Leaderboard";

/*
 * Possible appStates:
 *   join       → entrada do jogador
 *   lobby      → sala de espera após entrar
 *   question   → pergunta ativa
 *   reveal     → resposta revelada
 *   ended      → placar final
 */

export default function App() {
  const [appState, setAppState] = useState("join");
  const [playerName, setPlayerName]     = useState("");
  const [playerScore, setPlayerScore]   = useState({ name: "", score: 0, lastPoints: 0, lastCorrect: false });
  const [joinError, setJoinError]       = useState("");
  const [playerCount, setPlayerCount]   = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [revealData, setRevealData]     = useState(null);
  const [finalLeaderboard, setFinalLeaderboard] = useState([]);
  const [hasAnswered, setHasAnswered]   = useState(false);

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case "connected":
        break;

      case "joined":
        setAppState("lobby");
        setPlayerName(msg.name);
        setPlayerScore(s => ({ ...s, name: msg.name }));
        setJoinError("");
        break;

      case "error":
        if (appState === "join") setJoinError(msg.message);
        break;

      case "lobby":
        setPlayerCount(msg.playerCount);
        break;

      case "question":
        setCurrentQuestion(msg);
        setHasAnswered(false);
        setRevealData(null);
        setAppState("question");
        break;

      case "answer_ack":
        setHasAnswered(true);
        break;

      case "answer_reveal": {
        const myEntry = msg.leaderboard.find(e => e.name === playerName);
        const prevScore = playerScore.score;
        const newScore  = myEntry?.score ?? prevScore;
        const diff = newScore - prevScore;
        const wasCorrect = diff > 0;

        setPlayerScore(s => ({
          ...s,
          score: newScore,
          lastPoints: diff,
          lastCorrect: wasCorrect,
        }));
        setRevealData(msg);
        setAppState("reveal");
        break;
      }

      case "game_ended":
        setFinalLeaderboard(msg.leaderboard);
        setAppState("ended");
        break;

      case "game_reset":
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

  const handleJoin = (name) => {
    setJoinError("");
    send({ type: "join", name });
  };

  const handleAnswer = (answerIndex) => {
    send({ type: "answer", answerIndex });
  };

  // Render
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

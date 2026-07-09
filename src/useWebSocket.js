import { useState, useEffect, useRef, useCallback } from "react";

const WS_URL = "ws://localhost:8080";

export const CONNECTION_STATUS = {
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
};

/**
 * Hook central do Quiz. Gerencia toda a comunicação WebSocket e o estado do jogo.
 */
export function useGameWebSocket() {
  // Conexão
  const [connectionStatus, setConnectionStatus] = useState(CONNECTION_STATUS.CONNECTING);

  // Identidade do cliente
  const [myPlayer, setMyPlayer] = useState(null); // { id, name, fullName }
  const [isAdmin, setIsAdmin] = useState(false);

  // Estado do jogo
  const [gameStatus, setGameStatus] = useState("waiting"); // 'waiting' | 'playing' | 'results'
  const [players, setPlayers] = useState([]);

  // Estado da pergunta atual
  const [currentQuestion, setCurrentQuestion] = useState(null);
  // { index, total, question, options, timeLimit }
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [myAnswer, setMyAnswer] = useState(null); // índice selecionado, ou null
  const [questionReveal, setQuestionReveal] = useState(null); // { correctIndex, correctAnswer }

  // Respostas dos jogadores por pergunta: { [questionIndex]: { [playerId]: { answerIndex, isCorrect, playerName } } }
  const [playerAnswers, setPlayerAnswers] = useState({});

  // Resultados finais
  const [results, setResults] = useState(null);

  // Dados do admin (perguntas com gabarito)
  const [adminQuestions, setAdminQuestions] = useState([]);

  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  // ─── Envio ─────────────────────────────────────────────────────────────────
  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  // ─── Conexão ───────────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    setConnectionStatus(CONNECTION_STATUS.CONNECTING);

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setConnectionStatus(CONNECTION_STATUS.CONNECTED);

    ws.onmessage = (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }
      handleMessage(msg);
    };

    ws.onclose = () => {
      setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, []); // eslint-disable-line

  // ─── Handler de mensagens ──────────────────────────────────────────────────
  function handleMessage(msg) {
    switch (msg.type) {
      // ── Boas-vindas ───────────────────────────────────────────────────────
      case "welcome":
        setMyPlayer({ id: msg.playerId, fullName: msg.playerName });
        setGameStatus(msg.gameStatus);
        break;

      case "admin_welcome":
        setIsAdmin(true);
        setGameStatus(msg.gameStatus);
        setPlayers(msg.players || []);
        setAdminQuestions(msg.questions || []);
        break;

      // ── Lista de jogadores ────────────────────────────────────────────────
      case "player_list":
        setPlayers(msg.players || []);
        break;

      case "player_left":
        setPlayers((prev) => prev.filter((p) => p.id !== msg.playerId));
        break;

      // ── Início do jogo ────────────────────────────────────────────────────
      case "game_started":
        setGameStatus("playing");
        setResults(null);
        setPlayerAnswers({});
        break;

      // ── Pergunta ──────────────────────────────────────────────────────────
      case "question_start":
        setCurrentQuestion({
          index: msg.questionIndex,
          total: msg.totalQuestions,
          question: msg.question,
          options: msg.options,
          timeLimit: msg.timeLimit,
        });
        setSecondsLeft(msg.secondsLeft);
        setMyAnswer(null);
        setQuestionReveal(null);
        break;

      case "timer_tick":
        setSecondsLeft(msg.secondsLeft);
        break;

      // ── Resposta de um jogador (tempo real) ───────────────────────────────
      case "player_answered":
        setPlayerAnswers((prev) => ({
          ...prev,
          [msg.questionIndex]: {
            ...(prev[msg.questionIndex] || {}),
            [msg.playerId]: {
              answerIndex: msg.answerIndex,
              isCorrect: msg.isCorrect,
              playerName: msg.playerName,
            },
          },
        }));
        // Atualiza score na lista de jogadores
        if (msg.isCorrect) {
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === msg.playerId ? { ...p, score: (p.score || 0) + 1 } : p
            )
          );
        }
        break;

      // ── Reveal da resposta correta ────────────────────────────────────────
      case "time_up":
        setQuestionReveal({
          correctIndex: msg.correctIndex,
          correctAnswer: msg.correctAnswer,
        });
        break;

      // ── Resultados finais ─────────────────────────────────────────────────
      case "game_results":
        setGameStatus("results");
        setResults(msg.results);
        break;

      // ── Reset ─────────────────────────────────────────────────────────────
      case "game_reset":
        setGameStatus("waiting");
        setResults(null);
        setCurrentQuestion(null);
        setMyAnswer(null);
        setQuestionReveal(null);
        setPlayerAnswers({});
        setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
        break;

      default:
        break;
    }
  }

  // ─── Mount / unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  // ─── API pública ───────────────────────────────────────────────────────────
  const register = useCallback(
    (name, surname) => send({ type: "register", name, surname }),
    [send]
  );

  const registerAdmin = useCallback(
    () => send({ type: "register_admin" }),
    [send]
  );

  const startGame = useCallback(
    () => send({ type: "start_game" }),
    [send]
  );

  const resetGame = useCallback(
    () => send({ type: "reset_game" }),
    [send]
  );

  const submitAnswer = useCallback(
    (answerIndex) => {
      if (myAnswer !== null) return; // já respondeu
      setMyAnswer(answerIndex);
      send({ type: "answer", answerIndex });
    },
    [myAnswer, send]
  );

  return {
    connectionStatus,
    myPlayer,
    isAdmin,
    gameStatus,
    players,
    currentQuestion,
    secondsLeft,
    myAnswer,
    questionReveal,
    playerAnswers,
    results,
    adminQuestions,
    // Ações
    register,
    registerAdmin,
    startGame,
    resetGame,
    submitAnswer,
  };
}

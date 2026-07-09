import { useEffect } from "react";
import { useGameWebSocket } from "./useWebSocket";
import RegisterPage from "./pages/RegisterPage";
import WaitingPage from "./pages/WaitingPage";
import QuizPage from "./pages/QuizPage";
import ResultsPage from "./pages/ResultsPage";
import AdminPage from "./pages/AdminPage";
import "./App.css";

const IS_ADMIN = window.location.hash === "#admin";

export default function App() {
  const game = useGameWebSocket();

  // Registra como admin assim que conectar (se for a rota de admin)
  useEffect(() => {
    if (IS_ADMIN && game.connectionStatus === "connected" && !game.isAdmin) {
      game.registerAdmin();
    }
  }, [IS_ADMIN, game.connectionStatus, game.isAdmin]); // eslint-disable-line

  // ── Roteamento ─────────────────────────────────────────────────────────────
  if (IS_ADMIN) {
    return <AdminPage game={game} />;
  }

  if (!game.myPlayer) {
    return <RegisterPage game={game} />;
  }

  if (game.gameStatus === "waiting") {
    return <WaitingPage game={game} />;
  }

  if (game.gameStatus === "playing") {
    return <QuizPage game={game} />;
  }

  if (game.gameStatus === "results") {
    return <ResultsPage game={game} />;
  }

  return null;
}

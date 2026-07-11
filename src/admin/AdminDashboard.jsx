import { useState } from "react";
import "./AdminDashboard.css";

const OPTION_ICONS  = ["▲", "◆", "●", "■"];
const OPTION_COLORS = ["a", "b", "c", "d"];

export default function AdminDashboard({ gameState, onSend, connected }) {
  const {
    phase,
    players = [],
    leaderboard = [],
    currentQuestion,
    answerStats = [0, 0, 0, 0],
    totalQuestions = 0,
    currentIndex = -1,
    answeredCount = 0,
  } = gameState;

  const [confirmReset, setConfirmReset] = useState(false);
  const [kickTarget, setKickTarget]     = useState(null); // nome do jogador a remover

  const isLobby    = phase === "lobby";
  const isQuestion = phase === "question";
  const isReveal   = phase === "answer_reveal";
  const isEnded    = phase === "ended";
  const isLastQ    = currentIndex + 1 >= totalQuestions;

  const handleReset = () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    onSend({ type: "reset_game" });
    setConfirmReset(false);
  };

  const handleKick = (name) => {
    if (kickTarget !== name) { setKickTarget(name); return; }
    onSend({ type: "kick_player", name });
    setKickTarget(null);
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span>⚡</span>
          <div>
            <p className="admin-brand-title">Quiz Admin</p>
            <p className="admin-brand-sub">Formatura</p>
          </div>
        </div>

        {/* Status */}
        <div className="admin-status-card card">
          <div className="admin-status-row">
            <span className="admin-status-label">Status</span>
            <span className={`badge ${isEnded ? "badge-red" : "badge-green"}`}>
              {phaseLabel(phase)}
            </span>
          </div>
          <div className="admin-status-row">
            <span className="admin-status-label">Conexão</span>
            <span className={`badge ${connected ? "badge-green" : "badge-red"}`}>
              {connected ? "Online" : "Offline"}
            </span>
          </div>
          {currentQuestion && (
            <div className="admin-status-row">
              <span className="admin-status-label">Pergunta</span>
              <span className="admin-status-val">{currentIndex + 1} / {totalQuestions}</span>
            </div>
          )}
        </div>

        {/* Players */}
        <div className="admin-players-card card">
          <h3 className="admin-section-title">👥 Jogadores ({players.length})</h3>
          <ul className="admin-player-list">
            {players.length === 0 ? (
              <li className="admin-player-empty">Nenhum jogador ainda</li>
            ) : (
              players.map((p) => (
                <li key={p.name} className="admin-player-item">
                  <span className="admin-player-name">{p.name}</span>
                  <div className="admin-player-right">
                    <span className="admin-player-score">{p.score}</span>
                    {(isQuestion || isReveal) && p.answeredThisRound && p.answerIndex !== null && (
                      <span className={`admin-player-answer opt-icon-${OPTION_COLORS[p.answerIndex]}`}>
                        {OPTION_ICONS[p.answerIndex]}
                      </span>
                    )}
                    {(isQuestion || isReveal) && !p.answeredThisRound && (
                      <span className="status-dot offline" title="Aguardando resposta..." />
                    )}
                    {/* Botão de kick com duplo clique */}
                    <button
                      className={`kick-btn ${kickTarget === p.name ? "kick-confirm" : ""}`}
                      onClick={() => handleKick(p.name)}
                      onBlur={() => setKickTarget(null)}
                      title={kickTarget === p.name ? "Clique de novo para confirmar" : "Remover jogador"}
                      disabled={!connected}
                    >
                      {kickTarget === p.name ? "✓?" : "✕"}
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Botão reiniciar — sempre visível */}
        <button
          id="btn-reset-game"
          className={`btn btn-full ${confirmReset ? "btn-danger" : "btn-ghost"}`}
          onClick={handleReset}
          onBlur={() => setConfirmReset(false)}
          disabled={!connected}
        >
          {confirmReset ? "⚠️ Confirmar reinício?" : "🔄 Reiniciar Jogo"}
        </button>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {/* Controls */}
        <div className="admin-controls card">
          <h2 className="admin-controls-title">Controles do Jogo</h2>
          <div className="admin-controls-btns">
            {isLobby && (
              <button
                id="btn-start-game"
                className="btn btn-success btn-lg"
                onClick={() => onSend({ type: "start_game" })}
                disabled={!connected || players.length === 0}
              >
                ▶ Iniciar Jogo ({players.length} jogadores)
              </button>
            )}
            {isQuestion && (
              <button
                id="btn-show-results"
                className="btn btn-primary btn-lg"
                onClick={() => onSend({ type: "show_results" })}
                disabled={!connected}
              >
                📊 Mostrar Resultados ({answeredCount}/{players.length})
              </button>
            )}
            {isReveal && !isLastQ && (
              <button
                id="btn-next-question"
                className="btn btn-primary btn-lg"
                onClick={() => onSend({ type: "next_question" })}
                disabled={!connected}
              >
                ➡ Próxima Pergunta
              </button>
            )}
            {isReveal && isLastQ && (
              <button
                id="btn-end-game"
                className="btn btn-danger btn-lg"
                onClick={() => onSend({ type: "end_game" })}
                disabled={!connected}
              >
                🏁 Encerrar Jogo
              </button>
            )}
            {isEnded && (
              <p className="admin-ended-msg">🎉 Jogo encerrado! Use "Reiniciar Jogo" na barra lateral.</p>
            )}
          </div>
        </div>

        {/* Current Question + Answer Stats */}
        {currentQuestion && (isQuestion || isReveal) && (
          <div className="admin-question-card card">
            <div className="admin-q-header">
              <span className="badge badge-purple">
                Pergunta {currentIndex + 1} de {totalQuestions}
              </span>
              {isReveal && (
                <span className="badge badge-green">Respostas reveladas</span>
              )}
            </div>
            <p className="admin-q-text">{currentQuestion.text}</p>

            <div className="admin-answer-stats">
              {currentQuestion.options.map((opt, i) => {
                const count = answerStats[i] || 0;
                const total = players.length || 1;
                const pct = Math.round((count / total) * 100);
                const isCorrect = isReveal && i === currentQuestion.correct;
                return (
                  <div key={i} className={`admin-stat-row ${isCorrect ? "correct-stat" : ""}`}>
                    <span className={`admin-stat-icon opt-icon-${OPTION_COLORS[i]}`}>
                      {OPTION_ICONS[i]}
                    </span>
                    <span className="admin-stat-label">{opt}</span>
                    <div className="admin-stat-bar-wrap">
                      <div
                        className={`admin-stat-bar opt-bar-${OPTION_COLORS[i]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="admin-stat-count">{count}</span>
                  </div>
                );
              })}
            </div>

            <div className="admin-answered-info">
              <span>{answeredCount} de {players.length} responderam</span>
              <div className="progress-bar" style={{ flex: 1 }}>
                <div
                  className="progress-fill"
                  style={{ width: `${players.length ? (answeredCount / players.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {(isReveal || isEnded) && leaderboard.length > 0 && (
          <div className="admin-lb card">
            <h3 className="admin-section-title">🏆 Placar</h3>
            <ol className="admin-lb-list">
              {leaderboard.map((p, i) => (
                <li key={p.name} className="admin-lb-item">
                  <span className="admin-lb-rank">#{i + 1}</span>
                  <span className="admin-lb-name">{p.name}</span>
                  <span className="admin-lb-score">{p.score} pts</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {isLobby && players.length === 0 && (
          <div className="admin-empty card">
            <span style={{ fontSize: "3rem" }}>⏳</span>
            <p>Aguardando jogadores entrarem...</p>
            <p className="admin-empty-sub">Peça para eles acessarem a página principal.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function phaseLabel(phase) {
  const labels = {
    lobby: "Lobby",
    question: "Pergunta",
    answer_reveal: "Revelação",
    leaderboard: "Placar",
    ended: "Encerrado",
  };
  return labels[phase] || phase;
}

const LABELS = ["A", "B", "C", "D"];

const STATUS_LABELS = {
  waiting: "Aguardando jogadores",
  playing: "Jogo em andamento",
  results: "Jogo encerrado",
};

const STATUS_COLORS = {
  waiting: "var(--yellow)",
  playing: "var(--green)",
  results: "var(--accent)",
};

export default function AdminPage({ game }) {
  const {
    connectionStatus,
    gameStatus,
    players,
    currentQuestion,
    secondsLeft,
    playerAnswers,
    results,
    adminQuestions,
    startGame,
    resetGame,
  } = game;

  const isConnected = connectionStatus === "connected";

  // Respostas da pergunta atual (para exibição em tempo real)
  const currentAnswers =
    currentQuestion !== null
      ? playerAnswers[currentQuestion.index] || {}
      : {};

  const currentQ =
    currentQuestion !== null ? adminQuestions[currentQuestion.index] : null;

  return (
    <div className="admin-page">
      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span className="logo-icon">🎓</span>
          <span className="admin-sidebar-title">Admin Panel</span>
        </div>

        <div
          className="admin-status-pill"
          style={{ "--sc": STATUS_COLORS[gameStatus] }}
        >
          <span
            className={`status-dot ${gameStatus === "playing" ? "dot-pulse" : "dot-solid"}`}
            style={{ background: STATUS_COLORS[gameStatus] }}
          />
          {STATUS_LABELS[gameStatus]}
        </div>

        <h3 className="admin-section-label">
          Jogadores <span className="player-count">{players.length}</span>
        </h3>

        <div className="admin-player-list">
          {players.length === 0 && (
            <p className="empty-hint">Nenhum jogador conectado</p>
          )}
          {players.map((p) => {
            const answered =
              currentQuestion !== null && currentAnswers[p.id] !== undefined;
            return (
              <div key={p.id} className="admin-player-row">
                <div className="admin-player-avatar">
                  {p.fullName.charAt(0)}
                </div>
                <div className="admin-player-info">
                  <span className="admin-player-name">{p.fullName}</span>
                  <span className="admin-player-score">
                    {p.score ?? 0} acerto{(p.score ?? 0) !== 1 ? "s" : ""}
                  </span>
                </div>
                <span
                  className={`admin-answered-dot ${answered ? "answered" : "not-answered"}`}
                  title={answered ? "Respondeu" : "Não respondeu"}
                />
              </div>
            );
          })}
        </div>

        {/* Controles */}
        <div className="admin-controls">
          {gameStatus === "waiting" && (
            <button
              id="admin-start-btn"
              className="btn btn-primary btn-full"
              disabled={!isConnected || players.length === 0}
              onClick={startGame}
            >
              ▶ Iniciar Quiz
            </button>
          )}
          {(gameStatus === "playing" || gameStatus === "results") && (
            <button
              id="admin-reset-btn"
              className="btn btn-ghost btn-full"
              onClick={resetGame}
            >
              ↺ Reiniciar Jogo
            </button>
          )}
          {!isConnected && (
            <p className="admin-offline">⚠ Servidor desconectado</p>
          )}
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <main className="admin-main">
        {/* ── Waiting ─────────────────────────────────────────────────── */}
        {gameStatus === "waiting" && (
          <div className="admin-waiting">
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="admin-waiting-inner">
              <span className="admin-waiting-icon">🕐</span>
              <h2>Aguardando para iniciar</h2>
              <p>
                {players.length === 0
                  ? "Aguarde os jogadores se conectarem antes de iniciar."
                  : `${players.length} jogador${players.length !== 1 ? "es" : ""} conectado${players.length !== 1 ? "s" : ""}. Clique em "Iniciar Quiz" quando estiver pronto.`}
              </p>
              <p className="admin-url-hint">
                Jogadores acessam:{" "}
                <code>http://localhost:5173</code>
              </p>
            </div>
          </div>
        )}

        {/* ── Playing ─────────────────────────────────────────────────── */}
        {gameStatus === "playing" && currentQuestion && (
          <div className="admin-question-panel">
            <div className="admin-q-header">
              <div>
                <span className="admin-q-num">
                  Pergunta {currentQuestion.index + 1} / {currentQuestion.total}
                </span>
                <h2 className="admin-q-text">{currentQuestion.question}</h2>
              </div>
              <div className="admin-timer-badge">
                <span
                  className="admin-timer-num"
                  style={{
                    color:
                      secondsLeft > 30
                        ? "var(--green)"
                        : secondsLeft > 15
                        ? "var(--yellow)"
                        : "var(--red)",
                  }}
                >
                  {secondsLeft}
                </span>
                <span className="admin-timer-unit">seg</span>
              </div>
            </div>

            {/* Opções (com gabarito) */}
            <div className="admin-options-grid">
              {currentQuestion.options.map((opt, i) => (
                <div
                  key={i}
                  className={`admin-option ${
                    currentQ && i === currentQ.correct ? "admin-option--correct" : ""
                  }`}
                >
                  <span className="quiz-option-label">{LABELS[i]}</span>
                  <span>{opt}</span>
                  {currentQ && i === currentQ.correct && (
                    <span className="admin-correct-badge">✓ Correta</span>
                  )}
                </div>
              ))}
            </div>

            {/* Tabela de respostas em tempo real */}
            <div className="admin-answers-section">
              <h3 className="section-title">
                Respostas em tempo real
                <span className="player-count">
                  {Object.keys(currentAnswers).length}/{players.length}
                </span>
              </h3>

              <div className="admin-answers-table">
                <div className="admin-answers-head">
                  <span>Jogador</span>
                  <span>Resposta</span>
                  <span>Resultado</span>
                </div>

                {players.map((p) => {
                  const ans = currentAnswers[p.id];
                  return (
                    <div key={p.id} className="admin-answers-row">
                      <span className="admin-ans-name">{p.fullName}</span>
                      <span className="admin-ans-choice">
                        {ans !== undefined
                          ? `${LABELS[ans.answerIndex]} — ${currentQuestion.options[ans.answerIndex]}`
                          : <em className="waiting-text">⏳ aguardando…</em>}
                      </span>
                      <span className="admin-ans-result">
                        {ans !== undefined ? (
                          ans.isCorrect ? (
                            <span className="badge-correct">✓ Acertou</span>
                          ) : (
                            <span className="badge-wrong">✗ Errou</span>
                          )
                        ) : (
                          <span className="badge-pending">—</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Results ─────────────────────────────────────────────────── */}
        {gameStatus === "results" && results && (
          <div className="admin-results-panel">
            <h2 className="admin-results-title">🏆 Resultado Final</h2>
            <div className="admin-results-table">
              <div className="admin-answers-head">
                <span>Posição</span>
                <span>Jogador</span>
                <span>Acertos</span>
              </div>
              {results.map((r, i) => (
                <div key={r.id} className={`admin-answers-row ${i === 0 ? "admin-answers-row--winner" : ""}`}>
                  <span>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}º`}
                  </span>
                  <span className="admin-ans-name">{r.fullName}</span>
                  <span className={`admin-ans-result ${i === 0 ? "badge-correct" : ""}`}>
                    {r.score} / {r.answers.length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

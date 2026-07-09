export default function WaitingPage({ game }) {
  const { myPlayer, players } = game;

  return (
    <div className="page waiting-page">
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="waiting-content">
        <div className="waiting-header">
          <span className="waiting-icon">⏳</span>
          <h1 className="waiting-title">Aguardando início</h1>
          <p className="waiting-subtitle">
            O quiz vai começar em breve. Fique nessa tela!
          </p>
          <div className="waiting-dots">
            <span /><span /><span />
          </div>
        </div>

        <div className="waiting-you-badge">
          Conectado como <strong>{myPlayer?.fullName}</strong>
        </div>

        <div className="waiting-players-section">
          <h2 className="section-title">
            Jogadores na sala
            <span className="player-count">{players.length}</span>
          </h2>

          {players.length === 0 ? (
            <p className="empty-hint">Nenhum jogador conectado ainda…</p>
          ) : (
            <div className="player-grid">
              {players.map((p) => (
                <div
                  key={p.id}
                  className={`player-card ${p.id === myPlayer?.id ? "player-card--me" : ""}`}
                >
                  <div className="player-avatar">
                    {p.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className="player-card-name">{p.fullName}</span>
                  {p.id === myPlayer?.id && (
                    <span className="player-you-tag">Você</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="waiting-hint">
          Aguarde o administrador iniciar o quiz
        </p>
      </div>
    </div>
  );
}

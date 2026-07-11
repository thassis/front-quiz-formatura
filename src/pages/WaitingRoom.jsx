import "./WaitingRoom.css";

export default function WaitingRoom({ playerName, playerCount }) {
  return (
    <div className="page">
      <div className="page-content waiting-content anim-fade-in">
        <div className="waiting-dots">
          <span></span><span></span><span></span>
        </div>

        <h2 className="waiting-title">Aguardando o<br />início do jogo...</h2>

        <div className="waiting-name-badge">
          <span>Você entrou como</span>
          <strong>{playerName}</strong>
        </div>

        <div className="waiting-counter card">
          <div className="waiting-counter-num">{playerCount}</div>
          <div className="waiting-counter-label">
            {playerCount === 1 ? "jogador na sala" : "jogadores na sala"}
          </div>
        </div>

        <p className="waiting-hint">
          🎯 Fique atento! O admin vai iniciar em breve.
        </p>
      </div>
    </div>
  );
}

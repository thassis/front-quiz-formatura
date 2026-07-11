import { useState } from "react";
import "./JoinPage.css";

export default function JoinPage({ onJoin, error, connected }) {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) onJoin(name.trim());
  };

  return (
    <div className="page">
      <div className="page-content anim-fade-in-up">
        <div className="join-hero">
          <span className="emoji-big">🎓</span>
          <h1 className="join-title">Quiz da<br />Formatura</h1>
          <p className="join-subtitle">Entre na sala e boa sorte!</p>
        </div>

        <div className="prizes-card">
          <p className="prizes-title">🏆 Premiação</p>
          <ul className="prizes-list">
            <li className="prize-item prize-gold">
              <span className="prize-medal">🥇</span>
              <span className="prize-place">1º lugar</span>
              <span className="prize-value">R$ 100 na Centauro</span>
            </li>
            <li className="prize-item prize-silver">
              <span className="prize-medal">🥈</span>
              <span className="prize-place">2º lugar</span>
              <span className="prize-value">R$ 50 na Centauro</span>
            </li>
            <li className="prize-item prize-bronze">
              <span className="prize-medal">🥉</span>
              <span className="prize-place">3º lugar</span>
              <span className="prize-value">R$ 20 na Centauro</span>
            </li>
          </ul>
        </div>

        <div className="card join-card">
          <form onSubmit={handleSubmit} className="join-form">
            <label className="join-label" htmlFor="player-name">Seu nome</label>
            <input
              id="player-name"
              className="input"
              type="text"
              placeholder="Digite seu nome..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              autoFocus
              autoComplete="off"
            />
            {error && (
              <div className="join-error anim-shake">{error}</div>
            )}
            <button
              id="btn-join"
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={!name.trim() || !connected}
            >
              {connected ? "Entrar no Quiz →" : "Conectando..."}
            </button>
          </form>
        </div>

        <div className="join-footer">
          <span className={`status-dot ${connected ? "" : "offline"}`}></span>
          <span className="join-status-text">
            {connected ? "Conectado ao servidor" : "Aguardando conexão..."}
          </span>
        </div>
      </div>
    </div>
  );
}

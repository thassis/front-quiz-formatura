import { useState } from "react";
import { CONNECTION_STATUS } from "../useWebSocket";

export default function RegisterPage({ game }) {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isConnected = game.connectionStatus === CONNECTION_STATUS.CONNECTED;

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !surname.trim() || !isConnected) return;
    setSubmitted(true);
    game.register(name.trim(), surname.trim());
  }

  return (
    <div className="page register-page">
      {/* Orbs de fundo */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="register-card">
        <div className="register-logo">
          <span className="register-logo-icon">🎓</span>
          <h1 className="register-title">Quiz da Formatura</h1>
          <p className="register-subtitle">Digite seus dados para entrar</p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label" htmlFor="name-input">Nome</label>
            <input
              id="name-input"
              className="field-input"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitted || !isConnected}
              autoComplete="given-name"
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="surname-input">Sobrenome</label>
            <input
              id="surname-input"
              className="field-input"
              type="text"
              placeholder="Seu sobrenome"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              disabled={submitted || !isConnected}
              autoComplete="family-name"
              required
            />
          </div>

          <button
            id="register-btn"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={!isConnected || submitted || !name.trim() || !surname.trim()}
          >
            {submitted ? "Entrando…" : isConnected ? "Entrar no Quiz →" : "Conectando…"}
          </button>
        </form>

        <div className="register-status">
          <span
            className={`status-dot ${isConnected ? "dot-green" : "dot-pulse-yellow"}`}
          />
          <span className="status-text">
            {isConnected ? "Servidor conectado" : "Conectando ao servidor…"}
          </span>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import "./AdminLogin.css";

export default function AdminLogin({ onLogin, error, connected }) {
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password) onLogin(password);
  };

  return (
    <div className="page">
      <div className="page-content anim-fade-in-up">
        <div className="admin-login-hero">
          <span className="emoji-big">⚡</span>
          <h1>Painel Admin</h1>
          <p className="admin-login-sub">Quiz da Formatura</p>
        </div>

        <div className="card">
          <form className="admin-login-form" onSubmit={handleSubmit}>
            <label className="join-label" htmlFor="admin-password">Senha de acesso</label>
            <input
              id="admin-password"
              className="input"
              type="password"
              placeholder="Digite a senha..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <div className="join-error anim-shake">{error}</div>}
            <button
              id="btn-admin-login"
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={!password || !connected}
            >
              {connected ? "Entrar como Admin →" : "Conectando..."}
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

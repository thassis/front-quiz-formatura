import "./Leaderboard.css";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard({ leaderboard, playerName, isEnd }) {
  const myRank = leaderboard.findIndex(e => e.name === playerName) + 1;

  return (
    <div className="page leaderboard-page anim-fade-in">
      <div className="leaderboard-content">
        <div className="lb-header">
          <span className="emoji-big">🏆</span>
          <h1 className="lb-title">{isEnd ? "Resultado Final!" : "Placar"}</h1>
          {isEnd && <p className="lb-subtitle">Parabéns a todos os participantes!</p>}
        </div>

        {leaderboard.length > 0 && (
          <div className="lb-podium">
            {leaderboard.slice(0, 3).map((p, i) => (
              <div key={p.name} className={`lb-podium-item rank-${i + 1}`}>
                <span className="lb-medal">{MEDALS[i]}</span>
                <span className="lb-podium-name">{p.name}</span>
                <span className="lb-podium-score">{p.score}</span>
              </div>
            ))}
          </div>
        )}

        <div className="card lb-list-wrap">
          <ol className="lb-list">
            {leaderboard.map((p, i) => (
              <li
                key={p.name}
                className={`lb-item ${p.name === playerName ? "me" : ""} anim-fade-in-up`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <span className="lb-rank">
                  {i < 3 ? MEDALS[i] : `#${i + 1}`}
                </span>
                <span className="lb-name">
                  {p.name}
                  {p.name === playerName && <span className="lb-you-tag">você</span>}
                </span>
                <span className="lb-score">{p.score} pts</span>
              </li>
            ))}
          </ol>
        </div>

        {myRank > 0 && (
          <div className="lb-my-position">
            <span>Sua posição:</span>
            <strong>#{myRank} de {leaderboard.length}</strong>
          </div>
        )}

        {!isEnd && (
          <p className="lb-wait">⏳ Aguardando próxima pergunta...</p>
        )}
      </div>
    </div>
  );
}

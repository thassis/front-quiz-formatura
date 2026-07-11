import "./AnswerReveal.css";

const OPTION_ICONS  = ["▲", "◆", "●", "■"];
const OPTION_COLORS = ["a", "b", "c", "d"];

export default function AnswerReveal({ reveal, question, playerScore }) {
  const { correctAnswer, answerStats, leaderboard } = reveal;
  const myRank = leaderboard.findIndex(e => e.name === playerScore?.name) + 1;
  const wasCorrect = playerScore?.lastCorrect;

  return (
    <div className="page reveal-page anim-fade-in">
      <div className="reveal-content">
        {/* Result banner */}
        <div className={`reveal-banner ${wasCorrect ? "correct" : "wrong"} anim-pop-in`}>
          <span className="reveal-banner-icon">{wasCorrect ? "🎉" : "😢"}</span>
          <div>
            <p className="reveal-banner-label">{wasCorrect ? "Correto!" : "Errado!"}</p>
            {wasCorrect && (
              <p className="reveal-banner-points">+{playerScore?.lastPoints} pontos</p>
            )}
          </div>
        </div>

        {/* Options with correct highlight */}
        <div className="reveal-options">
          {question.options.map((opt, i) => (
            <div
              key={i}
              className={`reveal-opt opt-${OPTION_COLORS[i]} ${i === correctAnswer ? "correct-opt" : "wrong-opt"}`}
            >
              <span className="option-icon">{OPTION_ICONS[i]}</span>
              <span className="reveal-opt-text">{opt}</span>
              {i === correctAnswer && <span className="reveal-check">✓</span>}
              <span className="reveal-count">{answerStats[i] || 0}</span>
            </div>
          ))}
        </div>

        {/* Mini leaderboard */}
        <div className="card reveal-leaderboard">
          <h3 className="reveal-lb-title">🏆 Placar Parcial</h3>
          <ol className="reveal-lb-list">
            {leaderboard.slice(0, 5).map((p, i) => (
              <li key={p.name} className={`reveal-lb-item ${i === myRank - 1 ? "me" : ""}`}>
                <span className="reveal-lb-rank">{i + 1}</span>
                <span className="reveal-lb-name">{p.name}</span>
                <span className="reveal-lb-score">{p.score}</span>
              </li>
            ))}
          </ol>
          {myRank > 5 && (
            <p className="reveal-my-rank">Sua posição: #{myRank}</p>
          )}
        </div>

        <p className="reveal-wait">⏳ Aguardando o admin avançar...</p>
      </div>
    </div>
  );
}

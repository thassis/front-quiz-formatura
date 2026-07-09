const MEDALS = ["🥇", "🥈", "🥉"];

export default function ResultsPage({ game }) {
  const { results, myPlayer } = game;

  if (!results || results.length === 0) {
    return (
      <div className="page results-page">
        <p>Calculando resultados…</p>
      </div>
    );
  }

  const topScore = results[0]?.score ?? 0;

  return (
    <div className="page results-page">
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="results-container">
        <div className="results-header">
          <span className="results-icon">🎉</span>
          <h1 className="results-title">Fim do Quiz!</h1>
          <p className="results-subtitle">Veja quem se saiu melhor</p>
        </div>

        {/* Pódio top 3 */}
        {results.length >= 1 && (
          <div className="podium">
            {/* 2º lugar */}
            {results[1] && (
              <div className="podium-slot podium-slot--2">
                <span className="podium-medal">{MEDALS[1]}</span>
                <div className="podium-avatar podium-avatar--2">
                  {results[1].fullName.charAt(0)}
                </div>
                <span className="podium-name">{results[1].fullName}</span>
                <div className="podium-block podium-block--2">
                  <span className="podium-score">{results[1].score}</span>
                </div>
              </div>
            )}

            {/* 1º lugar */}
            <div className="podium-slot podium-slot--1">
              <span className="podium-medal">{MEDALS[0]}</span>
              <div className="podium-avatar podium-avatar--1">
                {results[0].fullName.charAt(0)}
              </div>
              <span className="podium-name">{results[0].fullName}</span>
              <div className="podium-block podium-block--1">
                <span className="podium-score">{results[0].score}</span>
              </div>
            </div>

            {/* 3º lugar */}
            {results[2] && (
              <div className="podium-slot podium-slot--3">
                <span className="podium-medal">{MEDALS[2]}</span>
                <div className="podium-avatar podium-avatar--3">
                  {results[2].fullName.charAt(0)}
                </div>
                <span className="podium-name">{results[2].fullName}</span>
                <div className="podium-block podium-block--3">
                  <span className="podium-score">{results[2].score}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lista completa */}
        {results.length > 3 && (
          <div className="results-list">
            <h2 className="section-title">Classificação completa</h2>
            {results.map((p, i) => {
              const isMe = p.id === myPlayer?.id;
              const isWinner = p.score === topScore && topScore > 0;
              return (
                <div
                  key={p.id}
                  className={`result-row ${isMe ? "result-row--me" : ""}`}
                >
                  <span className="result-pos">
                    {i < 3 ? MEDALS[i] : `${i + 1}º`}
                  </span>
                  <span className="result-name">
                    {p.fullName}
                    {isMe && <span className="result-you-tag">Você</span>}
                  </span>
                  <span className={`result-score ${isWinner ? "result-score--winner" : ""}`}>
                    {p.score} acerto{p.score !== 1 ? "s" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Sua posição */}
        {myPlayer && (() => {
          const myPos = results.findIndex((r) => r.id === myPlayer.id);
          const myResult = results[myPos];
          if (!myResult) return null;
          return (
            <div className="my-result-card">
              <span className="my-result-pos">
                {myPos < 3 ? MEDALS[myPos] : `${myPos + 1}º lugar`}
              </span>
              <span>
                Você ({myPlayer.fullName}) acertou{" "}
                <strong>{myResult.score}</strong> de{" "}
                <strong>{myResult.answers.length}</strong> pergunta{myResult.answers.length !== 1 ? "s" : ""}
              </span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

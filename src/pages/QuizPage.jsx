const LABELS = ["A", "B", "C", "D"];

function CircularTimer({ secondsLeft, total }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.max(0, secondsLeft / total);
  const dashoffset = circumference * (1 - ratio);

  const color =
    secondsLeft > 30
      ? "#34d399"
      : secondsLeft > 15
      ? "#fbbf24"
      : "#f87171";

  return (
    <div className="timer-wrap">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle
          cx="48" cy="48" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="7"
        />
        <circle
          cx="48" cy="48" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          transform="rotate(-90 48 48)"
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s" }}
        />
        <text
          x="48" y="54"
          textAnchor="middle"
          fill={color}
          fontSize="22"
          fontWeight="bold"
          fontFamily="Inter, sans-serif"
          style={{ transition: "fill 0.4s" }}
        >
          {secondsLeft}
        </text>
      </svg>
      <span className="timer-label">seg</span>
    </div>
  );
}

export default function QuizPage({ game }) {
  const {
    currentQuestion,
    secondsLeft,
    myAnswer,
    questionReveal,
    submitAnswer,
    myPlayer,
  } = game;

  if (!currentQuestion) {
    return (
      <div className="page quiz-page quiz-loading">
        <div className="orb orb-1" />
        <p>Carregando pergunta…</p>
      </div>
    );
  }

  const { index, total, question, options, timeLimit } = currentQuestion;
  const revealed = questionReveal !== null;

  function getOptionClass(i) {
    let cls = "quiz-option";
    if (!revealed && myAnswer === null) cls += " quiz-option--available";
    if (!revealed && myAnswer === i) cls += " quiz-option--selected";
    if (!revealed && myAnswer !== null && myAnswer !== i) cls += " quiz-option--dimmed";
    if (revealed && i === questionReveal.correctIndex) cls += " quiz-option--correct";
    if (revealed && myAnswer === i && i !== questionReveal.correctIndex)
      cls += " quiz-option--wrong";
    if (revealed && myAnswer !== i && i !== questionReveal.correctIndex)
      cls += " quiz-option--dimmed";
    return cls;
  }

  return (
    <div className="page quiz-page">
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="quiz-container">
        {/* Header */}
        <div className="quiz-header">
          <div className="quiz-progress">
            <span className="quiz-progress-label">
              Pergunta {index + 1} de {total}
            </span>
            <div className="quiz-progress-bar">
              <div
                className="quiz-progress-fill"
                style={{ width: `${((index + 1) / total) * 100}%` }}
              />
            </div>
          </div>

          <CircularTimer secondsLeft={secondsLeft} total={timeLimit} />
        </div>

        {/* Pergunta */}
        <div className="quiz-question-card">
          <p className="quiz-question-text">{question}</p>
        </div>

        {/* Reveal banner */}
        {revealed && (
          <div className="quiz-reveal-banner">
            {myAnswer === null
              ? "⏰ Tempo esgotado! Você não respondeu a tempo."
              : myAnswer === questionReveal.correctIndex
              ? "🎉 Resposta correta!"
              : `❌ Resposta errada. Correto: ${questionReveal.correctAnswer}`}
          </div>
        )}

        {/* Opções */}
        <div className="quiz-options">
          {options.map((opt, i) => (
            <button
              key={i}
              id={`option-${i}`}
              className={getOptionClass(i)}
              onClick={() => !revealed && myAnswer === null && submitAnswer(i)}
              disabled={revealed || myAnswer !== null}
              aria-label={`Opção ${LABELS[i]}: ${opt}`}
            >
              <span className="quiz-option-label">{LABELS[i]}</span>
              <span className="quiz-option-text">{opt}</span>
              {revealed && i === questionReveal.correctIndex && (
                <span className="quiz-option-badge">✓</span>
              )}
              {revealed && myAnswer === i && i !== questionReveal.correctIndex && (
                <span className="quiz-option-badge quiz-option-badge--wrong">✗</span>
              )}
            </button>
          ))}
        </div>

        {/* Status de resposta */}
        {!revealed && myAnswer !== null && (
          <p className="quiz-answered-hint">
            ✅ Resposta enviada! Aguardando o tempo acabar…
          </p>
        )}

        <div className="quiz-player-info">
          Jogando como <strong>{myPlayer?.fullName}</strong>
        </div>
      </div>
    </div>
  );
}

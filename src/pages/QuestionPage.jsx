import { useState, useEffect, useRef } from "react";
import "./QuestionPage.css";

const OPTION_COLORS = ["a", "b", "c", "d"];
const OPTION_ICONS  = ["▲", "◆", "●", "■"];

export default function QuestionPage({ question, onAnswer, hasAnswered }) {
  const [timeLeft, setTimeLeft] = useState(question.timeLimit);
  const [selected, setSelected] = useState(null);
  const startTime = useRef(question.startTime || Date.now());

  useEffect(() => {
    setTimeLeft(question.timeLimit);
    setSelected(null);
    startTime.current = question.startTime || Date.now();

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime.current) / 1000;
      const remaining = Math.max(0, question.timeLimit - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval);
  }, [question]);

  const handleSelect = (index) => {
    if (hasAnswered || selected !== null) return;
    setSelected(index);
    onAnswer(index);
  };

  const progress = timeLeft / question.timeLimit;
  const isUrgent = timeLeft < question.timeLimit * 0.3;

  return (
    <div className="question-page anim-fade-in">
      {/* Header */}
      <div className="question-header">
        <div className="question-meta">
          <span className="badge badge-purple">
            {question.index + 1} / {question.total}
          </span>
          {hasAnswered && (
            <span className="badge badge-green">✓ Respondido</span>
          )}
        </div>

        <div className={`question-timer ${isUrgent ? "urgent" : ""}`}>
          <svg className="timer-ring" viewBox="0 0 52 52">
            <circle className="ring-bg" cx="26" cy="26" r="23" />
            <circle
              className="ring-fill"
              cx="26" cy="26" r="23"
              style={{
                strokeDashoffset: `${(1 - progress) * 144.51}px`,
              }}
            />
          </svg>
          <span className="timer-num">{Math.ceil(timeLeft)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar">
        <div
          className={`progress-fill ${isUrgent ? "danger" : ""}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Question text */}
      <div className="question-text-wrap card">
        <p className="question-text">{question.text}</p>
      </div>

      {/* Options */}
      <div className="options-grid">
        {question.options.map((opt, i) => (
          <button
            key={i}
            id={`option-${i}`}
            className={`option-btn opt-${OPTION_COLORS[i]} ${selected === i ? "selected" : ""} ${hasAnswered && selected !== i ? "dimmed" : ""}`}
            onClick={() => handleSelect(i)}
            disabled={hasAnswered || timeLeft <= 0}
          >
            <span className="option-icon">{OPTION_ICONS[i]}</span>
            <span className="option-text">{opt}</span>
          </button>
        ))}
      </div>

      {hasAnswered && (
        <p className="question-wait anim-fade-in">
          ⏳ Aguardando os outros jogadores...
        </p>
      )}
    </div>
  );
}

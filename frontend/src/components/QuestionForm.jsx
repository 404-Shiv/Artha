import { useState, useEffect, useCallback, useRef } from "react";
import questions from "../data/questions";

const STORAGE_KEY = "artha_answers";
const TOTAL = questions.length;

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToDisk(answers) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
}

export default function QuestionForm({ onComplete }) {
  const [answers, setAnswers] = useState(() => {
    const saved = loadSaved();
    // If all questions were already answered (stale complete session),
    // clear and start fresh so the user doesn't land on Q15
    if (Object.keys(saved).length >= TOTAL) {
      localStorage.removeItem(STORAGE_KEY);
      return {};
    }
    return saved;
  });
  const [currentIdx, setCurrentIdx] = useState(() => {
    const saved = loadSaved();
    // If all answered (stale), start from Q1
    if (Object.keys(saved).length >= TOTAL) return 0;
    // Otherwise resume from first unanswered
    const first = questions.findIndex((q) => !(q.id in saved));
    return first === -1 ? 0 : first;
  });
  const [slideClass, setSlideClass] = useState("slide-enter");
  const advanceTimer = useRef(null);

  // Persist answers
  useEffect(() => {
    saveToDisk(answers);
  }, [answers]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const question = questions[currentIdx];
  const progress = ((Object.keys(answers).length) / TOTAL) * 100;

  const goTo = useCallback(
    (idx, direction = "forward") => {
      setSlideClass("slide-exit");
      setTimeout(() => {
        setCurrentIdx(idx);
        setSlideClass(
          direction === "forward" ? "slide-enter" : "slide-back-enter"
        );
      }, 250);
    },
    []
  );

  const handleSelect = useCallback(
    (value) => {
      const updated = { ...answers, [question.id]: value };
      setAnswers(updated);

      // If this was the last question, submit
      if (currentIdx === TOTAL - 1) {
        // Clear saved answers so a refresh starts fresh
        localStorage.removeItem(STORAGE_KEY);
        // Small delay so the user sees their selection highlight
        advanceTimer.current = setTimeout(() => {
          onComplete(updated);
        }, 400);
        return;
      }

      // Auto-advance after brief feedback
      advanceTimer.current = setTimeout(() => {
        goTo(currentIdx + 1, "forward");
      }, 350);
    },
    [answers, currentIdx, question, goTo, onComplete]
  );

  const handleBack = useCallback(() => {
    if (currentIdx > 0) {
      goTo(currentIdx - 1, "back");
    }
  }, [currentIdx, goTo]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-8 text-center fade-in">
          <h1
            className="text-3xl font-bold tracking-tight mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-brand)" }}
            >
              Artha
            </span>
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Your AI Financial Advisor
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6 fade-in">
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs font-medium"
              style={{ color: "var(--color-text-muted)" }}
            >
              Question {currentIdx + 1} of {TOTAL}
            </span>
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--color-emerald-400)" }}
            >
              {Math.round(progress)}%
            </span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question Card */}
        <div className={`glass-card p-6 sm:p-8 ${slideClass}`} key={question.id}>
          <h2
            className="text-lg sm:text-xl font-semibold mb-6 leading-snug"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {question.text}
          </h2>

          <div className="flex flex-col gap-3">
            {question.options.map((opt, i) => {
              const isSelected = answers[question.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  id={`option-${question.id}-${opt.value}`}
                  className={`option-btn glass-card-hover ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  <span className="option-marker">
                    {isSelected ? "✓" : String.fromCharCode(65 + i)}
                  </span>
                  <div>
                    <div className="font-medium text-sm sm:text-base">
                      {opt.label}
                    </div>
                    <div
                      className="text-xs mt-0.5"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {opt.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Back button */}
          {currentIdx > 0 && (
            <div className="mt-6 flex justify-start">
              <button
                id="btn-back"
                className="btn-ghost"
                onClick={handleBack}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p
          className="text-center text-xs mt-6"
          style={{ color: "var(--color-text-muted)" }}
        >
          Your answers are saved automatically. Refresh safely.
        </p>
      </div>
    </div>
  );
}

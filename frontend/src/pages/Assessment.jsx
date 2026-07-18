import { useState, useEffect, useRef, useCallback } from "react";
import questions from "../data/questions";

const STORAGE_KEY = "artha_answers";
const TOTAL = questions.length;

const LOADING_MESSAGES = [
  "Analyzing your risk matrix…",
  "Scanning financial red flags…",
  "Mapping optimal asset allocation…",
  "Cross-referencing SEBI-regulated instruments…",
  "Artha is custom-building your wealth plan…",
];

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

// Section mapping
function getSection(idx) {
  if (idx < 3) return { id: 0, title: "Income & Demographics", subtitle: "Establishing your base financial profile" };
  if (idx < 7) return { id: 1, title: "Security & Liabilities", subtitle: "Assessing emergency buffers and debt load" };
  if (idx < 10) return { id: 2, title: "Investment Profile", subtitle: "Evaluating experience and risk tolerances" };
  return { id: 3, title: "Future Planning & Goals", subtitle: "Structuring tax, dependents, and wealth goals" };
}

// Confetti burst (Muted)
function Confetti({ active }) {
  if (!active) return null;

  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: "var(--color-accent)",
    delay: Math.random() * 0.5,
    size: Math.random() * 4 + 3,
  }));

  return (
    <div className="confetti-container">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            background: p.color,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            borderRadius: "50%",
          }}
        />
      ))}
    </div>
  );
}

// ── Progress Ring SVG (Teal Accent) ─────────────────────────────────────────────
function ProgressRing({ progress, size = 48 }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="-rotate-90">
      <circle
        cx="24" cy="24" r={radius}
        fill="none"
        stroke="var(--color-surface)"
        strokeWidth="3"
        opacity="0.3"
      />
      <circle
        cx="24" cy="24" r={radius}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="progress-ring-circle"
      />
    </svg>
  );
}

export default function Assessment({ navigateTo, onAssessmentSuccess }) {
  const [answers, setAnswers] = useState(() => {
    const saved = loadSaved();
    if (Object.keys(saved).length >= TOTAL) {
      localStorage.removeItem(STORAGE_KEY);
      return {};
    }
    return saved;
  });

  const [currentIdx, setCurrentIdx] = useState(() => {
    const saved = loadSaved();
    if (Object.keys(saved).length >= TOTAL) return 0;
    const first = questions.findIndex((q) => !(q.id in saved));
    return first === -1 ? 0 : first;
  });

  const [slideClass, setSlideClass] = useState("slide-enter");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [error, setError] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [sectionTransition, setSectionTransition] = useState(null);

  const advanceTimer = useRef(null);
  const prevSectionId = useRef(getSection(0).id);

  // Cycle loading messages
  useEffect(() => {
    if (!loading) return;
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[idx]);
    }, 2400);
    return () => clearInterval(interval);
  }, [loading]);

  // Persist answers
  useEffect(() => {
    saveToDisk(answers);
  }, [answers]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  // Keyboard nav
  useEffect(() => {
    if (loading) return;

    const handleKeyDown = (e) => {
      const question = questions[currentIdx];
      if (!question) return;

      let optionIdx = -1;
      if (e.key >= "1" && e.key <= "3") {
        optionIdx = parseInt(e.key) - 1;
      } else if (e.key.toLowerCase() >= "a" && e.key.toLowerCase() <= "c") {
        optionIdx = e.key.toLowerCase().charCodeAt(0) - 97;
      }

      if (optionIdx >= 0 && optionIdx < question.options.length) {
        handleSelect(question.options[optionIdx].value);
      }

      if ((e.key === "Backspace" || e.key === "ArrowLeft") && currentIdx > 0) {
        e.preventDefault();
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIdx, loading, answers]);

  const question = questions[currentIdx];
  const progress = (Object.keys(answers).length / TOTAL) * 100;
  const section = getSection(currentIdx);

  const goTo = useCallback((idx, direction = "forward") => {
    const nextSection = getSection(idx);
    const curSectionId = prevSectionId.current;

    if (nextSection.id !== curSectionId && direction === "forward") {
      setSectionTransition(nextSection);
      setTimeout(() => setSectionTransition(null), 800);
    }
    prevSectionId.current = nextSection.id;

    setSlideClass("slide-exit");
    setTimeout(() => {
      setCurrentIdx(idx);
      setSlideClass(direction === "forward" ? "slide-enter" : "slide-back-enter");
    }, 250);
  }, []);

  const handleComplete = useCallback(async (finalAnswers) => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);

    await new Promise((r) => setTimeout(r, 800));

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalAnswers),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Server responded ${res.status}: ${errBody}`);
      }

      const data = await res.json();
      localStorage.removeItem(STORAGE_KEY);
      onAssessmentSuccess(data);
      navigateTo("report");
    } catch (err) {
      console.error("Evaluation failed:", err);
      setError(err.message);
      setLoading(false);
    }
  }, [navigateTo, onAssessmentSuccess]);

  const handleSelect = useCallback((value) => {
    const updated = { ...answers, [question.id]: value };
    setAnswers(updated);

    if (currentIdx === TOTAL - 1) {
      advanceTimer.current = setTimeout(() => {
        handleComplete(updated);
      }, 400);
      return;
    }

    advanceTimer.current = setTimeout(() => {
      goTo(currentIdx + 1, "forward");
    }, 350);
  }, [answers, currentIdx, question?.id, goTo, handleComplete]);

  const handleBack = useCallback(() => {
    if (currentIdx > 0) {
      goTo(currentIdx - 1, "back");
    }
  }, [currentIdx, goTo]);

  // ─── CONFETTI ───
  if (showConfetti) {
    return <Confetti active={true} />;
  }

  // ─── LOADING SCREEN ───
  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-70px)] items-center justify-center px-4 relative z-10">
        <div className="text-center fade-in max-w-md">
          {/* Animated emblem */}
          <div className="flex justify-center mb-8">
            <div
              className="pulse-ring w-20 h-20 rounded-full flex items-center justify-center bg-[var(--color-surface)]"
            >
              <span
                className="text-3xl font-bold text-[var(--color-accent)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                A
              </span>
            </div>
          </div>

          <p
            className="text-lg font-semibold mb-4 h-8 text-white"
            style={{ fontFamily: "var(--font-display)" }}
            key={loadingMsg}
          >
            <span className="fade-in inline-block">{loadingMsg}</span>
          </p>

          <div className="mx-auto w-60 h-1 rounded-full shimmer" />

          <p className="text-xs mt-6 text-[var(--color-text-secondary)]">
            This usually takes 10-15 seconds...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-70px)] items-center justify-center px-4 py-8 relative z-10">
      {/* Section transition overlay */}
      {sectionTransition && (
        <div className="section-transition">
          <span
            className="text-xs uppercase font-bold tracking-widest mb-2 px-3 py-1 rounded-full border border-[var(--color-border)] text-white"
            style={{
              fontFamily: "var(--font-display)",
            }}
          >
            {sectionTransition.title}
          </span>
          <p className="text-sm mt-2 text-[var(--color-text-secondary)]">
            {sectionTransition.subtitle}
          </p>
        </div>
      )}

      <div className="w-full max-w-xl">
        {/* Section Header + Progress Ring */}
        <div className="mb-6 fade-in flex items-center justify-between">
          <div className="flex flex-col">
            <span
              className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border border-[var(--color-border)] inline-block w-fit text-[var(--color-accent)]"
              style={{
                fontFamily: "var(--font-display)",
              }}
            >
              {section.title}
            </span>
            <p className="text-xs mt-2 font-medium text-[var(--color-text-muted)]">
              {section.subtitle}
            </p>
          </div>

          {/* Circular progress */}
          <div className="relative flex-shrink-0">
            <ProgressRing progress={progress} />
            <span
              className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[var(--color-accent)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Question Card */}
        <div className={`glass-card overflow-hidden ${slideClass}`} key={question.id}>
          {/* Progress bar */}
          <div className="w-full h-1 relative bg-[var(--color-surface)]">
            <div
              className="absolute left-0 top-0 h-full transition-all duration-500 ease-out bg-[var(--color-accent)]"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="p-6 sm:p-8">
            {/* Question Progress Info */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]" style={{ fontFamily: "var(--font-display)" }}>
                Question {currentIdx + 1} of {TOTAL}
              </span>
              <span className="text-xs font-bold text-[var(--color-accent)]">
                {Math.round(progress)}% Complete
              </span>
            </div>

            <h2
              className="text-lg sm:text-xl font-bold mb-6 leading-snug text-white"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
            >
              {question.text}
            </h2>

            <div className="flex flex-col gap-3.5">
              {question.options.map((opt, i) => {
                const isSelected = answers[question.id] === opt.value;
                const shortcutKey = String.fromCharCode(65 + i);
                return (
                  <button
                    key={opt.value}
                    id={`option-${question.id}-${opt.value}`}
                    className={`option-btn ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelect(opt.value)}
                  >
                    <span className="option-marker text-xs">
                      {isSelected ? "✓" : shortcutKey}
                    </span>
                    <div className="flex-1 relative z-10">
                      <div className="font-semibold text-sm sm:text-base text-white">
                        {opt.label}
                      </div>
                      <div className="text-xs mt-0.5 text-[var(--color-text-secondary)]">
                        {opt.description}
                      </div>
                    </div>
                    <span className="kbd hidden sm:flex relative z-10">{i + 1}</span>
                  </button>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="mt-8 flex justify-between items-center" style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
              {currentIdx > 0 ? (
                <button id="btn-back" className="btn-ghost px-4 py-2" onClick={handleBack}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              ) : <div />}

              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear your current progress and restart?")) {
                    localStorage.removeItem(STORAGE_KEY);
                    setAnswers({});
                    setCurrentIdx(0);
                    prevSectionId.current = 0;
                  }
                }}
                className="btn-ghost text-xs px-3 py-1.5 hover:text-white hover:border-white/30"
                style={{ color: "var(--color-text-muted)" }}
              >
                Reset Progress
              </button>
            </div>
          </div>
        </div>

        {/* Error Toast */}
        {error && (
          <div
            className="fixed bottom-8 left-1/2 -translate-x-1/2 glass-card px-6 py-4 flex items-center gap-4 fade-in z-50 shadow-2xl max-w-md w-[90%]"
            style={{
              borderColor: "rgba(255, 255, 255, 0.2)",
              background: "#000000",
            }}
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white">
                Evaluation Failed
              </div>
              <div className="text-xs mt-0.5 text-white/60 truncate" title={error}>
                {error}
              </div>
            </div>
            <button
              className="py-1.5 px-3 text-xs font-semibold rounded-lg flex-shrink-0 bg-white text-black hover:bg-white/90"
              onClick={() => handleComplete(answers)}
            >
              Retry
            </button>
          </div>
        )}

        {/* Footer hint */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Auto-saved • Use keyboard <span className="kbd">1</span> <span className="kbd">2</span> <span className="kbd">3</span> to select
          </p>
        </div>
      </div>
    </div>
  );
}

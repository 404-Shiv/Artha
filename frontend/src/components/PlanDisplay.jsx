import { useState, useCallback } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

const TIER_LABEL = {
  Conservative: "Conservative",
  Moderate: "Moderate",
  Aggressive: "Aggressive",
};

const TIER_CLASS = {
  Conservative: "conservative",
  Moderate: "moderate",
  Aggressive: "aggressive",
};

export default function PlanDisplay({ data, onReset }) {
  const { score, risk_tier, plan } = data;

  // Toggle state: "detailed" (default) or "short"
  const [viewMode, setViewMode] = useState("detailed");
  // Cached short version (fetched once from the summarizer API)
  const [shortPlan, setShortPlan] = useState(null);
  // Loading state while summarizer runs
  const [summarizing, setSummarizing] = useState(false);

  const handleToggle = useCallback(async () => {
    // If switching to detailed, just flip
    if (viewMode === "short") {
      setViewMode("detailed");
      return;
    }

    // Switching to short — use cached version if available
    if (shortPlan) {
      setViewMode("short");
      return;
    }

    // First time: call the AI summarizer
    setSummarizing(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) {
        throw new Error(`Summarizer failed: ${res.status}`);
      }

      const data = await res.json();
      setShortPlan(data.short_plan);
      setViewMode("short");
    } catch (err) {
      console.error("Summarize error:", err);
      // Fallback: show detailed if summarizer fails
    } finally {
      setSummarizing(false);
    }
  }, [viewMode, shortPlan, plan]);

  const currentPlan = viewMode === "short" && shortPlan ? shortPlan : plan;

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8 fade-in">
          <h1
            className="text-3xl sm:text-4xl font-bold mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-brand)" }}
            >
              Your Wealth Plan
            </span>
          </h1>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Personalised by Artha — Powered by AI
          </p>
        </div>

        {/* Score + Tier + Controls */}
        <div
          className="glass-card p-6 mb-6 fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Score ring */}
              <div className="relative flex items-center justify-center w-20 h-20">
                <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke="var(--color-surface)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke="url(#scoreGrad)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${(score / 45) * 213.6} 213.6`}
                    style={{ transition: "stroke-dasharray 1s ease" }}
                  />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--color-emerald-400)" />
                      <stop offset="100%" stopColor="var(--color-violet-400)" />
                    </linearGradient>
                  </defs>
                </svg>
                <span
                  className="absolute text-xl font-bold"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {score}
                </span>
              </div>

              <div>
                <div
                  className="text-xs mb-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Risk Score (out of 45)
                </div>
                <span className={`tier-badge ${TIER_CLASS[risk_tier]}`}>
                  {TIER_LABEL[risk_tier]}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Short / Detailed toggle */}
              <button
                id="btn-toggle-version"
                className={`btn-toggle ${summarizing ? "loading" : ""}`}
                onClick={handleToggle}
                disabled={summarizing}
                title={
                  viewMode === "detailed"
                    ? "Condense to a short summary"
                    : "Show the full detailed plan"
                }
              >
                {summarizing ? (
                  <>
                    <span className="toggle-spinner" />
                    Summarizing...
                  </>
                ) : (
                  <>
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
                      {viewMode === "detailed" ? (
                        <>
                          <path d="M21 6H3" />
                          <path d="M15 12H3" />
                          <path d="M11 18H3" />
                        </>
                      ) : (
                        <>
                          <path d="M21 6H3" />
                          <path d="M21 12H3" />
                          <path d="M21 18H3" />
                        </>
                      )}
                    </svg>
                    {viewMode === "detailed" ? "Short Version" : "Detailed Version"}
                  </>
                )}
              </button>

              {/* Start Over */}
              <button id="btn-start-over" className="btn-ghost" onClick={onReset}>
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
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Start Over
              </button>
            </div>
          </div>
        </div>

        {/* Version indicator */}
        <div
          className="flex items-center justify-center gap-2 mb-4 fade-in"
          style={{ animationDelay: "0.15s" }}
        >
          <span
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{
              background:
                viewMode === "short"
                  ? "rgba(16, 185, 129, 0.12)"
                  : "rgba(139, 92, 246, 0.12)",
              color:
                viewMode === "short"
                  ? "var(--color-emerald-400)"
                  : "var(--color-violet-400)",
              border: `1px solid ${
                viewMode === "short"
                  ? "rgba(16, 185, 129, 0.25)"
                  : "rgba(139, 92, 246, 0.25)"
              }`,
            }}
          >
            {viewMode === "short"
              ? "Short Summary — AI Condensed"
              : "Detailed Plan — Full Report"}
          </span>
        </div>

        {/* AI-generated Markdown plan */}
        <div
          className="glass-card p-6 sm:p-8 fade-in"
          style={{ animationDelay: "0.2s" }}
          key={viewMode}
        >
          <div className="prose prose-invert max-w-none">
            <Markdown remarkPlugins={[remarkGfm]}>{currentPlan}</Markdown>
          </div>
        </div>

        {/* Bottom actions */}
        <div
          className="flex justify-center mt-8 fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          <button id="btn-reset-bottom" className="btn-primary" onClick={onReset}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Take the Quiz Again
          </button>
        </div>

        {/* Disclaimer */}
        <p
          className="text-center text-xs mt-8 max-w-md mx-auto leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          Artha provides AI-generated educational guidance, not certified financial
          advice. Always consult a SEBI-registered advisor before making investment
          decisions.
        </p>
      </div>
    </div>
  );
}

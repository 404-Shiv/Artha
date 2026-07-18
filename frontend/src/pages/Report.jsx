import { useState, useEffect, useCallback } from "react";
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

// Status badge color mapping (strictly green, black, white)
const STATUS_COLORS = {
  "Critical Gap": { bg: "rgba(255, 255, 255, 0.02)", text: "#ffffff", border: "rgba(255, 255, 255, 0.15)" },
  "Needs Restructuring": { bg: "rgba(255, 255, 255, 0.02)", text: "#ffffff", border: "rgba(255, 255, 255, 0.15)" },
  "Balanced": { bg: "rgba(16, 163, 127, 0.04)", text: "var(--color-accent)", border: "rgba(16, 163, 127, 0.15)" },
  "Optimum": { bg: "rgba(16, 163, 127, 0.08)", text: "var(--color-accent)", border: "rgba(16, 163, 127, 0.25)" },
};

function getStatusStyle(status) {
  return STATUS_COLORS[status] || STATUS_COLORS["Balanced"];
}

// Animated count-up
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return value;
}

// ── Section Header Component ──
function SectionHeader({ number, title }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span
        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{
          background: "rgba(16, 163, 127, 0.08)",
          color: "var(--color-accent)",
          fontFamily: "var(--font-display)",
        }}
      >
        {number}
      </span>
      <h3
        className="text-base sm:text-lg font-bold text-white"
        style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
      >
        {title}
      </h3>
    </div>
  );
}

// ── Structured Plan Renderer ──
function StructuredPlanView({ plan }) {
  return (
    <div className="flex flex-col gap-6">

      {/* 1. Quick Take */}
      {plan.quick_take && (
        <div>
          <SectionHeader number="1" title="Hello & Quick Take" />
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {plan.quick_take}
          </p>
        </div>
      )}

      {/* 2. Financial Matrix */}
      {plan.financial_matrix && plan.financial_matrix.length > 0 && (
        <div>
          <SectionHeader number="2" title="Proprietary Financial Matrix" />
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <th className="text-left py-2.5 px-3 font-bold uppercase tracking-wider text-[var(--color-text-muted)]" style={{ fontFamily: "var(--font-display)", fontSize: "10px" }}>
                    Metric Area
                  </th>
                  <th className="text-left py-2.5 px-3 font-bold uppercase tracking-wider text-[var(--color-text-muted)]" style={{ fontFamily: "var(--font-display)", fontSize: "10px" }}>
                    Estimated Ratio
                  </th>
                  <th className="text-left py-2.5 px-3 font-bold uppercase tracking-wider text-[var(--color-text-muted)]" style={{ fontFamily: "var(--font-display)", fontSize: "10px" }}>
                    Advisory Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {plan.financial_matrix.map((row, i) => {
                  const statusStyle = getStatusStyle(row.advisory_status);
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: i < plan.financial_matrix.length - 1 ? "1px solid var(--color-border)" : "none",
                      }}
                    >
                      <td className="py-2.5 px-3 font-semibold text-white">{row.metric_area}</td>
                      <td className="py-2.5 px-3 font-bold" style={{ color: "var(--color-accent)" }}>{row.estimated_ratio}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            background: statusStyle.bg,
                            color: statusStyle.text,
                            border: `1px solid ${statusStyle.border}`,
                          }}
                        >
                          {row.advisory_status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Tactical Directives */}
      {plan.tactical_directives && plan.tactical_directives.length > 0 && (
        <div>
          <SectionHeader number="3" title="Immediate Tactical Directives" />
          <div className="flex flex-col gap-3">
            {plan.tactical_directives.map((directive, i) => (
              <div
                key={i}
                className="rounded-xl p-4"
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                    style={{
                      background: "rgba(201, 162, 39, 0.1)",
                      color: "var(--color-gold-400)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-bold text-sm text-white mb-1">{directive.title}</div>
                    <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                      {directive.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Asset Allocation */}
      {plan.asset_allocation && plan.asset_allocation.length > 0 && (
        <div>
          <SectionHeader number="4" title="Strategic Asset Weight Allocation" />
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  {["Asset Category", "Target", "SEBI Instrument", "Rationale"].map((h) => (
                    <th
                      key={h}
                      className="text-left py-2.5 px-3 font-bold uppercase tracking-wider text-[var(--color-text-muted)]"
                      style={{ fontFamily: "var(--font-display)", fontSize: "10px" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plan.asset_allocation.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: i < plan.asset_allocation.length - 1 ? "1px solid var(--color-border)" : "none",
                    }}
                  >
                    <td className="py-2.5 px-3 font-semibold text-white">{row.asset_category}</td>
                    <td className="py-2.5 px-3 font-bold" style={{ color: "var(--color-accent)" }}>{row.target_allocation}</td>
                    <td className="py-2.5 px-3 text-[var(--color-text-secondary)]">{row.instrument_vehicle}</td>
                    <td className="py-2.5 px-3 text-[var(--color-text-muted)]">{row.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {plan.sip_note && (
            <div
              className="mt-3 rounded-lg p-3 text-xs leading-relaxed"
              style={{
                background: "rgba(16, 163, 127, 0.04)",
                border: "1px solid rgba(16, 163, 127, 0.1)",
                color: "var(--color-text-secondary)",
              }}
            >
              <span className="font-bold text-[var(--color-accent)]">SIP Advantage: </span>
              {plan.sip_note}
            </div>
          )}
        </div>
      )}

      {/* 5. Operational Roadmap */}
      {((plan.roadmap_1_year && plan.roadmap_1_year.length > 0) ||
        (plan.roadmap_3_year && plan.roadmap_3_year.length > 0)) && (
        <div>
          <SectionHeader number="5" title="Operational Roadmap" />
          <div className="grid sm:grid-cols-2 gap-4">
            {plan.roadmap_1_year && plan.roadmap_1_year.length > 0 && (
              <div
                className="rounded-xl p-4"
                style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--color-border)" }}
              >
                <div
                  className="text-[10px] uppercase font-bold tracking-wider mb-3 text-[var(--color-accent)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  1-Year Goals
                </div>
                <ul className="flex flex-col gap-2">
                  {plan.roadmap_1_year.map((goal, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-1.5 flex-shrink-0" />
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {plan.roadmap_3_year && plan.roadmap_3_year.length > 0 && (
              <div
                className="rounded-xl p-4"
                style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--color-border)" }}
              >
                <div
                  className="text-[10px] uppercase font-bold tracking-wider mb-3"
                  style={{ fontFamily: "var(--font-display)", color: "#60a5fa" }}
                >
                  3-Year Goals
                </div>
                <ul className="flex flex-col gap-2">
                  {plan.roadmap_3_year.map((goal, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#60a5fa" }} />
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Risk Warnings */}
      {plan.risk_warnings && plan.risk_warnings.length > 0 && (
        <div>
          <SectionHeader number="6" title="Artha Risk Advisory Warnings" />
          <div className="flex flex-col gap-2.5">
            {plan.risk_warnings.map((warning, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg p-3 text-xs"
                style={{
                  background: "rgba(201, 162, 39, 0.04)",
                  border: "1px solid rgba(201, 162, 39, 0.1)",
                }}
              >
                <span
                  className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                  style={{
                    background: "rgba(201, 162, 39, 0.15)",
                    color: "var(--color-gold-400)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  !
                </span>
                <p className="leading-relaxed text-[var(--color-text-secondary)]">{warning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Executive Summary */}
      {plan.executive_summary && plan.executive_summary.length > 0 && (
        <div>
          <SectionHeader number="7" title="Plan Executive Summary" />
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <th className="text-left py-2.5 px-3 font-bold uppercase tracking-wider text-[var(--color-text-muted)]" style={{ fontFamily: "var(--font-display)", fontSize: "10px" }}>
                    Plan Variable
                  </th>
                  <th className="text-left py-2.5 px-3 font-bold uppercase tracking-wider text-[var(--color-text-muted)]" style={{ fontFamily: "var(--font-display)", fontSize: "10px" }}>
                    Advisory Recommendation
                  </th>
                </tr>
              </thead>
              <tbody>
                {plan.executive_summary.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: i < plan.executive_summary.length - 1 ? "1px solid var(--color-border)" : "none",
                    }}
                  >
                    <td className="py-2.5 px-3 font-semibold text-white">{row.variable}</td>
                    <td className="py-2.5 px-3 font-bold" style={{ color: "var(--color-accent)" }}>{row.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. Closing Counsel */}
      {plan.closing_counsel && (
        <div>
          <SectionHeader number="8" title="Closing Counsel" />
          <div
            className="rounded-xl p-4 text-sm leading-relaxed"
            style={{
              background: "rgba(16, 163, 127, 0.04)",
              border: "1px solid rgba(16, 163, 127, 0.12)",
              color: "var(--color-text-secondary)",
            }}
          >
            {plan.closing_counsel}
          </div>
        </div>
      )}
    </div>
  );
}


export default function Report({ data, navigateTo, onReset }) {
  // Empty state
  if (!data) {
    return (
      <div className="min-h-[calc(100vh-70px)] px-4 py-16 flex items-center justify-center relative z-10 fade-in">
        <div className="glass-card p-8 sm:p-10 text-center max-w-md">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(201, 162, 39, 0.08)" }}
          >
            <svg
              width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke="var(--color-aurora-amber)" strokeWidth="1.5"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h2
            className="text-xl font-bold mb-2 text-white"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            No Active Report
          </h2>
          <p className="text-sm mb-6 text-[var(--color-text-secondary)]">
            Complete the 15-question financial assessment to generate your personalized AI wealth plan.
          </p>
          <button
            onClick={() => navigateTo("assessment")}
            className="btn-primary w-full justify-center"
          >
            Start Assessment
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  const { score, risk_tier, plan, flags = [] } = data;
  const animatedScore = useCountUp(score, 1500);

  // Determine if plan is structured JSON or legacy markdown string
  const isStructuredPlan = plan && typeof plan === "object";

  // View mode
  const [viewMode, setViewMode] = useState("detailed");
  const [shortPlan, setShortPlan] = useState(data.shortPlan || null);
  const [summarizing, setSummarizing] = useState(false);

  const handleToggle = useCallback(async () => {
    if (viewMode === "short") {
      setViewMode("detailed");
      return;
    }

    if (shortPlan) {
      setViewMode("short");
      return;
    }

    setSummarizing(true);
    try {
      // Serialize plan to text for the summarizer
      const planText = isStructuredPlan ? JSON.stringify(plan, null, 2) : plan;

      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planText }),
      });

      if (!res.ok) throw new Error(`Summarizer failed: ${res.status}`);

      const summaryData = await res.json();
      setShortPlan(summaryData.short_plan);
      setViewMode("short");
      data.shortPlan = summaryData.short_plan;
    } catch (err) {
      console.error("Summarize error:", err);
    } finally {
      setSummarizing(false);
    }
  }, [viewMode, shortPlan, plan, data, isStructuredPlan]);

  return (
    <div className="min-h-[calc(100vh-70px)] px-4 py-8 sm:py-12 relative z-10">
      <div className="mx-auto max-w-3xl">

        {/* ─── HEADER ─── */}
        <div className="text-center mb-8 fade-in">
          <div
            className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-accent)]"
            style={{
              fontFamily: "var(--font-display)",
            }}
          >
            Advisory Report
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold mb-2 text-white"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
          >
            Your Wealth Plan
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            Personalized recommendations generated by Artha AI Advisor
          </p>
        </div>

        {/* ─── SCORE + TIER PANEL ─── */}
        <div className="glass-card p-6 sm:p-8 mb-6 fade-in-up stagger-1">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Score Ring */}
            <div className="relative flex items-center justify-center w-28 h-28 flex-shrink-0">
              <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke="var(--color-surface)" strokeWidth="4" opacity="0.4"
                />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke="var(--color-accent)" strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(score / 45) * 213.6} 213.6`}
                  className="score-ring-animate"
                />
              </svg>
              <span
                className="absolute text-2xl font-bold score-count-up text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {animatedScore}
              </span>
            </div>

            {/* Tier info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="text-[10px] uppercase font-bold tracking-wider mb-1.5 text-[var(--color-text-muted)]" style={{ fontFamily: "var(--font-display)" }}>
                Risk Score (out of 45)
              </div>
              <div className="flex items-center gap-3 justify-center sm:justify-start mb-3">
                <span className={`tier-badge ${TIER_CLASS[risk_tier]}`}>
                  {TIER_LABEL[risk_tier]} Profile
                </span>
              </div>
              <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                {risk_tier === "Conservative" && "Your profile prioritizes capital preservation and steady returns with minimal volatility exposure."}
                {risk_tier === "Moderate" && "Your profile balances growth potential with stability, mixing equity with protective instruments."}
                {risk_tier === "Aggressive" && "Your profile targets maximum wealth compounding, accepting short-term volatility for long-term gains."}
              </p>
            </div>

            {/* Quick actions */}
            <div className="flex sm:flex-col gap-2">
              <button
                onClick={() => navigateTo("portfolio")}
                className="btn-ghost text-xs px-3 py-2 font-semibold text-[var(--color-accent)] border-[rgba(16,163,127,0.15)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>
                </svg>
                Portfolio
              </button>
              <button
                onClick={() => window.print()}
                className="btn-ghost text-xs p-2"
                title="Print Report"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ─── RED FLAG ALERTS ─── */}
        {flags.length > 0 && (
          <div className="flex flex-col gap-3 mb-6">
            {flags.includes("no_insurance") && (
              <div className="flag-card danger" style={{ animationDelay: "0.1s" }}>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255, 255, 255, 0.04)" }}
                >
                  <span className="text-base font-bold text-white">!</span>
                </div>
                <div>
                  <div className="font-bold text-sm text-white">
                    Critical Insurance Gap Detected
                  </div>
                  <div className="text-xs mt-1 leading-relaxed text-[var(--color-text-secondary)]">
                    You indicated having no health/life insurance. Under SEBI wealth management guidelines, having basic cover is the foundational security layer. We advise securing personal insurance before purchasing market securities.
                  </div>
                </div>
              </div>
            )}
            {flags.includes("high_debt") && (
              <div className="flag-card warning" style={{ animationDelay: "0.2s" }}>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255, 255, 255, 0.04)" }}
                >
                  <span className="text-base font-bold text-white">!</span>
                </div>
                <div>
                  <div className="font-bold text-sm text-white">
                    High-Interest Debt Alert
                  </div>
                  <div className="text-xs mt-1 leading-relaxed text-[var(--color-text-secondary)]">
                    You carry high-interest debt (&gt;15%). High compound interest liabilities drain cash flow faster than portfolios grow. We recommend a debt clearance strategy (Snowball or Avalanche) first.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── PLAN VERSION CONTROLS ─── */}
        <div className="flex items-center justify-between mb-4 px-1 fade-in-up stagger-2">
          <span
            className="text-[10px] font-bold px-3 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)]"
            style={{
              fontFamily: "var(--font-display)",
            }}
          >
            {viewMode === "short" ? "Summary View" : "Full Advisory Report"}
          </span>

          <button
            id="btn-toggle-version"
            className={`btn-toggle ${summarizing ? "loading" : ""}`}
            onClick={handleToggle}
            disabled={summarizing}
            title={viewMode === "detailed" ? "Condense to a short summary" : "Show the full detailed plan"}
          >
            {summarizing ? (
              <>
                <span className="toggle-spinner" />
                Summarizing...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {viewMode === "detailed" ? (
                    <><path d="M21 6H3" /><path d="M15 12H3" /><path d="M11 18H3" /></>
                  ) : (
                    <><path d="M21 6H3" /><path d="M21 12H3" /><path d="M21 18H3" /></>
                  )}
                </svg>
                {viewMode === "detailed" ? "Short Version" : "Detailed Version"}
              </>
            )}
          </button>
        </div>

        {/* ─── AI ADVISORY CONTENT ─── */}
        <div className="glass-card p-6 sm:p-8 mb-8 fade-in-up stagger-3" key={viewMode}>
          {viewMode === "short" && shortPlan ? (
            /* Summary is always markdown text from the summarizer */
            <div className="prose prose-invert max-w-none text-[var(--color-text-primary)]">
              <Markdown remarkPlugins={[remarkGfm]}>{shortPlan}</Markdown>
            </div>
          ) : isStructuredPlan ? (
            /* Structured JSON plan */
            <StructuredPlanView plan={plan} />
          ) : (
            /* Legacy markdown fallback for old cached plans */
            <div className="prose prose-invert max-w-none text-[var(--color-text-primary)]">
              <Markdown remarkPlugins={[remarkGfm]}>{plan}</Markdown>
            </div>
          )}
        </div>

        {/* ─── BOTTOM NAVIGATION ─── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8" style={{ borderTop: "1px solid var(--color-border)" }}>
          <button
            onClick={() => navigateTo("portfolio")}
            className="w-full sm:w-auto btn-primary justify-center px-6"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>
            </svg>
            Visualize Allocation
          </button>

          <button
            onClick={onReset}
            className="w-full sm:w-auto btn-ghost justify-center px-6"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Retake Assessment
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-[10px] mt-8 max-w-md mx-auto leading-relaxed text-[var(--color-text-muted)]">
          Disclaimer: Artha provides AI-generated educational models, not certified financial planning. Always cross-verify strategies with SEBI-registered professionals.
        </p>
      </div>
    </div>
  );
}

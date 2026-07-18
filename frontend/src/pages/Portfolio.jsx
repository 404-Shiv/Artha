import { useState, useEffect, useMemo } from "react";

const ALLOCATIONS = {
  Conservative: {
    equity: 20, debt: 60, gold: 15, cash: 5,
    desc: "Focuses on capital preservation, steady cash flows, and low-volatility returns. Prioritizes safety using government-backed debt, corporate bonds, and liquid reserves.",
  },
  Moderate: {
    equity: 50, debt: 30, gold: 10, cash: 10,
    desc: "Balances capital appreciation with drawdown protection. Achieves growth via broad equity indices while retaining stability through high-grade debt and gold hedges.",
  },
  Aggressive: {
    equity: 80, debt: 10, gold: 5, cash: 5,
    desc: "Optimised for long-term wealth compounding and inflation-beating yields. Accepts near-term fluctuations to capture compounding equity returns.",
  },
};

const SUGGESTIONS = {
  equity: [
    { name: "Nifty 50 Index Mutual Fund", reason: "Low cost, matches top 50 Indian companies." },
    { name: "Nifty Next 50 / Midcap Index", reason: "Adds exposure to high-growth mid-sized firms." },
  ],
  debt: [
    { name: "Public Provident Fund (PPF)", reason: "Tax-free 7.1% guaranteed long-term return." },
    { name: "Banking & PSU Debt Fund", reason: "High liquidity, exposure to AAA bonds." },
  ],
  gold: [
    { name: "Sovereign Gold Bonds (SGB)", reason: "Earns 2.5% annual interest + tax-free gains on maturity." },
    { name: "Gold ETF / Gold Bees", reason: "Highly liquid, tracks spot price directly." },
  ],
  cash: [
    { name: "Liquid Mutual Fund", reason: "High liquidity, yields 6-7% with instant redemption." },
    { name: "Sweep-In Bank Fixed Deposit", reason: "No lock-in, yields higher than normal savings." },
  ],
};

const ASSET_COLORS = {
  equity: "#10a37f",
  debt: "#ffffff",
  gold: "rgba(255, 255, 255, 0.45)",
  cash: "rgba(255, 255, 255, 0.15)",
};

const ASSET_LABELS = {
  equity: "Equity",
  debt: "Debt/Bonds",
  gold: "Gold",
  cash: "Liquid Cash",
};

const ASSET_SUBTITLES = {
  equity: "Wealth growth",
  debt: "Stability & income",
  gold: "Inflation hedge",
  cash: "Emergency buffer",
};

// SIP growth calculation
function calculateSipProjected(annualRate, monthlySip, years) {
  const months = years * 12;
  const r = annualRate / 100 / 12;
  if (r === 0) {
    const totalInvested = monthlySip * months;
    return { invested: totalInvested, value: totalInvested, gain: 0 };
  }
  const futureValue = monthlySip * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
  const totalInvested = monthlySip * months;
  const gain = Math.max(0, futureValue - totalInvested);
  return {
    invested: totalInvested,
    value: Math.round(futureValue),
    gain: Math.round(gain),
  };
}

// Generate SVG growth curve
function generateGrowthPath(annualRate, monthlySip, years, width = 300, height = 120) {
  const months = years * 12;
  const r = annualRate / 100 / 12;
  const points = [];
  const stepMonth = Math.max(1, Math.floor(months / 30));

  for (let m = 0; m <= months; m += stepMonth) {
    if (r === 0) {
      points.push(monthlySip * m);
    } else {
      const fv = m === 0 ? 0 : monthlySip * ((Math.pow(1 + r, m) - 1) / r) * (1 + r);
      points.push(fv);
    }
  }

  // Ensure last point is exactly final value
  if (months % stepMonth !== 0) {
    if (r === 0) {
      points.push(monthlySip * months);
    } else {
      const fv = monthlySip * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
      points.push(fv);
    }
  }

  const maxVal = Math.max(...points) || 1;
  const stepX = width / (points.length - 1);

  let path = "";
  let areaPath = "";
  const coords = points.map((v, i) => ({
    x: i * stepX,
    y: height - (v / maxVal) * (height - 10) - 5,
  }));

  coords.forEach((pt, i) => {
    if (i === 0) {
      path += `M ${pt.x} ${pt.y}`;
      areaPath += `M ${pt.x} ${height}L ${pt.x} ${pt.y}`;
    } else {
      const prev = coords[i - 1];
      const cpx = (prev.x + pt.x) / 2;
      path += ` C ${cpx} ${prev.y} ${cpx} ${pt.y} ${pt.x} ${pt.y}`;
      areaPath += ` C ${cpx} ${prev.y} ${cpx} ${pt.y} ${pt.x} ${pt.y}`;
    }
  });

  areaPath += ` L ${coords[coords.length - 1].x} ${height} Z`;
  return { path, areaPath, coords, maxVal };
}

// Donut Chart
function DonutChart({ allocation, size = 200 }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const strokeWidth = 24;

  const segments = ["equity", "debt", "gold", "cash"];
  let cumulativeOffset = 0;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full" style={{ maxWidth: size }}>
      {/* Background ring */}
      <circle
        cx={center} cy={center} r={radius}
        fill="none" stroke="var(--color-surface)"
        strokeWidth={strokeWidth} opacity="0.25"
      />

      {/* Segments */}
      {segments.map((key) => {
        const pct = allocation[key] / 100;
        const dashArray = animated ? pct * circumference : 0;
        const dashOffset = -cumulativeOffset * circumference;
        cumulativeOffset += pct;

        return (
          <circle
            key={key}
            cx={center} cy={center} r={radius}
            fill="none"
            stroke={ASSET_COLORS[key]}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashArray} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="butt"
            className="donut-segment"
            style={{
              transformOrigin: "center",
              transform: "rotate(-90deg)",
              transition: animated ? "stroke-dasharray 1.2s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
            }}
          />
        );
      })}

      {/* Center text */}
      <text
        x={center} y={center - 6}
        textAnchor="middle"
        fill="var(--color-text-primary)"
        fontSize="14" fontWeight="700"
        fontFamily="var(--font-display)"
      >
        {allocation.equity}%
      </text>
      <text
        x={center} y={center + 10}
        textAnchor="middle"
        fill="var(--color-text-muted)"
        fontSize="8" fontWeight="600"
        fontFamily="var(--font-display)"
        letterSpacing="0.08em"
      >
        EQUITY
      </text>
    </svg>
  );
}

export default function Portfolio({ data, navigateTo }) {
  if (!data) {
    return (
      <div className="min-h-[calc(100vh-70px)] px-4 py-16 flex items-center justify-center relative z-10 fade-in">
        <div className="glass-card p-8 sm:p-10 text-center max-w-md">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(255, 255, 255, 0.04)" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
            </svg>
          </div>
          <h2
            className="text-xl font-bold mb-2 text-white"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            Allocation Unavailable
          </h2>
          <p className="text-sm mb-6 text-[var(--color-text-secondary)]">
            Complete the assessment to access custom asset allocations and the portfolio simulator.
          </p>
          <button
            onClick={() => navigateTo("assessment")}
            className="btn-primary w-full justify-center"
          >
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  const { risk_tier } = data;
  const recom = ALLOCATIONS[risk_tier] || ALLOCATIONS.Moderate;

  const [compareView, setCompareView] = useState(risk_tier);
  const activeAlloc = ALLOCATIONS[compareView] || ALLOCATIONS.Moderate;

  const [simEquity, setSimEquity] = useState(recom.equity);
  const [sipAmount, setSipAmount] = useState(10000);
  const [years, setYears] = useState(10);
  const [inflationRate, setInflationRate] = useState(6);

  const [simAllocation, setSimAllocation] = useState({
    equity: recom.equity, debt: recom.debt, gold: recom.gold, cash: recom.cash,
  });

  // Re-distribute on equity change
  useEffect(() => {
    const remaining = 100 - simEquity;
    const sumOthers = recom.debt + recom.gold + recom.cash;
    let d = 0, g = 0, c = 0;
    if (sumOthers > 0) {
      d = Math.round((recom.debt / sumOthers) * remaining);
      g = Math.round((recom.gold / sumOthers) * remaining);
      c = 100 - simEquity - d - g;
    } else {
      d = Math.round(remaining * 0.7);
      g = Math.round(remaining * 0.2);
      c = remaining - d - g;
    }
    setSimAllocation({
      equity: simEquity,
      debt: Math.max(0, d),
      gold: Math.max(0, g),
      cash: Math.max(0, c),
    });
  }, [simEquity, recom]);

  const weightedReturn =
    (simAllocation.equity * 13.5 +
      simAllocation.debt * 7.2 +
      simAllocation.gold * 9.0 +
      simAllocation.cash * 4.5) / 100;

  const simResult = calculateSipProjected(weightedReturn, sipAmount, years);

  const inflationAdjustedValue = Math.round(
    simResult.value / Math.pow(1 + inflationRate / 100, years)
  );

  const growthData = useMemo(
    () => generateGrowthPath(weightedReturn, sipAmount, years),
    [weightedReturn, sipAmount, years]
  );

  let diversificationRating = "Optimal";
  let diversificationColor = "var(--color-accent)";
  if (simAllocation.equity > 80) {
    diversificationRating = "High Risk";
    diversificationColor = "#ffffff";
  } else if (simAllocation.equity < 25) {
    diversificationRating = "Ultra Safe";
    diversificationColor = "#ffffff";
  }

  return (
    <div className="min-h-[calc(100vh-70px)] px-4 py-8 sm:py-12 relative z-10 fade-in">
      <div className="mx-auto max-w-5xl">

        {/* ─── PAGE HEADER ─── */}
        <div className="text-center mb-10">
          <div
            className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-accent)]"
            style={{
              fontFamily: "var(--font-display)",
            }}
          >
            Asset Allocations
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold mb-2 text-white"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
          >
            Portfolio Allocation
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            Tailored for your{" "}
            <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>{risk_tier}</span>{" "}
            risk tier
          </p>
        </div>

        {/* ─── COMPARE TOGGLE ─── */}
        <div className="flex justify-center mb-8">
          <div className="pill-group">
            {["Conservative", "Moderate", "Aggressive"].map((tier) => (
              <button
                key={tier}
                className={`pill-option ${compareView === tier ? "active" : ""}`}
                onClick={() => setCompareView(tier)}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* ─── DONUT + INFO ─── */}
        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-1 glass-card p-6 flex flex-col items-center justify-center">
            <DonutChart allocation={activeAlloc} key={compareView} />

            <div className="grid grid-cols-2 gap-3 mt-6 w-full">
              {["equity", "debt", "gold", "cash"].map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded flex-shrink-0"
                    style={{ background: ASSET_COLORS[key] }}
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">
                      {ASSET_LABELS[key]} ({activeAlloc[key]}%)
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">
                      {ASSET_SUBTITLES[key]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between">
            <div>
              <h2
                className="text-lg font-bold mb-1 text-white"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
              >
                {compareView} Portfolio
              </h2>
              <p className="text-xs leading-relaxed mb-6 text-[var(--color-text-secondary)]">
                {ALLOCATIONS[compareView]?.desc}
              </p>
            </div>

            {/* Allocation Bar */}
            <div className="mb-6">
              <div className="allocation-bar-container" style={{ height: 28, borderRadius: 10 }}>
                {["equity", "debt", "gold", "cash"].map((key) => (
                  <div
                    key={key}
                    className="allocation-segment"
                    style={{
                      width: `${activeAlloc[key]}%`,
                      background: ASSET_COLORS[key],
                    }}
                    title={`${ASSET_LABELS[key]}: ${activeAlloc[key]}%`}
                  />
                ))}
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-3">
              {["equity", "debt", "gold", "cash"].map((key) => (
                <div key={key} className="stat-card" style={{ borderColor: "var(--color-border)" }}>
                  <div className="stat-value" style={{ color: ASSET_COLORS[key] }}>
                    {activeAlloc[key]}%
                  </div>
                  <div className="stat-label">{ASSET_LABELS[key]}</div>
                </div>
              ))}
            </div>

            {compareView !== risk_tier && (
              <p className="text-[10px] mt-4 text-center text-[var(--color-text-muted)]">
                Viewing <strong>{compareView}</strong> profile • Your recommended profile is <strong>{risk_tier}</strong>
              </p>
            )}
          </div>
        </div>

        {/* ─── INSTRUMENTS ─── */}
        <div className="glass-card p-6 sm:p-8 mb-10">
          <h2
            className="text-lg font-bold mb-2 text-white"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
          >
            Recommended Instruments
          </h2>
          <p className="text-xs mb-6 text-[var(--color-text-muted)]">
            Regulated Indian channels aligned with the suggested strategy.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(SUGGESTIONS).map(([key, items]) => (
              <div key={key}>
                <div className="flex items-center gap-2 font-semibold text-sm mb-3" style={{ color: ASSET_COLORS[key] }}>
                  <span className="w-2 h-2 rounded" style={{ background: ASSET_COLORS[key] }} />
                  {ASSET_LABELS[key]} Instruments
                </div>
                <div className="flex flex-col gap-2.5">
                  {items.map((s) => (
                    <div key={s.name} className={`instrument-card ${key}-card`}>
                      <span className="font-bold text-xs block mb-0.5 text-white">
                        {s.name}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">{s.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── SIMULATOR ─── */}
        <div className="glass-card p-6 sm:p-8">
          <div className="mb-6">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-accent)]"
              style={{
                fontFamily: "var(--font-display)",
              }}
            >
              Interactive Tool
            </span>
            <h2
              className="text-xl font-bold mt-3 mb-1 text-white"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
            >
              SIP, Return & Inflation Calculator
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Adjust monthly SIP, investment duration, expected inflation, and asset weights to project future purchasing power.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-8">
            {/* Left: Sliders + allocations */}
            <div className="md:col-span-7 flex flex-col gap-6">
              {/* SIP Amount Slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-3">
                  <span className="text-[var(--color-text-secondary)]">Monthly SIP Amount</span>
                  <span className="text-lg font-bold text-[var(--color-accent)]" style={{ fontFamily: "var(--font-display)" }}>₹{sipAmount.toLocaleString("en-IN")}</span>
                </div>
                <input
                  type="range" min="1000" max="100000" step="1000" value={sipAmount}
                  onChange={(e) => setSipAmount(Number(e.target.value))}
                  className="slider-custom"
                />
                <div className="flex justify-between text-[10px] mt-1.5 text-[var(--color-text-muted)]">
                  <span>₹1,000</span>
                  <span>₹1,00,000</span>
                </div>
              </div>

              {/* Years Slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-3">
                  <span className="text-[var(--color-text-secondary)]">Investment Duration</span>
                  <span className="text-lg font-bold text-[var(--color-accent)]" style={{ fontFamily: "var(--font-display)" }}>{years} Years</span>
                </div>
                <input
                  type="range" min="1" max="30" step="1" value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="slider-custom"
                />
                <div className="flex justify-between text-[10px] mt-1.5 text-[var(--color-text-muted)]">
                  <span>1 Year</span>
                  <span>30 Years</span>
                </div>
              </div>

              {/* Expected Inflation Slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-3">
                  <span className="text-[var(--color-text-secondary)]">Expected Annual Inflation</span>
                  <span className="text-lg font-bold text-[var(--color-accent)]" style={{ fontFamily: "var(--font-display)" }}>{inflationRate}%</span>
                </div>
                <input
                  type="range" min="0" max="12" step="0.5" value={inflationRate}
                  onChange={(e) => setInflationRate(Number(e.target.value))}
                  className="slider-custom"
                />
                <div className="flex justify-between text-[10px] mt-1.5 text-[var(--color-text-muted)]">
                  <span>0% (No Inflation)</span>
                  <span>12% (High Inflation)</span>
                </div>
              </div>

              {/* Equity Target Slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-3">
                  <span className="text-[var(--color-text-secondary)]">Target Equity</span>
                  <span className="text-lg font-bold text-[var(--color-accent)]" style={{ fontFamily: "var(--font-display)" }}>{simEquity}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={simEquity}
                  onChange={(e) => setSimEquity(Number(e.target.value))}
                  className="slider-custom"
                />
                <div className="flex justify-between text-[10px] mt-1.5 text-[var(--color-text-muted)]">
                  <span>0% Conservative</span>
                  <span>100% Aggressive</span>
                </div>
              </div>

              {/* Allocation breakdown */}
              <div className="simulator-details flex flex-col gap-3">
                <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]" style={{ fontFamily: "var(--font-display)" }}>
                  Simulated Allocation
                </div>

                {["equity", "debt", "gold", "cash"].map((key) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded" style={{ background: ASSET_COLORS[key] }} />
                      <span className="text-[var(--color-text-secondary)]">{ASSET_LABELS[key]}</span>
                    </span>
                    <span className="font-bold" style={{ color: ASSET_COLORS[key] }}>
                      {simAllocation[key]}%
                    </span>
                  </div>
                ))}

                <div className="allocation-bar-container" style={{ height: 8 }}>
                  {["equity", "debt", "gold", "cash"].map((key) => (
                    <div
                      key={key}
                      className="allocation-segment"
                      style={{ width: `${simAllocation[key]}%`, background: ASSET_COLORS[key] }}
                    />
                  ))}
                </div>
              </div>

              {/* SVG Growth Curve */}
              <div
                className="rounded-lg p-4"
                style={{ background: "rgba(15, 15, 15, 0.4)", border: "1px solid var(--color-border)" }}
              >
                <div className="text-[10px] uppercase font-bold tracking-wider mb-3 text-[var(--color-text-muted)]" style={{ fontFamily: "var(--font-display)" }}>
                  Projected Growth Curve
                </div>
                <svg viewBox="0 0 300 120" className="w-full" style={{ height: 120 }}>
                  {[0, 30, 60, 90, 120].map((y) => (
                    <line
                      key={y} x1="0" y1={y} x2="300" y2={y}
                      stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="4 4"
                    />
                  ))}

                  <path
                    d={growthData.areaPath}
                    fill="url(#areaGradAurora)"
                    className="growth-area"
                  />

                  <path
                    d={growthData.path}
                    className="growth-line"
                    stroke="var(--color-accent)"
                  />

                  {growthData.coords.length > 0 && (
                    <circle
                      cx={growthData.coords[growthData.coords.length - 1].x}
                      cy={growthData.coords[growthData.coords.length - 1].y}
                      r="4" fill="var(--color-accent)"
                      className="growth-dot"
                    />
                  )}

                  <defs>
                    <linearGradient id="areaGradAurora" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="flex justify-between text-[9px] mt-1 text-[var(--color-text-muted)]">
                  <span>Year 0</span>
                  <span>Year {Math.round(years / 2)}</span>
                  <span>Year {years}</span>
                </div>
              </div>
            </div>

            {/* Right: Results panel */}
            <div className="md:col-span-5 simulator-panel flex flex-col justify-between min-h-[300px]">
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider mb-3 text-[var(--color-text-muted)]" style={{ fontFamily: "var(--font-display)" }}>
                  Return Analysis
                </div>

                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-xs text-[var(--color-text-secondary)]">Weighted Return:</span>
                  <span className="text-xl font-bold text-[var(--color-accent)]" style={{ fontFamily: "var(--font-display)" }}>
                    {weightedReturn.toFixed(2)}%
                  </span>
                </div>

                <div className="flex justify-between items-baseline mb-4">
                  <span className="text-xs text-[var(--color-text-secondary)]">Diversification:</span>
                  <span className="text-xs font-bold" style={{ color: diversificationColor }}>
                    {diversificationRating}
                  </span>
                </div>

                <div className="h-px my-3" style={{ background: "var(--color-border)" }} />
              </div>

              <div className="flex flex-col gap-3">
                <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]" style={{ fontFamily: "var(--font-display)" }}>
                  {years}-Year Projection (SIP)
                </div>

                <div>
                  <div
                    className="text-3xl font-bold tracking-tight text-white"
                    style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
                  >
                    ₹{simResult.value.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] mt-1 text-[var(--color-text-muted)]">
                    Total Invested:{" "}
                    <span className="text-[var(--color-text-secondary)] font-semibold">
                      ₹{simResult.invested.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div
                  className="rounded-lg p-3 flex flex-col gap-1.5 text-xs border border-[var(--color-border)] bg-[rgba(16,163,127,0.04)]"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--color-text-secondary)]">Capital Gains:</span>
                    <span className="font-bold text-[var(--color-accent)]">
                      +₹{simResult.gain.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-[var(--color-border)] pt-1.5 mt-1.5">
                    <span className="text-[var(--color-text-secondary)]">Adjusted for Inflation ({inflationRate}%):</span>
                    <span className="font-bold text-white">
                      ₹{inflationAdjustedValue.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[9px] text-center leading-relaxed mt-4 text-[var(--color-text-muted)]">
                Monthly SIP of ₹{sipAmount.toLocaleString("en-IN")} for {years * 12} months. Equity 13.5%, Debt 7.2%, Gold 9.0%, Cash 4.5% p.a.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

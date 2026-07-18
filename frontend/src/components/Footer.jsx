export default function Footer() {
  return (
    <footer className="footer relative z-10">
      <div className="max-w-5xl mx-auto">
        {/* Main content — minimal centered layout */}
        <div className="flex flex-col items-center text-center gap-6 mb-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span
              className="font-bold text-xl tracking-tight text-white"
              style={{
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.02em",
              }}
            >
              Artha
            </span>
            <span
              className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"
            />
          </div>

          <p className="text-xs leading-relaxed max-w-sm" style={{ color: "var(--color-text-muted)" }}>
            AI-powered financial advisory for the Indian market. Personalized wealth plans, risk profiling, and portfolio visualization.
          </p>

          {/* Navigation links */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="#/" className="footer-link">Home</a>
            <span style={{ color: "var(--color-border)" }}>·</span>
            <a href="#/assessment" className="footer-link">Assessment</a>
            <span style={{ color: "var(--color-border)" }}>·</span>
            <a href="#/report" className="footer-link">My Plan</a>
            <span style={{ color: "var(--color-border)" }}>·</span>
            <a href="#/portfolio" className="footer-link">Portfolio</a>
          </div>

          {/* Tech badges */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {["React 19", "Vite", "FastAPI", "AI Advisor"].map((tech) => (
              <span
                key={tech}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)",
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
            © {new Date().getFullYear()} Artha AI. For educational purposes only.
          </p>
          <p className="text-[11px] flex items-center gap-1.5" style={{ color: "var(--color-text-muted)" }}>
            Made with
            <span style={{ color: "var(--color-accent)" }}>♥</span>
            and AI
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function Home({ navigateTo, activePlan }) {
  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col justify-center items-center select-none overflow-hidden">
      <div className="flex flex-col items-center justify-center">
        {/* Main Logo Glitch Trigger */}
        <div 
          onClick={() => navigateTo("assessment")}
          className="glitch-wrapper flex flex-col items-center justify-center cursor-pointer group mb-4"
        >
          <h1 
            className="glitch-text text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter"
            data-text="ARTHA AI"
          >
            ARTHA AI
          </h1>
          
          <div 
            className="mt-6 font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--color-accent)] opacity-45 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"
          >
            {activePlan ? "[ Click to Re-evaluate ]" : "[ Click to Enter Engine ]"}
          </div>
        </div>

        {/* Plan / Portfolio Quick Links (strictly green, black, white) */}
        {activePlan && (
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 animate-fade-in">
            <button
              onClick={() => navigateTo("report")}
              className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-accent)] opacity-60 hover:opacity-100 transition-all duration-300 bg-transparent border border-[var(--color-accent)]/20 hover:border-[var(--color-accent)] px-5 py-2 rounded-full cursor-pointer"
            >
              [ Click to View Plan ]
            </button>
            <button
              onClick={() => navigateTo("portfolio")}
              className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-accent)] opacity-60 hover:opacity-100 transition-all duration-300 bg-transparent border border-[var(--color-accent)]/20 hover:border-[var(--color-accent)] px-5 py-2 rounded-full cursor-pointer"
            >
              [ Click to View Portfolio ]
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

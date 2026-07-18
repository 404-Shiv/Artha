import { useState, useEffect, useRef } from "react";

export default function Navbar({ currentPage, navigateTo, activePlan }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);

  const containerRef = useRef(null);
  const [bubbleStyle, setBubbleStyle] = useState({ opacity: 0, left: 0, width: 0, height: 0 });

  // Track scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll on mobile menu
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const handleLinkClick = (page) => {
    navigateTo(page);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { id: "home", label: "Home", always: true },
    { id: "assessment", label: "Assessment", always: true },
    { id: "report", label: "My Plan", always: false },
    { id: "portfolio", label: "Portfolio", always: false },
  ];

  // Update bubble position based on active/hovered link
  const activeOrHoveredId = hoveredId || currentPage;

  useEffect(() => {
    if (!containerRef.current) return;
    
    const activeEl = containerRef.current.querySelector(`[data-nav-id="${activeOrHoveredId}"]`);
    if (activeEl && !activeEl.disabled) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();
      
      setBubbleStyle({
        opacity: 1,
        left: elRect.left - containerRect.left,
        width: elRect.width,
        height: elRect.height,
      });
    } else {
      setBubbleStyle((prev) => ({ ...prev, opacity: 0 }));
    }
  }, [activeOrHoveredId, currentPage, activePlan]);

  return (
    <>
      <nav
        className={`navbar sticky top-0 z-50 backdrop-blur-md border-b transition-all duration-300 ${scrolled ? "scrolled" : ""}`}
        style={{
          background: scrolled ? "rgba(15, 15, 15, 0.9)" : "rgba(15, 15, 15, 0.6)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="flex items-center justify-between transition-all duration-300"
            style={{ height: scrolled ? "56px" : "64px" }}
          >
            {/* Logo */}
            <button
              onClick={() => handleLinkClick("home")}
              className="flex items-center gap-2 group"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span
                className="font-bold text-xl tracking-tight text-white transition-all duration-300"
                style={{ letterSpacing: "-0.02em" }}
              >
                Artha
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"
              />
            </button>

            {/* Desktop Nav with Sliding Bubble Highlight */}
            <div 
              ref={containerRef}
              className="hidden md:flex items-center gap-2 relative bg-white/[0.02] border border-white/[0.04] p-1 rounded-full"
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Highlight Bubble Backdrop */}
              <div
                className="absolute rounded-full transition-all duration-300 ease-out pointer-events-none"
                style={{
                  transform: "translate3d(0, 0, 0)",
                  left: `${bubbleStyle.left}px`,
                  width: `${bubbleStyle.width}px`,
                  height: `${bubbleStyle.height}px`,
                  opacity: bubbleStyle.opacity,
                  background: activeOrHoveredId === currentPage 
                    ? "rgba(16, 163, 127, 0.12)" 
                    : "rgba(255, 255, 255, 0.05)",
                  border: activeOrHoveredId === currentPage 
                    ? "1px solid rgba(16, 163, 127, 0.25)" 
                    : "1px solid rgba(255, 255, 255, 0.08)",
                  boxShadow: activeOrHoveredId === currentPage 
                    ? "0 0 10px rgba(16, 163, 127, 0.1)" 
                    : "none",
                }}
              />

              {navLinks.map((link) => {
                const disabled = !link.always && !activePlan;
                const isActive = currentPage === link.id;
                return (
                  <button
                    key={link.id}
                    data-nav-id={link.id}
                    onMouseEnter={() => !disabled && setHoveredId(link.id)}
                    onClick={() => !disabled && handleLinkClick(link.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 relative z-10 ${
                      isActive ? "text-white" : "text-[var(--color-text-secondary)] hover:text-white"
                    } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
                    disabled={disabled}
                  >
                    {link.label}
                  </button>
                );
              })}
            </div>

            {/* Right Section */}
            <div className="hidden md:flex items-center gap-3">
              {/* CTA */}
              {!activePlan && (
                <button
                  onClick={() => handleLinkClick("assessment")}
                  className="btn-primary text-xs py-2 px-4"
                >
                  Start Assessment
                </button>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex md:hidden items-center justify-center w-10 h-10 rounded-lg transition-colors"
              style={{ color: "var(--color-text-secondary)" }}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-overlay md:hidden" style={{ top: 0 }}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-16">
              <span
                className="font-bold text-xl tracking-tight text-white"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
              >
                Artha
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-lg"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Links */}
            <div className="flex-1 flex flex-col justify-center px-8 gap-2">
              {navLinks.map((link, i) => {
                const disabled = !link.always && !activePlan;
                return (
                  <button
                    key={link.id}
                    onClick={() => !disabled && handleLinkClick(link.id)}
                    className={`mobile-link text-left ${
                      currentPage === link.id ? "active text-white font-bold" : ""
                    } ${disabled ? "opacity-35" : ""}`}
                    style={{ animationDelay: `${i * 0.08}s` }}
                    disabled={disabled}
                  >
                    {link.label}
                  </button>
                );
              })}
            </div>

            {/* Bottom */}
            <div className="px-8 pb-8 flex flex-col gap-4">
            </div>
          </div>
        </div>
      )}
    </>
  );
}

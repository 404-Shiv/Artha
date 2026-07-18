import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Assessment from "./pages/Assessment";
import Report from "./pages/Report";
import Portfolio from "./pages/Portfolio";

const ACTIVE_PLAN_KEY = "artha_active_plan";
const HISTORY_KEY = "artha_history";

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [pageKey, setPageKey] = useState(0);

  // Active plan
  const [activePlan, setActivePlan] = useState(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_PLAN_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // History
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ── Scroll Reveal (IntersectionObserver) ────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    // Observe all .reveal elements
    const observe = () => {
      document.querySelectorAll(".reveal").forEach((el) => {
        observer.observe(el);
      });
    };

    // Initial observe + re-observe on page changes
    observe();
    const timer = setTimeout(observe, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [currentPage, pageKey]);

  // ── Hash-based Routing ──────────────────────────────────────────
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === "#/assessment") {
        setCurrentPage("assessment");
      } else if (hash === "#/report") {
        setCurrentPage("report");
      } else if (hash === "#/portfolio") {
        setCurrentPage("portfolio");
      } else {
        setCurrentPage("home");
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Navigation helper
  const navigateTo = useCallback((page) => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (page === "home") {
      window.location.hash = "#/";
    } else {
      window.location.hash = `#/${page}`;
    }
    setCurrentPage(page);
    setPageKey((k) => k + 1);
  }, []);

  // Sync active plan
  useEffect(() => {
    if (activePlan) {
      localStorage.setItem(ACTIVE_PLAN_KEY, JSON.stringify(activePlan));
    } else {
      localStorage.removeItem(ACTIVE_PLAN_KEY);
    }
  }, [activePlan]);

  // Sync history
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  // Assessment success handler
  const handleAssessmentSuccess = useCallback((resultData) => {
    const newReport = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...resultData,
    };

    setActivePlan(newReport);
    setHistory((prev) => {
      const updated = [newReport, ...prev];
      return updated.slice(0, 5);
    });
  }, []);

  // Load history report
  const handleLoadHistoryReport = useCallback((report) => {
    setActivePlan(report);
    navigateTo("report");
  }, [navigateTo]);

  // Reset
  const handleReset = useCallback(() => {
    setActivePlan(null);
    localStorage.removeItem(ACTIVE_PLAN_KEY);
    navigateTo("assessment");
  }, [navigateTo]);


  return (
    <div className="aurora-bg relative min-h-screen overflow-x-hidden">

      {/* Navbar */}
      <Navbar
        currentPage={currentPage}
        navigateTo={navigateTo}
        activePlan={activePlan}
      />

      {/* Page Content */}
      <main key={pageKey} className="page-enter relative z-10">
        {currentPage === "home" && (
          <Home
            navigateTo={navigateTo}
            activePlan={activePlan}
            history={history}
            loadHistoryReport={handleLoadHistoryReport}
          />
        )}

        {currentPage === "assessment" && (
          <Assessment
            navigateTo={navigateTo}
            onAssessmentSuccess={handleAssessmentSuccess}
          />
        )}

        {currentPage === "report" && (
          <Report
            data={activePlan}
            navigateTo={navigateTo}
            onReset={handleReset}
          />
        )}

        {currentPage === "portfolio" && (
          <Portfolio
            data={activePlan}
            navigateTo={navigateTo}
          />
        )}
      </main>
    </div>
  );
}

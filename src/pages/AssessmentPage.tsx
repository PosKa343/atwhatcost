import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PRIORITY_QUESTIONS, calculateAssessment, type Priority } from "@/lib/calculator";
import LoadingScreen from "@/components/LoadingScreen";
import FigTreeDashboard from "@/components/FigTreeDashboard";
import TownOrZipInput, { type TownOrZipValue } from "@/components/TownOrZipInput";
import type { AssessmentResult } from "@/lib/calculator";

const ALL_PRIORITIES: Priority[] = [
  "crime",
  "employment",
  "transit",
  "climate",
  "healthcare",
  "education",
  "vibes",
  "growth",
];

const AssessmentPage = () => {
  const [searchParams] = useSearchParams();
  const initialZip = searchParams.get("zip") || "";
  const initialCityId = searchParams.get("cityId") || "";

  const [step, setStep] = useState<"input" | "loading" | "results">("input");
  const [location, setLocation] = useState<TownOrZipValue>(
    initialZip.length === 5
      ? { mode: "zip", zip: initialZip }
      : initialCityId
      ? { mode: "town", cityId: initialCityId, cityName: "" }
      : null
  );
  const [salary, setSalary] = useState("");
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const togglePriority = (p: Priority) => {
    setSelectedPriorities((prev) => {
      if (prev.includes(p)) return prev.filter((x) => x !== p);
      if (prev.length >= 5) return prev; // up to 5
      return [...prev, p];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !salary || selectedPriorities.length < 1) return;
    setStep("loading");
  };

  const handleLoadingComplete = useCallback(() => {
    try {
      if (!location) return;
      const payload =
        location.mode === "zip"
          ? { zip: location.zip }
          : { cityId: location.cityId };
      const res = calculateAssessment(payload, parseInt(salary), selectedPriorities);
      setResult(res);
      setStep("results");
    } catch (err) {
      console.error("Assessment failed:", err);
      // Fallback to show error or retry
      setStep("input");
    }
  }, [location, salary, selectedPriorities]);

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {step === "loading" && <LoadingScreen key="loading" onComplete={handleLoadingComplete} />}
      </AnimatePresence>

      {step === "input" && (
        <div className="max-w-xl mx-auto px-6 py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <a
              href="/"
              className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-body hover:text-foreground transition-colors"
            >
              ← AtWhatCost
            </a>

            <h1 className="text-3xl md:text-4xl font-display mt-8 mb-3">Time to confess.</h1>
            <p className="text-muted-foreground font-body mb-10">
              We need three things: where you are, what you make, and what matters most to you.
            </p>

            <form onSubmit={handleSubmit} className="space-y-8">
              <TownOrZipInput value={location} onChange={setLocation} />

              {/* Salary */}
              <div>
                <label className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-body block mb-2">
                  Annual Base Salary
                </label>
                <input
                  type="text"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value.replace(/\D/g, ""))}
                  placeholder="85000"
                  className="w-full px-4 py-3 bg-card border border-border rounded-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {salary && (
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    ${parseInt(salary).toLocaleString()} / year
                  </p>
                )}
              </div>

              {/* Priorities */}
              <div>
                <label className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-body block mb-2">
                  Priorities (select up to 5)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_PRIORITIES.map((p) => {
                    const index = selectedPriorities.indexOf(p);
                    const isSelected = index >= 0;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePriority(p)}
                        className={`px-4 py-3 text-sm font-body rounded-sm border transition-all text-left ${
                          isSelected
                            ? "border-fig-olive bg-fig-olive/10 text-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-fig-olive/40"
                        }`}
                      >
                        {isSelected && <span className="text-xs text-fig-olive mr-2">#{index + 1}</span>}
                        <span className="text-muted-foreground">{PRIORITY_QUESTIONS[p]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={!location || !salary || selectedPriorities.length < 1}
                className="w-full py-3.5 bg-fig-brown text-fig-cream font-body font-medium tracking-wide rounded-sm hover:bg-fig-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Shake the Tree
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {step === "results" && result && <FigTreeDashboard result={result} />}
    </div>
  );
};

export default AssessmentPage;

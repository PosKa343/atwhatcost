import { motion } from "framer-motion";
import { PRIORITY_LABELS, type Priority } from "@/lib/calculator";

const userAPriorities: Priority[] = ["climate", "transit", "vibes"];
const userBPriorities: Priority[] = ["transit", "vibes", "growth"];

const PartnerModeMockup = () => {
  const hasConflict = (p: Priority) => {
    const aIndex = userAPriorities.indexOf(p);
    const bIndex = userBPriorities.indexOf(p);
    if (aIndex === -1 || bIndex === -1) return false;
    return Math.abs(aIndex - bIndex) >= 2;
  };

  const allPriorities: Priority[] = ["crime", "employment", "transit", "climate", "healthcare", "education", "vibes", "growth"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="border border-border rounded-sm p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-display">Partner Mode</h3>
        <span className="text-xs px-3 py-1 bg-fig-olive/10 text-fig-olive rounded-sm font-body">$5</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-xs tracking-[0.1em] uppercase text-muted-foreground font-body">Priority</div>
        <div className="text-xs tracking-[0.1em] uppercase text-muted-foreground font-body text-center">You</div>
        <div className="text-xs tracking-[0.1em] uppercase text-muted-foreground font-body text-center">Partner</div>
      </div>

      {allPriorities.map((p) => {
        const aRank = userAPriorities.indexOf(p);
        const bRank = userBPriorities.indexOf(p);
        const conflict = hasConflict(p);

        return (
          <div
            key={p}
            className={`grid grid-cols-3 gap-4 py-3 border-t border-border/50 ${
              conflict ? "bg-score-high/5" : ""
            }`}
          >
            <span className={`text-sm font-body ${conflict ? "text-score-high font-medium" : "text-foreground"}`}>
              {PRIORITY_LABELS[p]}
              {conflict && " ⚠"}
            </span>
            <span className="text-sm font-body text-center text-muted-foreground">
              {aRank >= 0 ? `#${aRank + 1}` : "—"}
            </span>
            <span className="text-sm font-body text-center text-muted-foreground">
              {bRank >= 0 ? `#${bRank + 1}` : "—"}
            </span>
          </div>
        );
      })}

      <p className="text-xs text-score-high font-body mt-4 italic">
        ⚠ Major conflict: You want space. They want walkability. This is why you're still in NJ.
      </p>
    </motion.div>
  );
};

export default PartnerModeMockup;

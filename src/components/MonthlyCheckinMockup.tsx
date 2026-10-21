import { motion } from "framer-motion";

const MonthlyCheckinMockup = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="border border-border rounded-sm p-8 max-w-sm mx-auto"
    >
      <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-body mb-4">
        Monthly Check-In
      </p>
      <div className="bg-fig-parchment/50 rounded-sm p-4 mb-4 border border-border/50">
        <p className="text-sm font-body text-foreground">
          🔔 <span className="font-medium">AtWhatCost</span> — April 2026
        </p>
        <p className="text-sm text-muted-foreground font-body mt-2 italic">
          "Did you look at Zillow today or did you actually pack a box?"
        </p>
      </div>
      <div className="space-y-2">
        <button className="w-full py-2.5 text-sm font-body border border-border rounded-sm hover:bg-secondary/50 transition-colors">
          I looked at Zillow (again)
        </button>
        <button className="w-full py-2.5 text-sm font-body border border-fig-olive/30 rounded-sm bg-fig-olive/5 hover:bg-fig-olive/10 transition-colors">
          I actually did something
        </button>
      </div>
      <p className="text-xs text-muted-foreground font-body mt-4 text-center">
        Streak: 0 boxes packed · 47 Zillow sessions
      </p>
    </motion.div>
  );
};

export default MonthlyCheckinMockup;

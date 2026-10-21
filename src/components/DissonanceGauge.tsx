import { motion } from "framer-motion";

interface DissonanceGaugeProps {
  score: number;
}

const DissonanceGauge = ({ score }: DissonanceGaugeProps) => {
  const getColor = () => {
    if (score >= 65) return "text-score-high";
    if (score >= 35) return "text-score-mid";
    return "text-score-low";
  };

  const getArcColor = () => {
    if (score >= 65) return "hsl(var(--fig-score-high))";
    if (score >= 35) return "hsl(var(--fig-score-mid))";
    return "hsl(var(--fig-score-low))";
  };

  // Arc calculation
  const radius = 80;
  const circumference = Math.PI * radius; // half circle
  const progress = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 120" className="mb-2">
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <motion.path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={getArcColor()}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
        />
      </svg>
      <motion.span
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        className={`text-5xl font-display font-bold ${getColor()} -mt-16`}
      >
        {score}%
      </motion.span>
      <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mt-3 font-body">
        Dissonance Score
      </p>
    </div>
  );
};

export default DissonanceGauge;

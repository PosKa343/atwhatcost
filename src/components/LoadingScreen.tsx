import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const messages = [
  "Crunching property taxes...",
  "Mourning Taylor Ham...",
  "Calculating your dissonance...",
  "Factoring in diner quality...",
  "Measuring the jug-handle effect...",
  "Accounting for bagel inflation...",
];

interface LoadingScreenProps {
  onComplete: () => void;
  duration?: number;
}

const LoadingScreen = ({ onComplete, duration = 4000 }: LoadingScreenProps) => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 800);

    const timeout = setTimeout(onComplete, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onComplete, duration]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center">
      {/* Simple fig tree SVG animation */}
      <svg width="120" height="160" viewBox="0 0 120 160" className="mb-10">
        <motion.path
          d="M60 160 L60 80"
          stroke="hsl(var(--fig-brown))"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5 }}
        />
        <motion.path
          d="M60 80 Q30 40 20 30 M60 80 Q60 30 55 15 M60 80 Q90 40 100 30"
          stroke="hsl(var(--fig-olive))"
          strokeWidth="1.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
        />
        {[
          { cx: 35, cy: 55 },
          { cx: 58, cy: 35 },
          { cx: 85, cy: 50 },
        ].map((fig, i) => (
          <motion.ellipse
            key={i}
            cx={fig.cx}
            cy={fig.cy}
            rx="8"
            ry="10"
            fill="none"
            stroke="hsl(var(--fig-brown))"
            strokeWidth="1"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.5 + i * 0.3 }}
          />
        ))}
      </svg>

      <AnimatePresence mode="wait">
        <motion.p
          key={msgIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-muted-foreground font-body text-sm italic"
        >
          {messages[msgIndex]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};

export default LoadingScreen;

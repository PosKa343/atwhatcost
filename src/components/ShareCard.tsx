import { motion } from "framer-motion";

interface ShareCardProps {
  score: number;
  bestCity: string;
}

const ShareCard = ({ score, bestCity }: ShareCardProps) => {
  const getVerdict = () => {
    if (score >= 70) return `I should've moved to ${bestCity} yesterday.`;
    if (score >= 40) return `${bestCity} is looking pretty good right now.`;
    return `I might actually be in the right NJ town.`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.5 }}
      className="w-80 bg-gradient-to-b from-fig-parchment to-card border border-border rounded-sm p-8 text-center"
    >
      <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground font-body mb-4">
        AtWhatCost
      </p>
      <p className="text-sm text-muted-foreground font-body mb-2">My Dissonance Score</p>
      <p className="text-6xl font-display font-bold mb-3">{score}%</p>
      <p className="text-sm font-body italic text-muted-foreground mb-6">{getVerdict()}</p>
      <div className="border-t border-border pt-4">
        <p className="text-xs text-muted-foreground font-body">atwhatcost.app</p>
      </div>
    </motion.div>
  );
};

export default ShareCard;

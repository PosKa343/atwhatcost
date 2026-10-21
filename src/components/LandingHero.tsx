import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import figTreeHero from "@/assets/fig-tree-hero.jpg";

const LandingHero = () => {
  const [zip, setZip] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (zip.length >= 5) {
      navigate(`/assess?zip=${zip}`);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={figTreeHero}
          alt="Fig tree botanical illustration"
          className="w-full h-full object-cover opacity-30"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-6 font-body"
        >
          AtWhatCost
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl md:text-6xl lg:text-7xl font-display leading-[1.1] tracking-tight mb-6"
        >
          You're overpaying for the wrong town.{" "}
          <span className="italic text-fig-olive">Pick a fig before it rots.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-body leading-relaxed"
        >
          AtWhatCost is the financial reality check for New Jerseyans who wonder if a different NJ town
          would actually match their priorities — and their bank account.
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto"
        >
          <input
            type="text"
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder="Enter your NJ Zip Code"
            className="w-full sm:flex-1 px-5 py-3.5 bg-card border border-border rounded-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          <button
            type="submit"
            disabled={zip.length < 5}
            className="w-full sm:w-auto px-8 py-3.5 bg-fig-brown text-fig-cream font-body font-medium tracking-wide rounded-sm hover:bg-fig-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Shake the Tree
          </button>
        </motion.form>
      </div>
    </section>
  );
};

export default LandingHero;

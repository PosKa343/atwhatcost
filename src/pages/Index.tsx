import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useMotionTemplate, AnimatePresence } from "framer-motion";
import ProblemSection from "@/components/ProblemSection";
import TownOrZipInput, { type TownOrZipValue } from "@/components/TownOrZipInput";
import figTreeHero from "@/assets/fig-tree-hero.png";
import figIcon from "@/assets/falling-fig.png";

const Index = () => {
  const [location, setLocation] = useState<TownOrZipValue>(null);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const problemRef = useRef<HTMLDivElement>(null);
  const bottomSectionRef = useRef<HTMLDivElement>(null);
  const [treeRevealed, setTreeRevealed] = useState(false);
  const [figFalling, setFigFalling] = useState(false);
  const [figKey, setFigKey] = useState(0);
  const wasScrolledRef = useRef(false);

  const { scrollYProgress } = useScroll({ target: containerRef });

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const { scrollYProgress: problemProgress } = useScroll({
    target: problemRef,
    offset: ["start end", "end start"],
  });


  // Hero parallax
  const heroOpacity = useTransform(heroProgress, [0, 0.6], [1, 0]);
  const heroY = useTransform(heroProgress, [0, 1], [0, -150]);
  const heroScale = useTransform(heroProgress, [0, 0.8], [1, 0.85]);

  // Tree: continuously grows, brightens, and saturates through entire scroll
  const treeScale = useTransform(scrollYProgress, [0, 0.3, 0.6, 0.85, 1], [0.7, 0.85, 1, 1.1, 1.15]);
  const treeOpacity = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.75, 0.9], [0.08, 0.12, 0.2, 0.5, 0.9]);
  const treeRotateX = useTransform(scrollYProgress, [0, 0.5, 0.85], [6, 2, 0]);
  const treeY = useTransform(scrollYProgress, [0, 0.5, 0.85], [40, 10, -10]);
  const treeSaturate = useTransform(scrollYProgress, [0, 0.5, 0.75, 0.9], [0, 0, 0.6, 1.2]);
  const treeContrast = useTransform(scrollYProgress, [0, 0.5, 0.75, 0.9], [0.4, 0.4, 0.7, 1.05]);
  const treeBrightness = useTransform(scrollYProgress, [0, 0.5, 0.75, 0.9], [1.4, 1.4, 1.15, 1]);
  const treeFilter = useMotionTemplate`saturate(${treeSaturate}) contrast(${treeContrast}) brightness(${treeBrightness})`;

  // Problem section 3D entry
  const problemY = useTransform(problemProgress, [0, 0.4], [120, 0]);
  const problemOpacity = useTransform(problemProgress, [0, 0.3], [0, 1]);
  const problemScale = useTransform(problemProgress, [0, 0.4], [0.92, 1]);

  // Bottom section — no separate entry animation, flows seamlessly from problem

  // Falling fig trigger
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      if (v > 0.08 && !wasScrolledRef.current) {
        wasScrolledRef.current = true;
        setFigKey((k) => k + 1);
        setFigFalling(true);
      }
      if (v < 0.03) {
        wasScrolledRef.current = false;
        setFigFalling(false);
      }
    });
    return unsubscribe;
  }, [scrollYProgress]);

  // Bottom section intersection — full tree reveal
  useEffect(() => {
    const el = bottomSectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setTreeRevealed(entry.isIntersecting),
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!location) return;
      if (location.mode === "zip") {
        navigate(`/assess?zip=${location.zip}`);
      } else {
        navigate(`/assess?cityId=${encodeURIComponent(location.cityId)}`);
      }
    },
    [location, navigate]
  );

  const zipInput = (
    <div className="flex flex-col items-stretch gap-3 w-full max-w-md mx-auto">
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-sm p-4">
        <TownOrZipInput value={location} onChange={setLocation} />
      </div>
      <button
        type="submit"
        disabled={!location}
        onClick={handleSubmit}
        className="w-full px-8 py-3.5 bg-fig-brown text-fig-cream font-body font-medium tracking-wide rounded-sm hover:bg-fig-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Shake the Tree
      </button>
    </div>
  );

  // Track footer position to clip tree above it
  const [treeBottom, setTreeBottom] = useState("0px");
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const el = footerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const clipped = Math.max(0, window.innerHeight - rect.top);
      setTreeBottom(clipped > 0 ? `${clipped}px` : "0px");
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative bg-background">
      {/* ─── Fixed fig tree — always centered, always visible, transparent ─── */}
      <div
        className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden"
        style={{ perspective: "1000px", bottom: treeBottom, transition: "bottom 100ms linear" }}
      >
        <motion.img
          src={figTreeHero}
          alt="Fig tree botanical illustration"
          className="w-[55vw] max-w-[600px] h-auto object-contain"
          width={1024}
          height={1024}
          style={{
            scale: treeScale,
            opacity: treeOpacity,
            rotateX: treeRotateX,
            y: treeY,
            filter: treeFilter,
            transformStyle: "preserve-3d",
          }}
        />
      </div>

      {/* ─── Falling fig ─── */}
      <AnimatePresence>
        {figFalling && (
          <motion.img
            key={figKey}
            src={figIcon}
            alt="A fig falling from the tree"
            className="fixed z-20 pointer-events-none w-10 h-10"
            style={{ left: "calc(50% - 20px)", top: "30%" }}
            initial={{ y: 0, rotate: 0, opacity: 0.9, scale: 0.8 }}
            animate={{
              y: ["0vh", "10vh", "30vh", "55vh", "70vh"],
              rotate: [0, -8, 12, -5, 15],
              opacity: [0.9, 0.9, 0.8, 0.5, 0],
              scale: [0.8, 0.9, 1, 0.95, 0.85],
              x: [0, -15, 8, -20, 5],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 3.2,
              ease: [0.22, 0.68, 0.36, 1],
              times: [0, 0.2, 0.45, 0.75, 1],
            }}
          />
        )}
      </AnimatePresence>

      {/* ─── State 1: Hero ─── */}
      <section ref={heroRef} className="relative z-10 min-h-[140vh]">
        <div className="sticky top-0 min-h-screen flex items-center justify-center">
          <motion.div
            className="max-w-3xl mx-auto px-6 text-center py-12 px-8 md:px-12"
            style={{
              opacity: heroOpacity,
              y: heroY,
              scale: heroScale,
            }}
          >
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 0.68, 0.36, 1] }}
              className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-6 font-body"
            >
              AtWhatCost
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.15, ease: [0.22, 0.68, 0.36, 1] }}
              className="text-4xl md:text-6xl lg:text-7xl font-display leading-[1.1] tracking-tight mb-6 drop-shadow-sm"
            >
              You're overpaying for the wrong town.{" "}
              <span className="italic text-fig-olive">
                Pick a fig before it rots.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.22, 0.68, 0.36, 1] }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-body leading-relaxed"
            >
              AtWhatCost is a decision-making and financial reality platform designed specifically to address one of the most pressing challenges in the State of New Jersey: <strong>the growing gap between cost of living and quality of life.</strong>
            </motion.p>

          </motion.div>
        </div>
      </section>

      {/* ─── State 2: Problem section (no glass panel) ─── */}
      <motion.div
        ref={problemRef}
        className="relative z-10 mx-4 md:mx-auto md:max-w-4xl"
        style={{
          y: problemY,
          opacity: problemOpacity,
          scale: problemScale,
        }}
      >
        <ProblemSection />
      </motion.div>

      {/* ─── State 3: Confrontation — glass panel covers tree, CTA centered ─── */}
      <section
        ref={bottomSectionRef}
        className="relative z-10 min-h-screen flex items-center justify-center"
      >
        <div className="fixed inset-0 z-[-1] pointer-events-none backdrop-blur-md bg-background/60 transition-opacity duration-700"
          style={{ opacity: treeRevealed ? 1 : 0 }}
        />
        <div className="max-w-md mx-auto px-6 text-center py-12">
          <motion.img
            src={figIcon}
            alt="Falling fig"
            className="w-16 h-16 mx-auto mb-8"
            loading="lazy"
            width={512}
            height={512}
            initial={{ y: "-15vh", rotate: 0, opacity: 0, scale: 0.8 }}
            whileInView={{
              y: ["-15vh", "-5vh", "0vh"],
              rotate: [0, -8, 12],
              opacity: [0, 0.9, 0.6],
              scale: [0.8, 0.95, 1],
              x: [0, -15, 0],
            }}
            viewport={{ once: false, margin: "-100px" }}
            transition={{
              duration: 2,
              ease: [0.22, 0.68, 0.36, 1],
              times: [0, 0.5, 1],
            }}
          />
          <h2 className="text-3xl md:text-5xl font-display mb-4 leading-tight drop-shadow-sm">
            Stop avoiding the math.
          </h2>
          <p className="text-lg text-muted-foreground font-body leading-relaxed mb-10 max-w-md mx-auto">
            The tree is right here. The figs are falling. Enter your town (or
            zip) and find out what your life actually costs.
          </p>

          <form onSubmit={handleSubmit}>
            {zipInput}
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer ref={footerRef} className="relative z-10 py-12 px-6 border-t border-border/30 text-center bg-background">
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-body">
          AtWhatCost · 2026
        </p>
        <p className="text-xs text-muted-foreground font-body mt-2 italic">
          "I saw my life branching out before me like the green fig tree in the
          story." — Sylvia Plath, <em>The Bell Jar</em>
        </p>
      </footer>
    </div>
  );
};

export default Index;

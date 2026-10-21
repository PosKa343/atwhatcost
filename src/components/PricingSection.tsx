import { motion } from "framer-motion";

const PricingSection = () => {
  return (
    <section className="py-24 px-6 border-t border-border">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-display mb-4">Pricing</h2>
          <p className="text-muted-foreground font-body mb-12">
            Because your indecision is already costing you.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-8 border border-border rounded-sm text-left"
          >
            <p className="text-xs tracking-[0.2em] text-muted-foreground font-body uppercase">Free</p>
            <p className="text-4xl font-display mt-2 mb-4">$0</p>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">
              The full reality check. Your Dissonance Score, side-by-side city comparisons,
              and the brutal truth about your finances.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-8 border border-fig-olive/30 rounded-sm text-left bg-fig-parchment/50"
          >
            <p className="text-xs tracking-[0.2em] text-fig-olive font-body uppercase">Partner Mode</p>
            <p className="text-4xl font-display mt-2 mb-4">$5</p>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">
              Argue with your significant other using math.
              Overlay two sets of priorities and see where you actually disagree.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

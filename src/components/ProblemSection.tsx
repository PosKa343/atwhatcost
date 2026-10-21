import { motion } from "framer-motion";
import figIcon from "@/assets/falling-fig.png";

const ProblemSection = () => {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="backdrop-blur-md bg-background/70 rounded-lg p-8 md:p-12"
        >
          <img
            src={figIcon}
            alt="Fig illustration"
            className="w-16 h-16 mx-auto mb-8 opacity-60"
            loading="lazy"
            width={512}
            height={512}
          />
          <h2 className="text-3xl md:text-5xl font-display mb-6 leading-tight drop-shadow-sm">
            The "Fig Tree" Dilemma
          </h2>
          <div className="text-lg text-muted-foreground font-body leading-relaxed max-w-2xl mx-auto space-y-4">
            <p>In New Jersey, every choice is a trade-off.</p>
            <p>
              Like the fig tree in <em>The Bell Jar</em>, each path is a different life — a different town, a different cost, a different version of what "works."
              <br />Pick one, and you lose the others. Wait too long, and they're gone anyway.
            </p>
            <p>
              You're not stuck because you don't have options.
              <br />You're stuck because the numbers don't match the life you want.
            </p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {[
            {
              num: "01",
              title: "Confess",
              desc: "Enter your current NJ town, real salary, and what you claim your priorities are.",
            },
            {
              num: "02",
              title: "Calculate",
              desc: "We pull cost-of-living, rent, and tax data to run the numbers you've been avoiding.",
            },
            {
              num: "03",
              title: "Confront",
              desc: "Get your Dissonance Score and see exactly what each \"fig\" actually costs.",
            },
          ].map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-left p-6 border border-border rounded-sm backdrop-blur-md bg-background/70"
            >
              <span className="text-xs font-body tracking-[0.2em] text-muted-foreground">
                STEP {step.num}
              </span>
              <h3 className="text-xl font-display mt-2 mb-3">{step.title}</h3>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;

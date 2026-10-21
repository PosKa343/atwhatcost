import { motion } from "framer-motion";
import type { AssessmentResult } from "@/lib/calculator";
import DissonanceGauge from "./DissonanceGauge";
import CityComparisonCard from "./CityComparisonCard";
import ShareCard from "./ShareCard";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "./ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

interface FigTreeDashboardProps {
  result: AssessmentResult;
}

const FigTreeDashboard = ({ result }: FigTreeDashboardProps) => {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      {/* Dissonance Score */}
      <div className="text-center mb-8">
        <DissonanceGauge score={result.dissonanceScore} />
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="text-center text-lg md:text-xl font-display italic max-w-2xl mx-auto mb-16 leading-relaxed"
      >
        "{result.dissonanceSummary}"
      </motion.p>

      {/* City Comparison Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
        <CityComparisonCard result={result.currentCity} isCurrentCity delay={0.2} priorities={result.priorities} />
        {result.targetCities.map((tc, i) => (
          <CityComparisonCard key={tc.city.id} result={tc} delay={0.4 + i * 0.15} priorities={result.priorities} />
        ))}
      </div>

      {/* Timeline Projection (static) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="border border-border rounded-sm p-8 mb-16"
      >
        <h3 className="text-xl font-display mb-2">10-Year Rent Projection</h3>
        <p className="text-sm text-muted-foreground font-body mb-4">
          This chart shows how much you'd spend on rent over the next 10 years in each location. The steeper the line,
          the more you're paying. The gap between your chosen fig and the alternatives represents potential savings —
          money you could put toward a down payment, investments, or simply a better quality of life.
        </p>
        <p className="text-xs text-muted-foreground font-body italic mb-4">
          Rent-controlled towns (per the 2025 NJ DCA Rent Control Survey) grow at their local cap.
          Everywhere else assumes 3%/yr — the long-run US rent CPI average. Assumes you stay in the same unit;
          most NJ ordinances allow vacancy decontrol on turnover.
        </p>
        {(() => {
          const ALT_COLORS = ["#e28121", "#F0D186", "#F8E8C0"];
          const DEFAULT_GROWTH = 0.03;
          const growthFor = (city: { rentControl?: boolean; rentControlMaxIncrease?: number | null }) =>
            city.rentControl && city.rentControlMaxIncrease != null
              ? city.rentControlMaxIncrease
              : DEFAULT_GROWTH;
          // Cumulative rent through `year`, with annual rent compounding at `g`.
          // sum_{k=0..year-1} rent*12*(1+g)^k = rent*12 * ((1+g)^year - 1) / g
          const cumulativeRent = (rent: number, g: number, year: number) =>
            g === 0 ? rent * 12 * year : (rent * 12 * (Math.pow(1 + g, year) - 1)) / g;
          const currentRent = result.currentCity.city.avgRent1BR;
          const currentGrowth = growthFor(result.currentCity.city);
          const data = Array.from({ length: 10 }, (_, i) => {
            const year = i + 1;
            const row: Record<string, string | number> = {
              year: `Yr ${year}`,
              current: Math.round(cumulativeRent(currentRent, currentGrowth, year) / 1000),
            };
            result.targetCities.forEach((tc, idx) => {
              row[`alt${idx}`] = Math.round(
                cumulativeRent(tc.city.avgRent1BR, growthFor(tc.city), year) / 1000,
              );
            });
            return row;
          });

          const chartConfig: ChartConfig = {
            current: {
              label: result.currentCity.city.name,
              color: "#5A465F",
            },
            ...Object.fromEntries(
              result.targetCities.map((tc, idx) => [
                `alt${idx}`,
                { label: tc.city.name, color: ALT_COLORS[idx] || ALT_COLORS[0] },
              ]),
            ),
          };

          const tooltipNameMap: Record<string, string> = {
            current: result.currentCity.city.name,
            ...Object.fromEntries(result.targetCities.map((tc, idx) => [`alt${idx}`, tc.city.name])),
          };

          return (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <LineChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis
                  dataKey="year"
                  className="text-xs font-body"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  label={{
                    value: "Year",
                    position: "insideBottom",
                    offset: -2,
                    fill: "hsl(var(--muted-foreground))",
                    className: "text-xs font-body",
                  }}
                />
                <YAxis
                  className="text-xs font-body"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `$${v}k`}
                  label={{
                    value: "Cumulative Rent ($k)",
                    angle: -90,
                    position: "insideLeft",
                    offset: 10,
                    fill: "hsl(var(--muted-foreground))",
                    className: "text-xs font-body",
                  }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [`$${value}k`, tooltipNameMap[name as string] || name]}
                    />
                  }
                />
                <Line type="monotone" dataKey="current" stroke="var(--color-current)" strokeWidth={2} dot={false} />
                {result.targetCities.map((_, idx) => (
                  <Line
                    key={idx}
                    type="monotone"
                    dataKey={`alt${idx}`}
                    stroke={`var(--color-alt${idx})`}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          );
        })()}
        <div className="flex gap-6 mt-4 justify-center flex-wrap">
          <span className="flex items-center gap-2 text-xs font-body text-muted-foreground">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#5A465F" }} />
            {result.currentCity.city.name}
          </span>
          {result.targetCities.map((tc, idx) => (
            <span key={idx} className="flex items-center gap-2 text-xs font-body text-muted-foreground">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: ["#e28121", "#F0D186", "#F8E8C0"][idx] }}
              />
              {tc.city.name}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default FigTreeDashboard;

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { CityResult, Priority, CardCategory } from "@/lib/calculator";
import { PRIORITY_TO_CATEGORIES, ALL_CATEGORIES, CATEGORY_LABELS, ALWAYS_SHOWN_CATEGORIES } from "@/lib/calculator";

interface CityComparisonCardProps {
  result: CityResult;
  isCurrentCity?: boolean;
  delay?: number;
  priorities: Priority[];
}

const StatRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-baseline py-1">
    <span className="text-xs text-muted-foreground font-body">{label}</span>
    <span className="font-display text-sm">{value}</span>
  </div>
);

// Format a possibly-null metric. `null` means the data has not been seeded for
// this town — render an em-dash rather than misleading 0.
const fmt = (
  v: number | null | undefined,
  formatter: (n: number) => string = (n) => `${n}`,
): string => (v === null || v === undefined ? "—" : formatter(v));

const CategoryHeader = ({ title }: { title: string }) => (
  <p className="text-[10px] tracking-[0.2em] uppercase text-fig-olive font-body mt-4 mb-1 first:mt-0">
    {title}
  </p>
);

function getCategoryContent(cat: CardCategory, city: CityResult["city"], monthlyTakeHome: number) {
  switch (cat) {
    case "rent":
      return (
        <>
          <CategoryHeader title={CATEGORY_LABELS.rent} />
          <StatRow label="Avg. Rent (1BR)" value={`$${city.avgRent1BR.toLocaleString()}/mo`} />
          <StatRow label="Avg. Sq Ft" value={`${city.avgSquareFeet1BR} ft²`} />
          <StatRow label="Median Home Price" value={`$${(city.medianHomePrice / 1000).toFixed(0)}k`} />
        </>
      );
    case "col":
      return (
        <>
          <CategoryHeader title={CATEGORY_LABELS.col} />
          <StatRow label="COL Index" value={`${city.colIndex} / 100`} />
          <StatRow label="Groceries" value={`${city.groceryIndex} / 100`} />
          <StatRow label="Utilities" value={`${city.utilityIndex} / 100`} />
        </>
      );
    case "salaries":
      return (
        <>
          <CategoryHeader title={CATEGORY_LABELS.salaries} />
          <StatRow label="Monthly Take-Home" value={`$${monthlyTakeHome.toLocaleString()}`} />
          <StatRow label="Median Household" value={`$${(city.medianHouseholdIncome / 1000).toFixed(0)}k`} />
        </>
      );
    case "taxes":
      return (
        <>
          <CategoryHeader title={CATEGORY_LABELS.taxes} />
          <StatRow
            label="Avg. Annual Bill"
            value={fmt(city.avgPropertyTax, (n) => `$${n.toLocaleString()}`)}
          />
          <StatRow
            label="Effective Rate"
            value={fmt(city.effectivePropertyTaxRate, (n) => `${n.toFixed(2)}%`)}
          />
        </>
      );
    case "walkability":
      return (
        <>
          <CategoryHeader title={CATEGORY_LABELS.walkability} />
          <StatRow label="Walk Score" value={fmt(city.walkScore)} />
          <StatRow label="Transit Score" value={fmt(city.transitScore)} />
          <StatRow label="Bike Score" value={fmt(city.bikeScore)} />
        </>
      );
    case "jobs":
      return (
        <>
          <CategoryHeader title={CATEGORY_LABELS.jobs} />
          <StatRow label="Unemployment" value={fmt(city.unemploymentRate, (n) => `${n}%`)} />
          <StatRow
            label="Job Growth"
            value={fmt(city.jobGrowthRate, (n) => `${n > 0 ? "+" : ""}${n}%`)}
          />
          <StatRow label="Avg. Commute" value={fmt(city.commuteAvgMin, (n) => `${n} min`)} />
        </>
      );
    case "qol":
      return (
        <>
          <CategoryHeader title={CATEGORY_LABELS.qol} />
          <StatRow label="Sunny Days/yr" value={fmt(city.avgSunnyDays)} />
          <StatRow label="Nightlife" value={fmt(city.nightlifeScore, (n) => `${n}/100`)} />
          <StatRow label="Nature & Green" value={fmt(city.natureScore, (n) => `${n}/100`)} />
          <StatRow label="Safety" value={city.crimeIndex < 60 ? "Low crime" : city.crimeIndex < 100 ? "Average" : "Above avg"} />
        </>
      );
  }
}

const CityComparisonCard = ({ result, isCurrentCity = false, delay = 0, priorities }: CityComparisonCardProps) => {
  const { city, monthlyTakeHome, disposableIncome } = result;
  const [showMore, setShowMore] = useState(false);

  // Derive which categories are primary (always-shown + from selected priorities)
  const primarySet = new Set<CardCategory>(ALWAYS_SHOWN_CATEGORIES);
  priorities.forEach((p) => {
    PRIORITY_TO_CATEGORIES[p]?.forEach((c) => primarySet.add(c));
  });

  const primaryCategories = ALL_CATEGORIES.filter((c) => primarySet.has(c));
  const secondaryCategories = ALL_CATEGORIES.filter((c) => !primarySet.has(c));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`p-5 rounded-sm border ${
        isCurrentCity
          ? "border-score-high/30 bg-score-high/5"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-body">
            {isCurrentCity ? "Chosen Fig" : "Alternate Fig"}
          </p>
          <h3 className="text-lg font-display mt-0.5">
            {city.name}, {city.state}
          </h3>
        </div>
        {isCurrentCity && (
          <span className="text-[10px] px-2 py-0.5 bg-score-high/10 text-score-high rounded-sm font-body">
            Current
          </span>
        )}
      </div>

      {/* Primary categories */}
      <div className="divide-y divide-border/30">
        {primaryCategories.map((cat) => (
          <div key={cat} className="pb-2">
            {getCategoryContent(cat, city, monthlyTakeHome)}
          </div>
        ))}
      </div>

      {/* Secondary categories - collapsible */}
      {secondaryCategories.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-1.5 w-full py-2 text-xs text-muted-foreground font-body hover:text-foreground transition-colors"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${showMore ? "rotate-180" : ""}`}
            />
            {showMore ? "Hide" : "Show"} {secondaryCategories.length} more categories
          </button>
          {showMore && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="divide-y divide-border/30"
            >
              {secondaryCategories.map((cat) => (
                <div key={cat} className="pb-2">
                  {getCategoryContent(cat, city, monthlyTakeHome)}
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Disposable Income - highlight */}
      <div className="mt-3 pt-3 border-t border-border flex justify-between items-baseline">
        <span className="text-sm font-body font-medium">Disposable Income</span>
        <span className={`font-display text-xl font-bold ${
          disposableIncome < 0 ? "text-score-high" : "text-score-low"
        }`}>
          ${disposableIncome.toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
};

export default CityComparisonCard;

import { findCityById, findCityByZip, CITIES } from "@/lib/city-data";

export interface CityData {
  id: string;
  name: string;
  state: string;
  // Rent & Housing
  avgRent1BR: number;
  avgSquareFeet1BR: number;
  medianHomePrice: number;
  // Cost of Living
  colIndex: number; // 100 = national avg
  groceryIndex: number; // 100 = national avg
  utilityIndex: number; // 100 = national avg
  // Salaries & Income
  stateIncomeTaxRate: number;
  medianHouseholdIncome: number;
  // Property Taxes — nullable when data is not yet seeded for a town
  effectivePropertyTaxRate: number | null; // per $100 assessed value
  avgPropertyTax: number | null; // annual avg residential property tax bill
  // Walkability & Transit
  walkScore: number | null;
  transitScore: number | null;
  bikeScore: number | null;
  // Jobs & Career
  unemploymentRate: number | null; // percentage
  jobGrowthRate: number | null; // annual % change
  // Quality of Life
  avgSunnyDays: number | null;
  nightlifeScore: number | null; // 0-100
  natureScore: number | null; // 0-100
  crimeIndex: number; // lower = safer, national avg = 100
  commuteAvgMin: number | null; // avg one-way commute in minutes
  // Rent control (per 2025 NJDCA Rent Control Survey)
  rentControl?: boolean;
  // Annual cap on rent increases as a decimal (e.g. 0.04 = 4%).
  // null/undefined = no fixed cap (e.g. CPI-indexed); fall back to default growth assumption.
  rentControlMaxIncrease?: number | null;
}

// NJ state income tax brackets (2024):
// 1.4% on first $20,000
// 1.75% on $20,001-$35,000
// 3.5% on $35,001-$40,000
// 5.525% on $40,001-$75,000
// 6.37% on $75,001-$500,000
// 8.97% on $500,001-$1,000,000
// 10.75% on $1,000,001+
const NJ_STATE_TAX_RATE = 0.0637; // effective rate for typical salary range $75k-$150k

// Fallback for zips that aren't in our dataset
export const DEFAULT_NJ: CityData = {
  id: "nj-default",
  name: "New Jersey (avg)",
  state: "NJ",
  avgRent1BR: 1900,
  avgSquareFeet1BR: 700,
  medianHomePrice: 420000,
  colIndex: 115,
  groceryIndex: 105,
  utilityIndex: 102,
  stateIncomeTaxRate: NJ_STATE_TAX_RATE,
  medianHouseholdIncome: 88000,
  effectivePropertyTaxRate: 2.5,
  avgPropertyTax: 9200,
  walkScore: 55,
  transitScore: 35,
  bikeScore: 38,
  unemploymentRate: 3.8,
  jobGrowthRate: 1.5,
  avgSunnyDays: 208,
  nightlifeScore: 35,
  natureScore: 50,
  crimeIndex: 75,
  commuteAvgMin: 32,
};

export type Priority = "crime" | "employment" | "transit" | "climate" | "healthcare" | "education" | "vibes" | "growth";

export const PRIORITY_LABELS: Record<Priority, string> = {
  crime: "Crime",
  employment: "Employment",
  transit: "Transit",
  climate: "Climate",
  healthcare: "Healthcare",
  education: "Education",
  vibes: "Vibes",
  growth: "Growth",
};

export const PRIORITY_QUESTIONS: Record<Priority, string> = {
  crime: "Safety",
  employment: "Job market",
  transit: "Getting around",
  climate: "Weather",
  healthcare: "Medical access",
  education: "Education",
  vibes: "Vibes",
  growth: "Long-term potential",
};

// Which card category each priority maps to
export type CardCategory = "rent" | "col" | "salaries" | "taxes" | "walkability" | "jobs" | "qol";

// Rent is ALWAYS shown on cards (not tied to a priority)
export const ALWAYS_SHOWN_CATEGORIES: CardCategory[] = ["rent"];

export const PRIORITY_TO_CATEGORIES: Record<Priority, CardCategory[]> = {
  crime: ["qol"],
  employment: ["jobs", "salaries"],
  transit: ["walkability"],
  climate: ["qol"],
  healthcare: ["qol"],
  education: ["qol"],
  vibes: ["qol"],
  growth: ["jobs"],
};

export const ALL_CATEGORIES: CardCategory[] = ["rent", "col", "salaries", "taxes", "walkability", "jobs", "qol"];

export const CATEGORY_LABELS: Record<CardCategory, string> = {
  rent: "Rent & Housing",
  col: "Cost of Living",
  salaries: "Salaries & Income",
  taxes: "Property Taxes",
  walkability: "Walkability & Transit",
  jobs: "Jobs & Career",
  qol: "Quality of Life",
};


// NJ state income tax calculation (2024 brackets)
function calcNJStateTax(income: number): number {
  let tax = 0;
  const brackets = [
    { limit: 20000, rate: 0.014 },
    { limit: 35000, rate: 0.0175 },
    { limit: 40000, rate: 0.035 },
    { limit: 75000, rate: 0.05525 },
    { limit: 500000, rate: 0.0637 },
    { limit: 1000000, rate: 0.0897 },
    { limit: Infinity, rate: 0.1075 },
  ];
  let remaining = income;
  let prevLimit = 0;
  for (const bracket of brackets) {
    const taxable = Math.min(remaining, bracket.limit - prevLimit);
    if (taxable <= 0) break;
    tax += taxable * bracket.rate;
    remaining -= taxable;
    prevLimit = bracket.limit;
  }
  return tax;
}

// Federal tax calculation (2024 single filer brackets)
function calcFederalTax(income: number): number {
  let tax = 0;
  const brackets = [
    { limit: 11600, rate: 0.1 },
    { limit: 47150, rate: 0.12 },
    { limit: 100525, rate: 0.22 },
    { limit: 191950, rate: 0.24 },
    { limit: 243725, rate: 0.32 },
    { limit: 609350, rate: 0.35 },
    { limit: Infinity, rate: 0.37 },
  ];
  // Standard deduction
  const taxableIncome = Math.max(0, income - 14600);
  let remaining = taxableIncome;
  let prevLimit = 0;
  for (const bracket of brackets) {
    const taxable = Math.min(remaining, bracket.limit - prevLimit);
    if (taxable <= 0) break;
    tax += taxable * bracket.rate;
    remaining -= taxable;
    prevLimit = bracket.limit;
  }
  return tax;
}

export function calcMonthlyTakeHome(annualSalary: number, _city: CityData): number {
  const federalTax = calcFederalTax(annualSalary);
  const stateTax = calcNJStateTax(annualSalary);
  const ficaTax = annualSalary * 0.0765;
  const netAnnual = annualSalary - federalTax - stateTax - ficaTax;
  return Math.round(netAnnual / 12);
}

export function calcDisposableIncome(monthlyTakeHome: number, rent: number): number {
  return monthlyTakeHome - rent;
}

export interface CityResult {
  city: CityData;
  monthlyTakeHome: number;
  disposableIncome: number;
}

export interface AssessmentResult {
  currentCity: CityResult;
  targetCities: CityResult[];
  dissonanceScore: number;
  dissonanceSummary: string;
  priorities: Priority[];
}

// Returns null when required metrics are missing — caller must drop the term
// from any weighted average rather than treating it as a zero.
function getPriorityValue(city: CityData, priority: Priority): number | null {
  const present = (...v: (number | null | undefined)[]) =>
    v.every((x) => x !== null && x !== undefined);
  switch (priority) {
    case "crime":
      return Math.max(0, 200 - city.crimeIndex);
    case "employment":
      if (!present(city.unemploymentRate, city.jobGrowthRate)) return null;
      return 100 - city.unemploymentRate! * 10 + city.jobGrowthRate! * 10;
    case "transit":
      if (!present(city.walkScore, city.transitScore)) return null;
      return city.walkScore! + city.transitScore!;
    case "climate":
      if (!present(city.avgSunnyDays)) return null;
      return city.avgSunnyDays!;
    case "healthcare":
      return Math.max(0, 100 - city.crimeIndex * 0.3 + city.medianHouseholdIncome / 2000);
    case "education":
      return city.medianHouseholdIncome / 2000 + Math.max(0, 100 - city.crimeIndex * 0.3);
    case "vibes":
      if (!present(city.nightlifeScore, city.natureScore, city.walkScore)) return null;
      return city.nightlifeScore! + city.natureScore! + city.walkScore! * 0.4;
    case "growth":
      if (!present(city.jobGrowthRate, city.unemploymentRate)) return null;
      return city.jobGrowthRate! * 20 + Math.max(0, 100 - city.unemploymentRate! * 10);
  }
}

// Labels used in the dissonance summary sentence ("You claim to want safety…")
const SUMMARY_LABELS: Record<Priority, string> = {
  crime: "Safety",
  employment: "Employment",
  transit: "Transit",
  climate: "Climate",
  healthcare: "Medical access",
  education: "Education",
  vibes: "Vibes",
  growth: "Long-term potential",
};

export type AssessmentLocation = { zip: string } | { cityId: string };

// Weighted average across priorities (#1 = weight 5 … #5 = weight 1), skipping
// metrics with missing data and re-normalizing so sparse data doesn't penalize.
function priorityScore(city: CityData, priorities: Priority[]): number {
  let sum = 0;
  let wTotal = 0;
  priorities.forEach((p, i) => {
    const weight = 5 - i;
    const v = getPriorityValue(city, p);
    if (v !== null) {
      sum += v * weight;
      wTotal += weight;
    }
  });
  return wTotal > 0 ? sum / wTotal : -Infinity;
}

export function calculateAssessment(
  location: AssessmentLocation,
  salary: number,
  priorities: Priority[],
): AssessmentResult {
  const zip = "zip" in location ? location.zip : undefined;
  const njTown =
    ("cityId" in location ? findCityById(location.cityId) : findCityByZip(location.zip)) ??
    { ...DEFAULT_NJ, name: zip ? `NJ (${zip})` : "NJ (unknown)" };
  const njTakeHome = calcMonthlyTakeHome(salary, njTown);

  const currentCity: CityResult = {
    city: njTown,
    monthlyTakeHome: njTakeHome,
    disposableIncome: calcDisposableIncome(njTakeHome, njTown.avgRent1BR),
  };

  // Every other town is a candidate; rank by fit with the user's priorities
  const topTargets: CityResult[] = CITIES.filter((c) => c.id !== njTown.id)
    .map((city) => ({ city, score: priorityScore(city, priorities) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ city }) => {
      const takeHome = calcMonthlyTakeHome(salary, city);
      return {
        city,
        monthlyTakeHome: takeHome,
        disposableIncome: calcDisposableIncome(takeHome, city.avgRent1BR),
      };
    });

  // Calculate dissonance
  let dissonanceRaw = 0;
  const bestTarget = topTargets.reduce(
    (best, t) => (t.disposableIncome > best.disposableIncome ? t : best),
    topTargets[0],
  );

  priorities.forEach((p, i) => {
    const weight = 5 - i;
    const njVal = getPriorityValue(njTown, p);
    const targetVals = topTargets
      .map((t) => getPriorityValue(t.city, p))
      .filter((v): v is number => v !== null);
    if (njVal === null || targetVals.length === 0) return;
    const bestVal = Math.max(...targetVals);
    if (bestVal > njVal) {
      dissonanceRaw += ((bestVal - njVal) / bestVal) * weight * 20;
    }
  });

  if (bestTarget && bestTarget.disposableIncome > currentCity.disposableIncome) {
    const gap = (bestTarget.disposableIncome - currentCity.disposableIncome) / bestTarget.disposableIncome;
    dissonanceRaw += gap * 30;
  }

  const dissonanceScore = Math.min(99, Math.max(15, Math.round(dissonanceRaw)));

  const summaries: Record<string, string> = {
    high: `Your Dissonance Score is ${dissonanceScore}%. You claim to want ${SUMMARY_LABELS[priorities[0]].toLowerCase()}, but you're paying $${njTown.avgRent1BR.toLocaleString()}/mo to live in ${njTown.name}. There are cheaper figs on the same tree.`,
    mid: `Your Dissonance Score is ${dissonanceScore}%. You're not delusional, but you're not honest either. Other NJ towns deliver more of what you say you want for less.`,
    low: `Your Dissonance Score is ${dissonanceScore}%. Your life in ${njTown.name} actually aligns with what you say you want. The bagels might be worth it.`,
  };

  const tier = dissonanceScore >= 65 ? "high" : dissonanceScore >= 35 ? "mid" : "low";

  return {
    currentCity,
    targetCities: topTargets,
    dissonanceScore,
    dissonanceSummary: summaries[tier],
    priorities,
  };
}

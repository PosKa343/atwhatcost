import { describe, expect, it } from "vitest";
import { calculateAssessment, calcMonthlyTakeHome, type Priority } from "@/lib/calculator";
import { CITIES, findCityById, findCityByZip } from "@/lib/city-data";
import zipCodes from "@/data/zip-codes.json";

describe("city data", () => {
  it("has unique town ids", () => {
    expect(new Set(CITIES.map((c) => c.id)).size).toBe(CITIES.length);
  });

  it("maps every zip code to a known town", () => {
    for (const [zip, id] of Object.entries(zipCodes)) {
      expect(zip).toMatch(/^\d{5}$/);
      expect(findCityById(id), `${zip} -> ${id}`).toBeDefined();
    }
  });

  it("looks up towns by id and zip", () => {
    expect(findCityById("hoboken")?.name).toBe("Hoboken");
    expect(findCityByZip("07030")?.id).toBe("hoboken");
    expect(findCityByZip("00000")).toBeUndefined();
  });
});

describe("calculateAssessment", () => {
  const priorities: Priority[] = ["transit", "vibes", "crime"];

  it("resolves the current town from a zip or a town id", () => {
    const byZip = calculateAssessment({ zip: "07960" }, 85000, priorities);
    const byId = calculateAssessment({ cityId: "morristown" }, 85000, priorities);
    expect(byZip.currentCity.city.id).toBe("morristown");
    expect(byId).toEqual(byZip);
  });

  it("falls back to NJ averages for an unknown zip", () => {
    const result = calculateAssessment({ zip: "08999" }, 85000, priorities);
    expect(result.currentCity.city.id).toBe("nj-default");
    expect(result.currentCity.city.name).toBe("NJ (08999)");
  });

  it("returns the top 3 other towns ranked by the user's priorities", () => {
    const result = calculateAssessment({ zip: "07030" }, 120000, ["transit"]);
    expect(result.targetCities).toHaveLength(3);
    expect(result.targetCities.map((t) => t.city.id)).not.toContain("hoboken");

    // Ranked by walk + transit score (the "transit" priority)
    const transit = (id: string) => {
      const c = findCityById(id)!;
      return c.walkScore! + c.transitScore!;
    };
    const ranked = result.targetCities.map((t) => transit(t.city.id));
    const best = Math.max(...CITIES.filter((c) => c.id !== "hoboken").map((c) => transit(c.id)));
    expect(ranked[0]).toBe(best);
    expect([...ranked].sort((a, b) => b - a)).toEqual(ranked);
  });

  it("computes take-home and disposable income", () => {
    const result = calculateAssessment({ cityId: "newark" }, 90000, priorities);
    const takeHome = calcMonthlyTakeHome(90000, result.currentCity.city);
    expect(result.currentCity.monthlyTakeHome).toBe(takeHome);
    expect(result.currentCity.disposableIncome).toBe(takeHome - result.currentCity.city.avgRent1BR);
  });

  it("keeps the dissonance score within 15-99 with a matching summary", () => {
    for (const city of CITIES) {
      const result = calculateAssessment({ cityId: city.id }, 85000, priorities);
      expect(result.dissonanceScore).toBeGreaterThanOrEqual(15);
      expect(result.dissonanceScore).toBeLessThanOrEqual(99);
      expect(result.dissonanceSummary).toContain(`${result.dissonanceScore}%`);
    }
  });

  it("uses the friendly priority label in the high-dissonance summary", () => {
    const result = calculateAssessment({ cityId: "camden" }, 85000, ["crime"]);
    expect(result.dissonanceScore).toBeGreaterThanOrEqual(65);
    expect(result.dissonanceSummary).toContain("You claim to want safety");
  });
});

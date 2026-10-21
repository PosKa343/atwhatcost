// Local town dataset (replaces the old hosted `cities` / `zip_aliases` tables).
//
// Curated town data sourced from:
// Rent: Zillow, Apartments.com, Zumper (2025-2026 data)
// Walk Score: WalkScore.com
// Tax rates: NJ Treasury 2024 General & Effective Tax Rates
// COL Index: relative to national avg (100), sourced from Numbeo/BestPlaces estimates
// Sunny days: NOAA climate normals
// Avg sqft: Apartments.com market trends
//
// Refresh objective fields from Census/BLS with `npm run seed:towns` / `npm run seed:cities`.
import type { CityData } from "@/lib/calculator";
import cities from "@/data/cities.json";
import zipCodes from "@/data/zip-codes.json";

export const CITIES: CityData[] = cities;

const BY_ID = new Map(CITIES.map((c) => [c.id, c]));
const ZIP_TO_CITY_ID: Record<string, string> = zipCodes;

export function findCityById(id: string): CityData | undefined {
  return BY_ID.get(id);
}

export function findCityByZip(zip: string): CityData | undefined {
  const id = ZIP_TO_CITY_ID[zip];
  return id ? BY_ID.get(id) : undefined;
}

// Read/write helpers for the local dataset in src/data/.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { CityData } from "../../src/lib/calculator.ts";

export type { CityData };

const DATA_DIR = fileURLToPath(new URL("../../src/data/", import.meta.url));
const CITIES_FILE = `${DATA_DIR}cities.json`;
const ZIP_CODES_FILE = `${DATA_DIR}zip-codes.json`;

export function readCities(): CityData[] {
  return JSON.parse(readFileSync(CITIES_FILE, "utf8"));
}

export function writeCities(cities: CityData[]): void {
  const sorted = [...cities].sort((a, b) => a.name.localeCompare(b.name));
  writeFileSync(CITIES_FILE, JSON.stringify(sorted, null, 2) + "\n");
}

// zip -> city id
export function readZipCodes(): Record<string, string> {
  return JSON.parse(readFileSync(ZIP_CODES_FILE, "utf8"));
}

export function writeZipCodes(zipCodes: Record<string, string>): void {
  const sorted = Object.fromEntries(
    Object.entries(zipCodes).sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(ZIP_CODES_FILE, JSON.stringify(sorted, null, 2) + "\n");
}

// Census ACS uses large negative sentinels (e.g. -666666666) for missing values.
export function acsNumber(raw: string | undefined): number {
  const n = parseInt(raw ?? "");
  return Number.isFinite(n) && n > 0 ? n : 0;
}

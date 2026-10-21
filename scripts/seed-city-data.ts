// Refreshes objective fields for the curated towns in src/data/cities.json from
// free public APIs (Census ACS 5-Year + BLS LAUS). No API keys required.
//
//   npm run seed:cities
import { acsNumber, readCities, writeCities, type CityData } from "./lib/data-files.ts";

// NJ state FIPS = 34. Map our city IDs to Census place FIPS codes.
const CITY_CENSUS_MAP: Record<string, { placeFips: string; countyFips: string; blsAreaCode: string }> = {
  "asbury-park":   { placeFips: "02080", countyFips: "025", blsAreaCode: "35620" },
  "bayville":      { placeFips: "04120", countyFips: "029", blsAreaCode: "36140" },
  "bergenfield":   { placeFips: "05110", countyFips: "003", blsAreaCode: "35620" },
  "camden":        { placeFips: "10000", countyFips: "007", blsAreaCode: "37980" },
  "cherry-hill":   { placeFips: "13690", countyFips: "007", blsAreaCode: "37980" },
  "edison":        { placeFips: "21000", countyFips: "023", blsAreaCode: "35620" },
  "fort-lee":      { placeFips: "24420", countyFips: "003", blsAreaCode: "35620" },
  "hackensack":    { placeFips: "29310", countyFips: "003", blsAreaCode: "35620" },
  "hoboken":       { placeFips: "32250", countyFips: "017", blsAreaCode: "35620" },
  "jersey-city":   { placeFips: "36000", countyFips: "017", blsAreaCode: "35620" },
  "livingston":    { placeFips: "40680", countyFips: "013", blsAreaCode: "35620" },
  "montclair":     { placeFips: "47500", countyFips: "013", blsAreaCode: "35620" },
  "morristown":    { placeFips: "48300", countyFips: "027", blsAreaCode: "35620" },
  "neptune":       { placeFips: "50670", countyFips: "025", blsAreaCode: "35620" },
  "new-brunswick": { placeFips: "51210", countyFips: "023", blsAreaCode: "35620" },
  "newark":        { placeFips: "51000", countyFips: "013", blsAreaCode: "35620" },
  "paterson":      { placeFips: "55950", countyFips: "031", blsAreaCode: "35620" },
  "princeton":     { placeFips: "60900", countyFips: "021", blsAreaCode: "45940" },
  "short-hills":   { placeFips: "67470", countyFips: "013", blsAreaCode: "35620" },
  "south-orange":  { placeFips: "68670", countyFips: "013", blsAreaCode: "35620" },
  "summit":        { placeFips: "71430", countyFips: "039", blsAreaCode: "35620" },
  "toms-river":    { placeFips: "73470", countyFips: "029", blsAreaCode: "36140" },
  "trenton":       { placeFips: "74000", countyFips: "021", blsAreaCode: "45940" },
  "upper-montclair": { placeFips: "47500", countyFips: "013", blsAreaCode: "35620" }, // same Census place as Montclair
  "wayne":         { placeFips: "77960", countyFips: "031", blsAreaCode: "35620" },
  "westfield":     { placeFips: "79040", countyFips: "039", blsAreaCode: "35620" },
};

// --- Census Bureau ACS 5-Year (FREE, no key required) ---
// Fetches: median household income, population, median home value, commute time
async function fetchCensusData(): Promise<Map<string, Record<string, number>>> {
  const variables = [
    "B19013_001E", // median household income
    "B01003_001E", // total population
    "B25077_001E", // median home value
    "B08303_001E", // total commuters (aggregate travel time)
    "B08136_001E", // aggregate travel time to work (minutes)
  ].join(",");

  const url = `https://api.census.gov/data/2023/acs/acs5?get=${variables},NAME&for=place:*&in=state:34`;
  console.log("Fetching Census ACS data...");

  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text();
    console.error("Census API error:", resp.status, text);
    return new Map();
  }

  const rows = (await resp.json()) as string[][];
  const header = rows[0];
  const data = rows.slice(1);

  const result = new Map<string, Record<string, number>>();

  for (const row of data) {
    const placeFips = row[header.indexOf("place")];
    const medianIncome = acsNumber(row[header.indexOf("B19013_001E")]);
    const population = acsNumber(row[header.indexOf("B01003_001E")]);
    const medianHomeValue = acsNumber(row[header.indexOf("B25077_001E")]);
    const totalCommuters = acsNumber(row[header.indexOf("B08303_001E")]);
    const aggTravelTime = acsNumber(row[header.indexOf("B08136_001E")]);
    const avgCommute = totalCommuters > 0 ? Math.round(aggTravelTime / totalCommuters) : 0;

    result.set(placeFips, {
      medianHouseholdIncome: medianIncome,
      population,
      medianHomePrice: medianHomeValue,
      commuteAvgMin: avgCommute,
    });
  }

  console.log(`Census: got data for ${result.size} NJ places`);
  return result;
}

interface BlsResponse {
  status: string;
  message?: string[];
  Results?: { series?: { seriesID: string; data?: { value: string }[] }[] };
}

// --- BLS Local Area Unemployment (FREE, no key for small batches) ---
// Fetch unemployment rates for NJ counties via LAUS series
// Series format: LAUCN34XXX0000000003 (county unemployment rate)
async function fetchBLSUnemployment(): Promise<Map<string, number>> {
  const countyFips = [...new Set(Object.values(CITY_CENSUS_MAP).map((c) => c.countyFips))];
  const seriesIds = countyFips.map((fips) => `LAUCN34${fips}0000000003`);

  console.log(`Fetching BLS unemployment for ${seriesIds.length} NJ counties...`);

  const result = new Map<string, number>();

  // Use v2 POST to batch (works without key for small batches)
  const resp = await fetch("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      seriesid: seriesIds,
      startyear: "2024",
      endyear: "2024",
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error("BLS API error:", resp.status, text);
    return result;
  }

  const json = (await resp.json()) as BlsResponse;
  if (json.status !== "REQUEST_SUCCEEDED") {
    console.error("BLS request failed:", json.message);
    return result;
  }

  for (const series of json.Results?.series || []) {
    const seriesId = series.seriesID;
    // Extract county FIPS from series ID: LAUCN34XXX0000000003
    const countyCode = seriesId.substring(7, 10);

    // Get the most recent data point
    const latestData = series.data?.[0];
    if (latestData) {
      const rate = parseFloat(latestData.value);
      if (!isNaN(rate)) {
        result.set(countyCode, rate);
      }
    }
  }

  console.log(`BLS: got unemployment data for ${result.size} counties`);
  return result;
}

// --- Census Bureau ACS Housing Data (FREE) ---
// Fetches: median gross rent
async function fetchCensusRentData(): Promise<Map<string, number>> {
  const url = `https://api.census.gov/data/2023/acs/acs5?get=B25064_001E,NAME&for=place:*&in=state:34`;
  console.log("Fetching Census rent data...");

  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text();
    console.error("Census rent API error:", resp.status, text);
    return new Map();
  }

  const rows = (await resp.json()) as string[][];
  const header = rows[0];
  const data = rows.slice(1);

  const result = new Map<string, number>();
  for (const row of data) {
    const placeFips = row[header.indexOf("place")];
    const medianRent = acsNumber(row[header.indexOf("B25064_001E")]);
    if (medianRent > 0) {
      result.set(placeFips, medianRent);
    }
  }

  console.log(`Census rent: got data for ${result.size} NJ places`);
  return result;
}

// --- Census Bureau: Property tax data (FREE) ---
async function fetchCensusPropertyTax(): Promise<Map<string, { medianTax: number; medianValue: number }>> {
  // B25103_001E = Median real estate taxes paid
  // B25077_001E = Median home value (needed for the effective rate calc)
  const url = `https://api.census.gov/data/2023/acs/acs5?get=B25103_001E,B25077_001E,NAME&for=county:*&in=state:34`;
  console.log("Fetching Census property tax data...");

  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text();
    console.error("Census tax API error:", resp.status, text);
    return new Map();
  }

  const rows = (await resp.json()) as string[][];
  const header = rows[0];
  const data = rows.slice(1);

  const result = new Map<string, { medianTax: number; medianValue: number }>();
  for (const row of data) {
    const countyFips = row[header.indexOf("county")];
    const medianTax = acsNumber(row[header.indexOf("B25103_001E")]);
    const medianValue = acsNumber(row[header.indexOf("B25077_001E")]);
    if (medianTax > 0) {
      result.set(countyFips, { medianTax, medianValue });
    }
  }

  console.log(`Census property tax: got data for ${result.size} NJ counties`);
  return result;
}

async function main() {
  // Fetch all data sources in parallel
  const [censusData, rentData, blsData, taxData] = await Promise.all([
    fetchCensusData(),
    fetchCensusRentData(),
    fetchBLSUnemployment(),
    fetchCensusPropertyTax(),
  ]);

  const cities = readCities();
  const byId = new Map(cities.map((c) => [c.id, c]));
  const log: string[] = [];
  let updated = 0;

  for (const [cityId, mapping] of Object.entries(CITY_CENSUS_MAP)) {
    const city = byId.get(cityId);
    if (!city) {
      log.push(`${cityId}: not in cities.json, skipped`);
      continue;
    }

    const census = censusData.get(mapping.placeFips);
    const rent = rentData.get(mapping.placeFips);
    const unemployment = blsData.get(mapping.countyFips);
    const tax = taxData.get(mapping.countyFips);

    const fields: Partial<CityData> = {};

    // Census income & housing
    if (census) {
      if (census.medianHouseholdIncome > 0) fields.medianHouseholdIncome = census.medianHouseholdIncome;
      if (census.medianHomePrice > 0) fields.medianHomePrice = census.medianHomePrice;
      if (census.commuteAvgMin > 0) fields.commuteAvgMin = census.commuteAvgMin;
    }

    // Census rent (median gross rent as proxy for 1BR)
    if (rent && rent > 0) fields.avgRent1BR = rent;

    // BLS unemployment
    if (unemployment !== undefined) fields.unemploymentRate = unemployment;

    // Census property tax (county-level)
    if (tax) {
      fields.avgPropertyTax = tax.medianTax;
      if (tax.medianValue > 0) {
        fields.effectivePropertyTaxRate = parseFloat(((tax.medianTax / tax.medianValue) * 100).toFixed(2));
      }
    }

    if (Object.keys(fields).length > 0) {
      Object.assign(city, fields);
      updated++;
      log.push(`${cityId}: updated ${Object.keys(fields).length} fields`);
    } else {
      log.push(`${cityId}: NO DATA FOUND (place FIPS: ${mapping.placeFips})`);
    }
  }

  writeCities(cities);

  console.log(log.join("\n"));
  console.log({
    totalCities: Object.keys(CITY_CENSUS_MAP).length,
    citiesUpdated: updated,
    dataSources: {
      census: censusData.size > 0 ? `${censusData.size} places` : "FAILED",
      rent: rentData.size > 0 ? `${rentData.size} places` : "FAILED",
      bls: blsData.size > 0 ? `${blsData.size} counties` : "FAILED",
      propertyTax: taxData.size > 0 ? `${taxData.size} counties` : "FAILED",
    },
  });
}

main().catch((err) => {
  console.error("seed-city-data failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});

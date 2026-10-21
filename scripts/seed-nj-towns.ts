// Expands src/data/cities.json to every NJ town above a population threshold and
// rebuilds the zip -> town mapping in src/data/zip-codes.json, using free Census
// data (ACS 5-Year + 2020 ZCTA relationship files). No API keys required.
//
//   npm run seed:towns                       # towns with population >= 10,000
//   npm run seed:towns -- --min-pop=5000
//   npm run seed:towns -- --dry-run          # print a summary, write nothing
//
// Curated towns keep their subjective fields (walk score, crime, vibes...);
// only objective Census fields are refreshed for them.
import {
  acsNumber,
  readCities,
  readZipCodes,
  writeCities,
  writeZipCodes,
  type CityData,
} from "./lib/data-files.ts";

/**
 * NJ towns live in TWO Census geographies:
 *   - Places (cities, boroughs, CDPs) — e.g. Hoboken, Newark, Princeton
 *   - County Subdivisions (townships) — e.g. Edison, Toms River, Cherry Hill
 *
 * We unify them with a synthetic "geo_id" string:
 *   p:34<7-digit place fips>     for places
 *   s:34<3-digit county><5-digit cousub>   for subdivisions
 *
 * Curated slugs are pinned by name+type so we never duplicate the existing 26.
 */

// Map: synthetic geo_id -> existing slug (preserves curated subjective fields)
const CURATED_GEO_TO_SLUG: Record<string, string> = {
  // --- Places ---
  "p:3401960": "asbury-park",        // Asbury Park city
  "p:3405170": "bergenfield",        // Bergenfield borough
  "p:3410000": "camden",             // Camden city
  "p:3424420": "fort-lee",           // Fort Lee borough
  "p:3428680": "hackensack",         // Hackensack city
  "p:3432250": "hoboken",            // Hoboken city
  "p:3436000": "jersey-city",        // Jersey City city
  "p:3448300": "morristown",         // Morristown town
  "p:3451000": "newark",             // Newark city
  "p:3451210": "new-brunswick",      // New Brunswick city
  "p:3457000": "paterson",           // Paterson city
  "p:3460900": "princeton",          // Princeton
  "p:3467320": "short-hills",        // Short Hills CDP
  "p:3471430": "summit",             // Summit city
  "p:3474000": "trenton",            // Trenton city
  "p:3475020": "upper-montclair",    // Upper Montclair CDP
  "p:3479040": "westfield",          // Westfield town
  // --- Townships (county subdivisions) ---
  "s:3400712280": "cherry-hill",     // Cherry Hill township
  "s:3401340890": "livingston",      // Livingston township
  "s:3401347500": "montclair",       // Montclair township
  "s:3401369274": "south-orange",    // South Orange Village township
  "s:3402320230": "edison",          // Edison township
  "s:3402549890": "neptune",         // Neptune township
  "s:3402973125": "toms-river",      // Toms River township
  "s:3403177840": "wayne",           // Wayne township
  // bayville is a CDP inside Berkeley township; keep using the place
  // (we'll match it dynamically by FIPS once we look it up — leave note)
};

// Defaults for newly added towns. Subjective metrics we have no data for are
// null so they drop out of priority scoring instead of counting as zero.
const NJ_DEFAULTS: Omit<
  CityData,
  "id" | "name" | "medianHouseholdIncome" | "medianHomePrice" | "avgRent1BR" | "commuteAvgMin"
> = {
  state: "NJ",
  stateIncomeTaxRate: 0.0637,
  colIndex: 110,
  groceryIndex: 105,
  utilityIndex: 102,
  avgSquareFeet1BR: 700,
  avgSunnyDays: 205,
  jobGrowthRate: 1.5,
  unemploymentRate: null,
  effectivePropertyTaxRate: null,
  avgPropertyTax: null,
  walkScore: null,
  transitScore: null,
  bikeScore: null,
  nightlifeScore: null,
  natureScore: null,
  crimeIndex: 100, // national average — no town-level data yet
};

function cleanName(raw: string): string {
  // "Cherry Hill township, Camden County, New Jersey" -> "Cherry Hill township"
  // "Hoboken city, New Jersey" -> "Hoboken city"
  return raw.split(",")[0].trim();
}

function displayName(raw: string): string {
  // Strip the trailing geography suffix for friendlier display
  const first = cleanName(raw);
  return first
    .replace(/\s+(township|borough|city|town|village|CDP)$/i, "")
    .trim();
}

function slugify(name: string): string {
  return displayName(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface GeoRow {
  geoId: string;       // "p:34xxxxxxx" or "s:34xxxxxxxx"
  kind: "place" | "cousub";
  rawName: string;
  population: number;
  medianIncome: number;
  medianHomeValue: number;
  rent: number;
  commute: number;
}

const ACS_VARS = [
  "NAME",
  "B01003_001E", // population
  "B19013_001E", // median household income
  "B25077_001E", // median home value
  "B25064_001E", // median gross rent
  "B08303_001E", // total commuters
  "B08136_001E", // aggregate travel time
];

function parseAcsRow(row: string[], h: string[]): Omit<GeoRow, "geoId" | "kind"> {
  const totalCommuters = acsNumber(row[h.indexOf("B08303_001E")]);
  const aggTravel = acsNumber(row[h.indexOf("B08136_001E")]);
  return {
    rawName: row[h.indexOf("NAME")] || "",
    population: acsNumber(row[h.indexOf("B01003_001E")]),
    medianIncome: acsNumber(row[h.indexOf("B19013_001E")]),
    medianHomeValue: acsNumber(row[h.indexOf("B25077_001E")]),
    rent: acsNumber(row[h.indexOf("B25064_001E")]),
    commute: totalCommuters > 0 ? Math.round(aggTravel / totalCommuters) : 0,
  };
}

async function fetchPlaces(): Promise<GeoRow[]> {
  const url = `https://api.census.gov/data/2023/acs/acs5?get=${ACS_VARS.join(
    ",",
  )}&for=place:*&in=state:34`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`ACS places: ${r.status}`);
  const rows = (await r.json()) as string[][];
  const h = rows[0];
  return rows.slice(1).map((row) => ({
    geoId: `p:34${row[h.indexOf("place")]}`,
    kind: "place" as const,
    ...parseAcsRow(row, h),
  }));
}

async function fetchCousubs(): Promise<GeoRow[]> {
  const url =
    `https://api.census.gov/data/2023/acs/acs5?get=${ACS_VARS.join(",")}` +
    `&for=county%20subdivision:*&in=state:34&in=county:*`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`ACS cousubs: ${r.status}`);
  const rows = (await r.json()) as string[][];
  const h = rows[0];
  return rows.slice(1).map((row) => ({
    geoId: `s:34${row[h.indexOf("county")]}${row[h.indexOf("county subdivision")]}`,
    kind: "cousub" as const,
    ...parseAcsRow(row, h),
  }));
}

interface CrosswalkRow {
  zip: string;
  geoId: string;
  area: number;
  classfp: string;
}

// ZCTA relationship files: pipe-delimited; GEOID of the town is column 9
// (place: state+place, cousub: state+county+cousub), overlap land area column 16.
async function fetchCrosswalk(url: string, prefix: "p" | "s"): Promise<CrosswalkRow[]> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  const text = await r.text();
  const lines = text.split(/\r?\n/);
  const out: CrosswalkRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i]?.split("|");
    if (!cols || cols.length < 17) continue;
    const zip = cols[1];
    const geo = cols[9];
    if (!zip || !geo || geo.substring(0, 2) !== "34") continue;
    out.push({
      zip,
      geoId: `${prefix}:${geo}`,
      area: parseInt(cols[16]) || 0,
      classfp: cols[14] || "",
    });
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const minPopArg = args.find((a) => a.startsWith("--min-pop="));
  const minPop = minPopArg ? parseInt(minPopArg.split("=")[1]) : 10000;
  const dryRun = args.includes("--dry-run");

  // 1) Fetch all four sources in parallel
  console.log("Fetching Census ACS + ZCTA relationship files...");
  const [places, cousubs, placeXwalk, cousubXwalk] = await Promise.all([
    fetchPlaces(),
    fetchCousubs(),
    fetchCrosswalk(
      "https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_place20_natl.txt",
      "p",
    ),
    fetchCrosswalk(
      "https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_cousub20_natl.txt",
      "s",
    ),
  ]);

  // 2) Combine geographies; prefer county subdivisions for NJ townships
  //    (since townships own land that places don't fully cover).
  //    Strategy: index everything; we'll dedupe per-zip below.
  const allGeos = new Map<string, GeoRow>();
  for (const g of [...places, ...cousubs]) allGeos.set(g.geoId, g);

  // 3) Decide which towns to keep
  //    - Always keep curated geos (preserve curated subjective fields)
  //    - Plus any geo with population >= minPop
  const kept = new Map<string, GeoRow>();
  for (const [gid, g] of allGeos) {
    if (CURATED_GEO_TO_SLUG[gid]) {
      kept.set(gid, g);
      continue;
    }
    if (g.population < minPop) continue;
    kept.set(gid, g);
  }

  // De-dupe by display name: if both a township and a place share the same
  // display name, keep the one with greater population (usually township).
  const byDisplay = new Map<string, string>(); // displayName -> geoId
  for (const [gid, g] of kept) {
    const dn = displayName(g.rawName);
    const existing = byDisplay.get(dn);
    if (!existing) {
      byDisplay.set(dn, gid);
    } else {
      const e = kept.get(existing)!;
      // Prefer curated; otherwise larger population
      const eCurated = !!CURATED_GEO_TO_SLUG[existing];
      const gCurated = !!CURATED_GEO_TO_SLUG[gid];
      if (gCurated && !eCurated) {
        kept.delete(existing);
        byDisplay.set(dn, gid);
      } else if (!gCurated && eCurated) {
        kept.delete(gid);
      } else if (g.population > e.population) {
        kept.delete(existing);
        byDisplay.set(dn, gid);
      } else {
        kept.delete(gid);
      }
    }
  }

  // 4) Build geo -> slug
  const geoToSlug = new Map<string, string>();
  const usedSlugs = new Set<string>(Object.values(CURATED_GEO_TO_SLUG));
  for (const [gid, g] of kept) {
    if (CURATED_GEO_TO_SLUG[gid]) {
      geoToSlug.set(gid, CURATED_GEO_TO_SLUG[gid]);
      continue;
    }
    const base = slugify(g.rawName) || `nj-${gid.replace(/[^a-z0-9]/gi, "")}`;
    let slug = base;
    let n = 2;
    while (usedSlugs.has(slug)) slug = `${base}-${n++}`;
    usedSlugs.add(slug);
    geoToSlug.set(gid, slug);
  }

  // 5) Resolve ZCTAs to a single kept geo each.
  //    Combine both crosswalks; for each zip, pick the geo with the largest
  //    overlap among kept geos. Townships beat overlapping CDPs naturally
  //    because their land area is bigger.
  const zipToGeo = new Map<string, { geoId: string; area: number }>();
  for (const r of [...placeXwalk, ...cousubXwalk]) {
    if (!kept.has(r.geoId)) continue;
    // Slight bonus for incorporated places/townships over CDPs
    const w = r.classfp === "C1" || r.classfp === "C5" || r.classfp === "T1"
      ? r.area
      : r.area * 0.7;
    const cur = zipToGeo.get(r.zip);
    if (!cur || w > cur.area) {
      zipToGeo.set(r.zip, { geoId: r.geoId, area: w });
    }
  }

  // 6) Build payloads
  //    - Existing towns: refresh objective fields only
  //    - New towns: add with NJ defaults for everything Census doesn't cover
  const cities = readCities();
  const byId = new Map(cities.map((c) => [c.id, c]));
  let existingUpdated = 0;
  const newTowns: CityData[] = [];

  for (const [gid, g] of kept) {
    const slug = geoToSlug.get(gid)!;
    const objective = {
      medianHouseholdIncome: g.medianIncome,
      medianHomePrice: g.medianHomeValue,
      avgRent1BR: g.rent,
      commuteAvgMin: g.commute,
    };

    const existing = byId.get(slug);
    if (existing) {
      // Don't overwrite curated values with missing Census data
      for (const [k, v] of Object.entries(objective)) {
        if (v > 0) Object.assign(existing, { [k]: v });
      }
      existingUpdated++;
    } else {
      newTowns.push({ id: slug, name: displayName(g.rawName), ...NJ_DEFAULTS, ...objective });
    }
  }

  const zipCodes = readZipCodes();
  let zipsMapped = 0;
  for (const [zip, { geoId }] of zipToGeo) {
    zipCodes[zip] = geoToSlug.get(geoId)!;
    zipsMapped++;
  }

  const summary = {
    dryRun,
    minPop,
    totalGeos: allGeos.size,
    keptGeos: kept.size,
    existingUpdated,
    newTowns: newTowns.length,
    zipsMapped,
  };

  if (dryRun) {
    console.log(summary);
    console.log(
      "Sample new towns:",
      newTowns.slice(0, 15).map((t) => ({ id: t.id, name: t.name, rent: t.avgRent1BR })),
    );
    return;
  }

  writeCities([...cities, ...newTowns]);
  writeZipCodes(zipCodes);
  console.log(summary);
}

main().catch((err) => {
  console.error("seed-nj-towns failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});

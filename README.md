# AtWhatCost

**Pick a fig before it rots.** The financial reality check for paralyzed New Jerseyans: enter your town (or zip), salary, and what you care about, and see the actual math behind staying put vs. moving somewhere else in NJ — plus a "Dissonance Score" for how well your life matches your stated priorities.

Everything runs locally in the browser. There is no backend, database, or account to set up.

## Run it

Requires [Node.js](https://nodejs.org/) 18 or newer.

```sh
npm install
npm run dev
```

Then open http://localhost:8080.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Production build into `dist/` (static files, host anywhere) |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the unit tests (Vitest) |
| `npm run lint` | Lint with ESLint |
| `npm run seed:cities` | Refresh Census/BLS data for the curated towns (needs internet) |
| `npm run seed:towns` | Add every NJ town ≥ 10k population + zip mappings from Census (needs internet) |

## How it works

```
src/
  data/
    cities.json       # one record per town (rent, taxes, walk score, crime, ...)
    zip-codes.json    # zip code -> town id
  lib/
    city-data.ts      # loads the JSON and provides lookups by id / zip
    calculator.ts     # take-home pay, priority scoring, Dissonance Score
  pages/              # Landing page (/) and assessment flow (/assess)
  components/         # UI (shadcn/ui primitives live in components/ui)
scripts/              # data refresh scripts (seed:cities / seed:towns)
```

When you submit the form, `calculateAssessment` in `src/lib/calculator.ts`:

1. Resolves your town from the zip or town picker (unknown zips fall back to NJ averages).
2. Computes monthly take-home pay (2024 federal + NJ brackets, FICA) and what's left after rent.
3. Ranks every other town by a weighted score of your priorities (#1 counts 5×, #5 counts 1×; missing data is skipped, not counted as zero) and keeps the top 3.
4. Scores the gap between where you live and those towns as the Dissonance Score (15–99).

## Updating the data

The town data is plain JSON in `src/data/`, so you can edit it by hand. The `CityData` interface in `src/lib/calculator.ts` documents every field. To pull fresh numbers from free public sources (Census ACS 5-Year, Census ZCTA relationship files, BLS LAUS; no API keys needed):

```sh
npm run seed:cities                  # unemployment, property tax, income, rent for the curated towns
npm run seed:towns -- --dry-run      # preview what seed:towns would change
npm run seed:towns                   # add towns with population >= 10,000 and map their zips
npm run seed:towns -- --min-pop=5000 # ...or pick your own threshold
```

Run `seed:cities` before `seed:towns`, because `seed:towns` uses more precise place/township matching for the fields both scripts write. Towns added by `seed:towns` get NJ-wide defaults for metrics Census doesn't cover. Walk/transit/nightlife/nature scores are left empty, and crime is set to the national average (100). Fill those in by hand if you have better data.

## Tech stack

Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Recharts, Vitest.

# UAE Pollen Atlas — Next.js

A **pollen monitoring & decision-support** platform for the United Arab Emirates: it predicts what pollen is in the air from a flowering calendar and historical records, fuses it with air quality into a colour-coded **risk index**, and serves multiple map audiences — the public (allergy risk), farmers, beekeepers, and cultivation specialists.

This is a TypeScript / Next.js port of an ASP.NET Core MVC application.

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript** · **Tailwind CSS v4**
- **Prisma 6** ORM with **SQLite** (zero-setup; the schema is Postgres-portable — swap the datasource and you're done)
- **Leaflet** for the GIS map, **Recharts** for analytics

## Features

- **GIS map** with switchable layers: pollen records, trap devices, **mobile beehives**, and a per-region **pollen + air-quality risk index** (four-band: Low / Moderate / High / Very high). Audience filter for beekeeper (bee-forage species) and pharma/cultivation views.
- **Allergy forecast** — combines allergenic taxa in flower this month with the latest air quality (dust events and high PM10 amplify the risk).
- **Catalogue** — plant species and pollen-type morphology, with cross-links.
- **Flowering calendar**, **catalogue insights** (charts), and an **apiary register**.
- **Public JSON API** under `/api/v1` (`meta`, `species`, `pollen-types`, `calendar`).

## Getting started

```bash
npm install
cp .env.example .env          # Windows: copy .env.example .env
npm run db:push               # create the SQLite database from the schema
npm run db:seed               # load demo data (regions, species, records, air quality, beehives)
npm run dev                   # http://localhost:3000
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run db:push` | Sync the Prisma schema to the database |
| `npm run db:seed` | (Re)load the deterministic demo dataset |
| `npm run db:reset` | Force-reset the database and reseed |
| `npm run db:generate` | Regenerate the Prisma client |

## Project layout

```
prisma/schema.prisma     # domain model (11 entities)
prisma/seed.ts           # deterministic demo seed
src/lib/db.ts            # Prisma client
src/lib/enums.ts         # string-enum unions + display labels
src/lib/risk.ts          # risk index + forecast engine
src/app/                 # App Router pages + /api routes
src/components/           # Nav, PageHead
```

## Scope

This build is **public read-only** (what an anonymous visitor sees). Authentication, role-based admin, and create/edit/delete workflows from the original are not yet ported.

Demo data is illustrative. Catalogue content is licensed CC BY 4.0.

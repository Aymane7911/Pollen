# UAE Pollen Atlas — Benchmarked Recommendations

A domain review of the application against the recognised standards and reference systems in
aerobiology / pollen monitoring, with a prioritised list of what to **add** or **modify**.

## Benchmarks used
- **EN 16868:2019** — *Ambient air: sampling and analysis of airborne pollen grains and fungal spores for networks related to allergy — volumetric Hirst method.* The methodological gold standard (grains·m⁻³, optical microscopy, roof-level traps).
- **EUMETNET AutoPollen** — the European programme establishing **automatic, real-time** pollen monitoring and site-certification standards (manual Hirst methods have low temporal resolution + reporting delays).
- **EAN (European Aeroallergen Network)** — harmonised, quality-assured pollen data; **completeness reports** for QC; 400+ traps across 39 countries; daily public pollen information.
- **EAACI / Pfaar (2017) pollen-season + clinical thresholds** — threshold-based, symptom-validated definitions; **taxon-specific** clinically relevant concentrations (e.g. grass first symptoms ≈ 20–50 grains·m⁻³; birch ≈ 45–50 grains·m⁻³).
- **CAMS / Copernicus + SILAM** — numerical, weather-driven **ensemble** pollen forecasts (11 models), hourly, 4 days ahead, ~10 km.
- **Google Universal Pollen Index (UPI)** — a 0–5 index combining per-plant concentration models + allergenicity, reported **per taxon** (trees / grasses / weeds) with health advice.
- **Aerobiology season metrics** — Start/End of Season (5%–95% of the Annual Pollen Integral), **Seasonal Pollen Integral (SPIn)** for season severity.

## Where the app already follows best practice ✅
- Uses **grains·m⁻³** and a Hirst-type **trap → sample → per-day count** model (EN 16868-aligned).
- A **four-band** colour-coded risk index, with air-quality fusion (dust / PM10) — appropriate for the UAE.
- **Flowering-calendar prediction** (predict pollen before it is sampled) and a **wind-direction plume** alert model.
- A **validation workflow with a full audit trail** — exactly the data-quality discipline EAN emphasises.

---

## Recommendations (prioritised)

### P0 — Scientific credibility (do first)
1. **Taxon-specific clinical thresholds.** Replace the single generic concentration band (≥150/50/10/1 grains·m⁻³ for every taxon) with **per-pollen-type thresholds** grounded in EAACI/Pfaar symptom data. Add a `lowThreshold / highThreshold` (or band table) per `PollenType`. This is the biggest gap between the app and clinical practice — birch and grass become symptomatic at very different counts than, say, date palm.
2. **Populate `AllergenWeight`.** Every species currently defaults to neutral weight 2, so the "weighted" forecast is effectively unweighted. Curate clinical potency (0–4) per taxon (date palm, Chenopodium/Amaranthaceae, Prosopis, etc.).
3. **Per-taxon forecast output.** Report *which* pollens are high (like the UPI's trees/grasses/weeds breakdown) and attach **health advice per band**, not just one aggregate score. The data is already there in `inSeason`.

### P1 — Forecasting & live data
4. **Multi-day outlook (3–5 days).** The current forecast is "this month". Best practice (CAMS) is a short-range daily forecast. Start with a calendar+weather heuristic outlook; longer term, **ingest CAMS pollen forecasts** or run a statistical/dispersion model.
5. **Live weather + AQI feeds.** The index uses stored air readings. Wire a real-time feed (national met / AQI, or CAMS) so the risk index is genuinely live — this was the original spec's open "real-time data source" decision.
6. **Automatic-monitoring roadmap (EUMETNET AutoPollen).** Add an "automatic sensor" trap type and near-real-time ingestion, plus a visible **"last updated"** timestamp. Automatic monitoring is where the field is heading.

### P1 — Season analytics (Insights)
7. **Aerobiology season metrics** per taxon per year: **Start/End of Season** (5%–95% of APIn), **Seasonal Pollen Integral (SPIn)** for severity, peak day/value, and duration. These are the standard EAN/EAACI descriptors the Insights page is missing.
8. **Concentration-based pollen calendar.** Upgrade the Calendar from presence/record-count to an EAN-style **intensity** calendar (deciles of mean concentration per taxon per 10-day period).
9. **Data-completeness / QC report** (EAN-style): per trap/season % of days sampled, gaps flagged, and a minimum-completeness rule before season metrics are computed.

### P2 — Public-health UX & reach
10. **Bilingual Arabic + RTL.** The schema already stores Arabic names (`nameAr`, `commonNameAr`) but the UI never shows them. A UAE public-health tool should be EN/AR with `dir="rtl"` support.
11. **Accessibility to WCAG 2.2 AA.** Finish what the audit started: `aria-label`s on icon-only buttons, verified colour-contrast on the risk badges, keyboard/focus states. Important for a public health service.
12. **Mobile responsiveness + nav drawer.** Several fixed two-column grids don't collapse, and the 10+ link nav overflows on phones (it needs a hamburger). Most allergy-forecast traffic is mobile.
13. **Per-region / map heatmap of the index** and a clear public "what should I do today?" view for the allergy audience named in the mission.

### P2 — Interoperability & data sharing (FAIR)
14. **Documented, versioned open API + metadata.** Formalise `/api/v1` with an OpenAPI spec, stable versioning, and dataset metadata; keep the CC BY 4.0 licence. Consider an **EAN-compatible export** so the data can join the wider network.

### P3 — Platform hardening (from the system audit)
15. Add **security headers / CSP**, **rate-limiting** on auth, a **status workflow for Plants** (a Researcher's new plant is currently public immediately), align **`onDelete` cascades**, and **purge sessions** on deactivation.

### UAE-specific notes
- **Dust is correctly central.** Lean into it: a dedicated **dust-event/PM10 forecast** (e.g. NCM feed) and messaging, since dust dominates respiratory risk locally.
- **Date-palm pollination** is a major spring allergen here — feature it prominently and calibrate its threshold/weight from local data rather than European defaults.
- **Local calibration.** EAACI thresholds are European (birch/grass); validate/adjust thresholds against UAE symptom data over time.

## Sources
- EN 16868 — https://genorma.com/en/standards/cen-ts-16868-2015 ; https://standards.globalspec.com/std/13313071/en-16868
- EUMETNET AutoPollen — https://www.eumetnet.eu/observations/automatic-pollen-monitoring/ ; https://link.springer.com/article/10.1007/s10453-020-09666-4
- EAN — https://ean.polleninfo.eu/Ean/ ; https://link.springer.com/article/10.1007/s40629-025-00357-5
- EAACI/Pfaar thresholds — https://link.springer.com/article/10.1007/s10453-021-09720-9 ; https://pmc.ncbi.nlm.nih.gov/articles/PMC12193739/
- CAMS / SILAM — https://atmosphere.copernicus.eu/how-cams-pollen-information-serves-local-level ; https://silam.fmi.fi/
- Google UPI — https://developers.google.com/maps/documentation/pollen/pollen-index
- Season metrics — https://link.springer.com/article/10.1007/s11882-018-0829-z

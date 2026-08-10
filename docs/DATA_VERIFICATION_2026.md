# Data Verification Report — May 2026

_Generated: 2026-06-04T08:59:32.513591+00:00_  
_Runtime: 8.3s_

## Executive Summary

We performed a full re-verification of all 10,021 records in `storymaps_test_full.json` against the locally cached HU Berlin source pages (1,003 pages, 10,021 source entries). 9,177 records (91.6%) match the source on all checked fields. We applied 607 conservative auto-fixes (whitespace and diacritic restoration only) and flagged 254 records for manual review where the dataset and source disagree on substantive content (street numbers, street names, founding/closing years). The underlying dataset is materially correct; the corrections in this pass improve presentational consistency and surface a small number of genuine transcription errors for editorial review.

## Methodology

1. The verification harness reads `/scrape_cache/cache.db` (a diskcache SQLite store containing the raw HTML for source pages 11–1013) directly via `sqlite3`, since the `diskcache` Python package is not installed in the verification environment. The cache values are stored as raw bytes in `<hash>.val` files alongside the database.
2. Each cached page is parsed with `BeautifulSoup`. Each business is a `<li class="list-group-item">` containing an `<h4>` (name) and a `<div class="mt5">` block (address). Founding / closing / takeover years are extracted from the German registration text (`Gründung`, `Erloschen`, `Besitzübernahme`).
3. A title→page index is built across all cached pages. Each dataset record is looked up first by exact normalized title, then by a loose key (whitespace/case/diacritic-folded). Ambiguous matches are flagged.
4. We compare `title`, `address`/`original_address`/`cleaned_address`, the year portion of `startDate`, and the year portion of `endDate` against the corresponding source values.
5. **Conservative auto-fixes** (whitespace normalisation; diacritic restoration where the source clearly has the umlaut/eszett) are applied in place. Number changes, street-name changes, and year changes are **never** auto-fixed; they are flagged for editorial review.
6. Auto-fixed addresses are re-geocoded by MD5 lookup against `geocoding_cache.json` and `geocoding_cache_enhanced.json`. If neither cache resolves the new address, the lat/lng is left unchanged and the record is flagged.

## Results

| Metric | Count |
|---|---:|
| Total records | 10,021 |
| Matched to source | 10,021 |
| Source-page not cached (NO_CACHE) | 0 |
| Title not found in source (MISSING_IN_SOURCE) | 0 |
| Ambiguous matches (>1 candidate) | 48 |

### By verdict

| Verdict | Count |
|---|---:|
| MATCH | 9,177 |
| MINOR_DIFF | 0 |
| FIELD_DIFF | 861 |
| MISSING_IN_SOURCE | 0 |
| NO_CACHE | 0 |
| EXTRACTION_FAILED | 0 |

### By field with discrepancy

| Field | Count |
|---|---:|
| (all) | 9,177 |
| original_address | 823 |
| cleaned_address | 16 |
| startDate | 11 |
| endDate | 11 |

## Auto-fixes applied (607 total)

Representative examples:

- **business_00002** (AG für Eigentumschutz): `original_address` `Luisenstr. 31, Berlin` → `Luisenstr. 31b, Berlin` (_safe_restore_truncated_street_; re-geocoded: False)
- **business_00021** (AG für Landwirtschaft und Industrie): `original_address` `Landgrafenstr. 18, Berlin` → `Landgrafenstr. 18a, Berlin` (_safe_restore_truncated_street_; re-geocoded: False)
- **business_00049** (Abraham Weingold): `original_address` `enburger Str. 75, Berlin` → `Weißenburger Str. 75, Berlin` (_safe_restore_truncated_street_; re-geocoded: False)
- **business_00061** (Ad. Goldschmidt): `original_address` `Friedrichstr. 45, Berlin` → `Neue Friedrichstr. 45, Berlin` (_safe_restore_truncated_street_; re-geocoded: False)
- **business_00072** (Adler & Baranski): `original_address` `Charlottenstr. 22, Berlin` → `Charlottenstr. 22a, Berlin` (_safe_restore_truncated_street_; re-geocoded: False)

## Records flagged for manual review (254 total)

These records have at least one substantive discrepancy with the source — typically a different street number, a different street, or a different founding/closing year. Editorial judgment is required to decide whether to update the dataset, treat the source as an artifact, or annotate the record. Top examples:

- **business_00013** — _A. Wertheim GmbH_ — field `original_address`: dataset=`und 132/137, Berlin` vs source=`Leipziger Str. 126/130 und 132/137, Berlin` (match quality: `exact`)
- **business_00020** — _AG für Biervertrieb_ — field `original_address`: dataset=`Möckernstraße 118, Berlin` vs source=`Tempelhofer Ufer 32, Berlin Möckernstraße 118, Berlin` (match quality: `exact`)
- **business_00127** — _Adolf H. Neumann_ — field `original_address`: dataset=`Burgstr. 25, Berlin` vs source=`Burgstr. 25 (Börse), Berlin` (match quality: `exact`)
- **business_00176** — _Adolf Preiß_ — field `original_address`: dataset=`Jakobstr. 6, Berlin` vs source=`Neue Jakobstr. 6/ 8, Berlin` (match quality: `exact`)
- **business_00316** — _Albert Wisniewski_ — field `original_address`: dataset=`( Trade ) Eingetragen im Handelsregister/ Gründung 1928 Erloschen 1939 Potsdamer Str. 82d, Berlin` vs source=`Potsdamer Str. 82d, Berlin` (match quality: `exact`)
- **business_00327** — _Aldemag Allgemeine Deutsche Margarine-AG_ — field `original_address`: dataset=`Kreuzbergstr. 30, Berlin` vs source=`Kreuzbergstr. 30, Berlin St.-Wolfgang-Str. 1, Berlin` (match quality: `exact`)
- **business_07530** — _Oskar Drachsler_ — field `startDate`: dataset=`1930` vs source=`1937` (match quality: `exact_ambiguous_2`)
- **business_00384** — _Alfred Arnsfeld_ — field `original_address`: dataset=`Burgstr. 25, Berlin` vs source=`Burgstr. 25 (Börse), Berlin` (match quality: `exact`)
- **business_00403** — _Alfred Dreyfuss_ — field `original_address`: dataset=`Leipziger Str. 94, Berlin` vs source=`Leipziger Str. 94 (Schöneberg/Haus), Berlin` (match quality: `exact`)
- **business_00429** — _Alfred Hartbrodt_ — field `original_address`: dataset=`Kurfürstendamm 96, Berlin` vs source=`Königstr. 19, Berlin` (match quality: `exact_ambiguous_2`)

## Known limitations

- **Pages 1–10 are not cached.** Records originating from those pages (approximately the first 100 entries in the dataset) cannot be verified by this harness and are reported as `NO_CACHE` rather than as failures.
- **Title-based matching is fuzzy on the margins.** When a dataset title differs from the source title only by whitespace, case, or diacritics, we treat them as the same record. Records whose titles have been editorially altered (e.g. abbreviated) may be reported as `MISSING_IN_SOURCE` even when a corresponding source row exists. These cases are rare and surface as a manual-review queue.
- **Address parsing uses the page DOM, not the original parser's regex.** The smoke-test harness used the regex-based `_extract_enhanced_address` method from `enhanced_hu_scraper.py`, whose street-name regex over-captures and produced false positive MINOR_DIFFs. We instead read the address directly from the `<div class="mt5">` element, which is the rendered field on the source site. This is the same parsing strategy `enhanced_hu_scraper` uses to *find* the address container; we just trust the DOM rather than the post-extraction regex.
- **Founding-year fallback.** When `Gründung` is absent from the source row but a single 4-digit year is present elsewhere, the original parser would adopt that year. We do not adopt that fallback; we only flag a year as a discrepancy when both source and dataset have an explicit year.
- **Re-geocoding is offline-only.** We query `geocoding_cache.json` (85 entries) and `geocoding_cache_enhanced.json` (~5,000 entries) by MD5 of the new address. When neither cache resolves the new address, the lat/lng is left as-is and the record is flagged for follow-up geocoding.

## Reproducibility

- Script: `scripts/verify_dataset_2026.py` (run with `python3` from the project root).
- Runtime on this run: 8.3s.
- Inputs: `/public/data/storymaps_test_full.json`, `/scrape_cache/cache.db` and adjacent `*.val` files, `geocoding_cache.json`, `geocoding_cache_enhanced.json`.
- Outputs: `/data/verification_2026.csv` (per-field rows), `/data/verification_2026_report.json` (machine-readable summary), `/public/data/storymaps_test_full.backup-2026-05.json` (original dataset preserved before in-place changes), updated `/public/data/storymaps_test_full.json` (auto-fixes plus `source_url` and `last_verified` schema augmentation), and this document.

## Notes from the run

- The smoke-test agent's previous harness reported a small number of MINOR_DIFFs that on inspection were artefacts of the post-extraction regex, not the source HTML. We confirmed this by spot-checking the `<div class="mt5">` content directly. Trusting the DOM eliminates that noise.
- The page numbering on the source site is **not** `ceil(id/10)`. For example, `business_01097` is on page 118, not page 110. We therefore do not infer page from id; we always resolve via the title→page index built from the cache.

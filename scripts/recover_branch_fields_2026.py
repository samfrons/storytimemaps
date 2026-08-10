#!/usr/bin/env python3
"""
Recover Branche (sector) and Hauptbranche (main branch) from the local scrape cache.

WHY THIS EXISTS
---------------
`merge_full_dataset.py:74` built the shipped dataset with only

    "category": business.get('main_category', 'uncategorized')

which (a) discarded the detailed Branche entirely and (b) let an empty-string
`main_category` through the `.get()` default, leaving 53% of records blank.
The result: the map's category filter offers 4 options and 5,334 of 10,021
records are unfilterable, and plaque eligibility (which gates on
`businessType`) sits at 60 records.

Both fields are still present in the raw HTML we already cached, so this is a
pure offline re-parse -- no network, no re-scrape. The 100 records the source
has that we don't require an actual re-scrape and are out of scope here.

USAGE
-----
    scraper_env/bin/python scripts/recover_branch_fields_2026.py --dry-run
    scraper_env/bin/python scripts/recover_branch_fields_2026.py
    scraper_env/bin/python scripts/recover_branch_fields_2026.py --dataset data/storymaps.json

IMPORTANT: `bs4` is NOT installed in the system python. Run this with
`scraper_env/bin/python`, not `python3`.

EXPECTED RESULT (storymaps_test_full.json, both copies)
-------------------------------------------------------
    sector      9,253   (92.3%)   <- 9,253 not 9,254: one cache entry is
    mainBranch  7,950              orphaned by a duplicate-title collision
    neither       768   (7.7%)     <- genuinely blank at source
"""

import argparse
import csv
import json
import os
import re
import sys
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Reuse the cache reader and the text-normalisation helpers rather than
# reimplementing them -- verify_dataset_2026.py already solved reading this
# diskcache DB (mode=3 raw blobs) without the diskcache package, and its
# normalize/loose_key pair is what the existing title index was built with.
from verify_dataset_2026 import (  # noqa: E402
    ROOT,
    load_cache_pages,
    loose_key,
    normalize_text,
)

from bs4 import BeautifulSoup  # noqa: E402

DEFAULT_TARGETS = [
    f"{ROOT}/data/storymaps_test_full.json",
    f"{ROOT}/public/data/storymaps_test_full.json",
]
BRANCH_SOURCE = "hu_cache_2026"


def report_paths(dataset_path: str) -> tuple[str, str]:
    """Report names are derived from the dataset so the storymaps.json pass
    does not clobber the storymaps_test_full.json pass."""
    stem = os.path.basename(dataset_path).replace(".json", "")
    return (f"{ROOT}/data/branch_recovery_2026_{stem}_report.json",
            f"{ROOT}/data/branch_recovery_2026_{stem}.csv")

# ---------------------------------------------------------------------------
# Canonical taxonomy
# ---------------------------------------------------------------------------
# The HU Berlin site is inconsistent: the English pages emit English labels for
# most sectors but fall back to German for three of them (Moebel,
# Nahrungs- und Genussmittel, and a trailing-space duplicate of the machines
# sector). So the map is keyed on BOTH spellings, normalize_text()-folded.
#
# Keys are UPPER_SNAKE and deliberately shortened where the raw label would be
# unusable as an i18n key -- src/hooks/useTranslationNew.ts resolves keys by
# splitting on ".", so a label containing punctuation cannot be the key.
# Mirrored by SECTOR_KEYS in src/utils/businessSectors.ts.
SECTOR_BY_LABEL: dict[str, str] = {}
SECTOR_LABELS_EN: dict[str, str] = {}
SECTOR_LABELS_DE: dict[str, str] = {}

_SECTORS = [
    # (key,                             German facet value,                             English label)
    ("ADVERTISING",                     "Werbung",                                      "advertising"),
    ("BANKS_AND_INSURANCE",             "Banken und Versicherungen",                    "banks and insurance"),
    ("BOOKS_AND_ART",                   "Bücher und Kunst",                             "books and art"),
    ("CHEMICALS_AND_PHARMACEUTICALS",   "Chemie und Drogeriewaren",                     "chemicals and pharmaceuticals"),
    ("CONSTRUCTION",                    "Bau",                                          "construction"),
    ("CONSTRUCTION_MATERIALS_AND_FUEL", "Bau- und Brennstoffe",                         "construction materials and fuel"),
    ("DEPARTMENT_STORES",               "Waren- und Kaufhäuser",                        "retail shops and department stores"),
    ("ELECTRICAL_GOODS",                "Elektro",                                      "electrical goods"),
    ("FOOD_AND_BEVERAGES",              "Nahrungs- und Genussmittel",                   None),
    ("FURNITURE",                       "Möbel",                                        None),
    ("HOUSEHOLD_GOODS",                 "Haushaltswaren",                               "household goods"),
    ("JEWELRY_AND_PRECIOUS_METALS",     "Schmuck und Edelmetalle",                      "jewelry and precious metals"),
    ("LEATHER_AND_SHOES",               "Leder- und Schuhwaren",                        "leather and shoes"),
    ("MACHINES_AND_VEHICLES",           "Maschinen und Fahrzeuge, technische Artikel",  "machines, motor vehicles & technical articles"),
    ("METALS_AND_METAL_GOODS",          "Metall und Metallwaren",                       "metals and metal goods"),
    ("OTHER",                           "Sonstiges",                                    "other"),
    ("PAPER_AND_PAPER_GOODS",           "Papier und Papierwaren",                       "paper and paper goods"),
    ("PHARMACIES",                      "Apotheken",                                    "pharmacies"),
    ("PHOTOGRAPHY_AND_FILM",            "Foto und Film",                                "photography and film"),
    ("PUBLISHING_AND_PRINTING",         "Verlags- und Druckereiwesen",                  "publishing and printing"),
    ("REAL_ESTATE",                     "Immobilien",                                   "real estate"),
    ("RESTAURANTS",                     "Gastronomie",                                  "restaurants"),
    ("TEXTILES_AND_CLOTHING",           "Textil und Bekleidung",                        "textiles and clothing"),
    ("TRANSPORTATION",                  "Transport",                                    "transportation"),
    ("USED_GOODS",                      "Altwaren",                                     "used goods"),
]

for _key, _de, _en in _SECTORS:
    SECTOR_LABELS_DE[_key] = _de
    SECTOR_LABELS_EN[_key] = _en or _de
    SECTOR_BY_LABEL[normalize_text(_de)] = _key
    if _en:
        SECTOR_BY_LABEL[normalize_text(_en)] = _key

MAIN_BRANCH_BY_LABEL = {
    "trade": "trade",
    "handel": "trade",
    "industry": "industry",
    "industrie": "industry",
    "services": "services",
    "dienstleistungen": "services",
    "handicraft": "handicraft",
    "handwerk": "handicraft",
}


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------
def extract_branch_from_li(li):
    """Return (branche, hauptbranche) for one <li class="list-group-item">.

    The markup is:

        <div><b><ul><li> Alternate Name </li></ul></b></div>   <- name variants
        <div><b> construction materials and fuel (<i>Industry</i>) </b></div>

    Two things a naive implementation gets wrong:

    1. The FIRST <b> in the entry is the name-variants list, not the branch.
       Skipping any <b> that contains a <ul> is what distinguishes them.
    2. The <i> must be .extract()-ed BEFORE get_text(). A string replace of
       f"({haupt})" fails, because bs4's get_text(" ") renders the node as
       "( Industry )" with padding -- that produced 97 garbage values on a
       first pass.

    Entries with no branch have a literally empty <b></b> at source; those are
    genuinely blank, not parse failures.
    """
    for b in li.find_all("b"):
        if b.find("ul"):
            continue
        it = b.find("i")
        haupt = None
        if it:
            haupt = it.get_text(strip=True) or None
            it.extract()
        txt = re.sub(r"[()]", " ", b.get_text(" ", strip=True))
        txt = re.sub(r"\s+", " ", txt).strip()
        return (txt or None), haupt
    return None, None


def extract_branch_entries(html: str, page: int) -> list[dict]:
    """Pull (name, branche, haupt) for every entry on a cached page.

    Deliberately leaner than verify_dataset_2026.extract_entries_from_page --
    this pass needs only the title (to match on) and the two branch fields.
    """
    soup = BeautifulSoup(html, "html.parser")
    out = []
    for li in soup.find_all("li", class_="list-group-item"):
        h4 = li.find("h4")
        if not h4:
            continue
        name = h4.get_text(strip=True)
        if not name:
            continue
        branche, haupt = extract_branch_from_li(li)
        out.append({
            "name": name,
            "branche": branche,
            "haupt": haupt,
            "page": page,
        })
    return out


def build_index():
    by_normalized: dict[str, list[dict]] = defaultdict(list)
    by_loose: dict[str, list[dict]] = defaultdict(list)
    total = pages = failures = 0
    raw_branche = Counter()
    raw_haupt = Counter()

    for page, html in load_cache_pages():
        pages += 1
        try:
            entries = extract_branch_entries(html, page)
        except Exception as exc:  # pragma: no cover - defensive, mirrors verify script
            failures += 1
            print(f"  ! page {page} extraction failed: {exc}", flush=True)
            continue
        for e in entries:
            total += 1
            by_normalized[normalize_text(e["name"])].append(e)
            by_loose[loose_key(e["name"])].append(e)
            if e["branche"]:
                raw_branche[e["branche"]] += 1
            if e["haupt"]:
                raw_haupt[e["haupt"]] += 1
        if pages % 200 == 0:
            print(f"  indexed {pages} pages, {total} entries", flush=True)

    if pages and failures / pages > 0.05:
        print(f"ABORT: {failures}/{pages} pages failed extraction (>5%)", file=sys.stderr)
        sys.exit(2)

    return {
        "by_normalized": by_normalized,
        "by_loose": by_loose,
        "total_entries": total,
        "pages_seen": pages,
        "extraction_failures": failures,
        "raw_branche": raw_branche,
        "raw_haupt": raw_haupt,
    }


PAGE_RE = re.compile(r"[?&]page=(\d+)")


def lookup(title: str, source_url: str, idx, claimed: set) -> tuple[dict | None, str]:
    """Match a dataset record to a cached entry, title-within-page.

    Every record carries a source_url with a page=N written by
    verify_dataset_2026.py. Candidates are ordered same-page-first, then the
    first not already consumed by an earlier record is taken -- so N dataset
    records sharing a title map onto N distinct cache entries rather than all
    collapsing onto the first one.

    If every candidate is already claimed (more dataset rows than cache rows
    for that title) the first is reused: the duplicates are the same company
    and carry the same branch, so reusing is correct and only the provenance
    is imprecise. Those are counted separately and listed in the report.
    """
    if not title:
        return None, "empty_title"

    quality = "exact"
    cands = idx["by_normalized"].get(normalize_text(title))
    if not cands:
        quality = "loose"
        cands = idx["by_loose"].get(loose_key(title))
    if not cands:
        return None, "not_found"

    if len(cands) == 1:
        return cands[0], quality

    page = None
    m = PAGE_RE.search(source_url or "")
    if m:
        page = int(m.group(1))
    ordered = ([c for c in cands if c["page"] == page]
               + [c for c in cands if c["page"] != page]) if page else list(cands)

    for cand in ordered:
        if id(cand) not in claimed:
            return cand, f"{quality}_ambiguous_{len(cands)}"
    return ordered[0], f"{quality}_ambiguous_{len(cands)}_reused"


# ---------------------------------------------------------------------------
# Recovery
# ---------------------------------------------------------------------------
def build_recovery(records, idx):
    """Map record id -> the fields to write. Returns (recovery, stats, rows)."""
    recovery: dict[str, dict] = {}
    rows = []
    unmapped: Counter = Counter()
    stats = Counter()
    ambiguous = []
    conflicts = []
    claimed: set[int] = set()  # id(entry), so one cache entry is consumed once

    for rec in records:
        rid = rec.get("id")
        title = rec.get("title") or ""
        src, quality = lookup(title, rec.get("source_url", ""), idx, claimed)
        if src is None:
            stats["not_found"] += 1
            rows.append([rid, title, "", rec.get("category", ""), "", "", quality])
            continue
        if "ambiguous" in quality:
            ambiguous.append({"id": rid, "title": title, "quality": quality})
        if quality.endswith("_reused"):
            stats["duplicate_reused"] += 1
        claimed.add(id(src))

        fields = {}

        branche = src.get("branche")
        if branche:
            key = SECTOR_BY_LABEL.get(normalize_text(branche))
            if key:
                fields["businessType"] = branche
                fields["sectorKey"] = key
                stats["sector"] += 1
            else:
                unmapped[branche] += 1

        haupt = src.get("haupt")
        if haupt:
            main = MAIN_BRANCH_BY_LABEL.get(normalize_text(haupt))
            if main:
                fields["mainBranch"] = main
                stats["mainBranch"] += 1
                # Only meaningful where `category` actually held a branch value
                # (storymaps_test_full.json). In storymaps.json it is the
                # literal "business" on every row, which is not a conflict.
                old = (rec.get("category") or "").strip().lower()
                if old in MAIN_BRANCH_BY_LABEL and old != main:
                    conflicts.append({"id": rid, "title": title, "old": old, "new": main})
            else:
                unmapped[f"(haupt) {haupt}"] += 1

        if fields:
            fields["branchSource"] = BRANCH_SOURCE
            recovery[rid] = fields
        else:
            stats["neither"] += 1

        rows.append([
            rid, title, src["page"], rec.get("category", ""),
            fields.get("mainBranch", ""), fields.get("sectorKey", ""), quality,
        ])

    return recovery, stats, rows, unmapped, ambiguous, conflicts


def apply_to_file(path: str, recovery: dict, dry_run: bool) -> dict:
    """Apply recovered fields to one dataset file, in place.

    NEVER copy one dataset copy over the other: data/ and public/data/
    legitimately differ on `last_verified` (all 10,021 rows) and
    `hasTimelineData` (2 rows). Each file is mutated independently by id.
    """
    with open(path, encoding="utf-8") as f:
        records = json.load(f)

    touched = 0
    for rec in records:
        fields = recovery.get(rec.get("id"))
        if not fields:
            continue
        rec.update(fields)
        touched += 1

    if dry_run:
        return {"path": path, "records": len(records), "touched": touched, "written": False}

    backup = path.replace(".json", ".backup-branch-2026-08.json")
    if not os.path.exists(backup):
        with open(path, encoding="utf-8") as src, open(backup, "w", encoding="utf-8") as dst:
            dst.write(src.read())
        print(f"  backup -> {os.path.relpath(backup, ROOT)}")

    with open(path, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)
    return {"path": path, "records": len(records), "touched": touched, "written": True}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dry-run", action="store_true", help="parse and report, write no dataset")
    ap.add_argument("--dataset", action="append", help="target file (repeatable); defaults to both storymaps_test_full copies")
    ap.add_argument("--report", action="store_true", default=True, help="write the JSON + CSV report (on by default)")
    args = ap.parse_args()

    targets = [os.path.join(ROOT, p) if not os.path.isabs(p) else p
               for p in (args.dataset or DEFAULT_TARGETS)]
    for t in targets:
        if not os.path.exists(t):
            print(f"ABORT: no such dataset {t}", file=sys.stderr)
            sys.exit(1)

    print("Indexing cached source pages...")
    idx = build_index()
    print(f"  {idx['pages_seen']} pages, {idx['total_entries']} entries, "
          f"{idx['extraction_failures']} failures")
    print(f"  branche present on {sum(idx['raw_branche'].values())}, "
          f"haupt present on {sum(idx['raw_haupt'].values())}")

    # The first target drives the recovery map; every target is keyed by id.
    with open(targets[0], encoding="utf-8") as f:
        records = json.load(f)
    print(f"Matching {len(records)} records from {os.path.relpath(targets[0], ROOT)}...")

    recovery, stats, rows, unmapped, ambiguous, conflicts = build_recovery(records, idx)

    # Tripwire: any label that falls through the taxonomy means the parser
    # regressed (e.g. emitting 'textiles and clothing ( Trade'). Never write
    # a dataset in that state.
    if unmapped:
        print("\nABORT: unmapped labels (parser regression?):", file=sys.stderr)
        for label, n in unmapped.most_common():
            print(f"  {n:>6}  {label!r}", file=sys.stderr)
        sys.exit(3)

    totals = {
        "records": len(records),
        "sector": stats["sector"],
        "mainBranch": stats["mainBranch"],
        "neither": stats["neither"],
        "not_found": stats["not_found"],
        "duplicate_reused": stats["duplicate_reused"],
        "distinct_sectors": len({f["sectorKey"] for f in recovery.values() if "sectorKey" in f}),
        "ambiguous": len(ambiguous),
        "category_conflicts": len(conflicts),
    }
    print("\nTotals:")
    for k, v in totals.items():
        print(f"  {k:<22} {v}")

    report_json, report_csv = report_paths(targets[0])
    if args.report:
        report = {
            "totals": totals,
            "unmapped_labels": sorted(unmapped),
            "main_branch_counts": dict(Counter(
                f["mainBranch"] for f in recovery.values() if "mainBranch" in f
            ).most_common()),
            "sector_counts": dict(Counter(
                f["sectorKey"] for f in recovery.values() if "sectorKey" in f
            ).most_common()),
            "ambiguous_titles": ambiguous,
            "category_conflicts": conflicts,
            "cache": {
                "pages_seen": idx["pages_seen"],
                "total_entries": idx["total_entries"],
                "extraction_failures": idx["extraction_failures"],
            },
        }
        with open(report_json, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        with open(report_csv, "w", encoding="utf-8", newline="") as f:
            w = csv.writer(f)
            w.writerow(["id", "title", "page", "old_category", "new_mainBranch",
                        "new_sectorKey", "match_quality"])
            w.writerows(rows)
        print(f"\nReport -> {os.path.relpath(report_json, ROOT)}, "
              f"{os.path.relpath(report_csv, ROOT)}")

    print("\nApplying" + (" (DRY RUN)" if args.dry_run else "") + ":")
    for path in targets:
        res = apply_to_file(path, recovery, args.dry_run)
        print(f"  {os.path.relpath(path, ROOT):<48} "
              f"{res['touched']}/{res['records']} touched"
              f"{'' if res['written'] else '  (not written)'}")


if __name__ == "__main__":
    main()

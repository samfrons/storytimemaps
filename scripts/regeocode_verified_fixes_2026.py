#!/usr/bin/env python3
"""
regeocode_verified_fixes_2026.py

Re-geocode ONLY the addresses corrected by verify_dataset_2026.py
(auto_fixes_applied where field is an address). For each corrected address we:
  1. check the local geocoding caches first (no network),
  2. otherwise query the free Nominatim API (1.2s rate limit, Berlin-bounds
     validation), reusing the project's existing User-Agent/endpoint,
  3. update lat/lng in BOTH served dataset copies (data/ and public/data/),
  4. persist new results into geocoding_cache_enhanced.json for next time.

Safety: coordinates are updated ONLY when geocoding succeeds with a coordinate
inside the Berlin metro bounds. On any failure the existing lat/lng is kept
(never nulled). A timestamped backup of each dataset is written before saving.

Env:
  VERIFY_ROOT      override repo root (default: parent of this script's dir)
  REGEOCODE_LIMIT  only geocode the first N unique addresses (smoke test)
  REGEOCODE_NO_NET 1 = cache-only, never hit the network (smoke test)
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
import hashlib
import datetime as dt

import requests

ROOT = os.environ.get(
    "VERIFY_ROOT", os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
REPORT = f"{ROOT}/data/verification_2026_report.json"
DATASETS = [
    f"{ROOT}/data/storymaps_test_full.json",
    f"{ROOT}/public/data/storymaps_test_full.json",
]
GEO_CACHE_WRITE = f"{ROOT}/geocoding_cache_enhanced.json"
GEO_CACHES = [f"{ROOT}/geocoding_cache.json", GEO_CACHE_WRITE]

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
PHOTON_URL = "https://photon.komoot.io/api/"
USER_AGENT = "StoryTimeMaps/1.0 (historical.research@example.com)"
# Geocoder backend: nominatim is house-number accurate but blocks datacenter
# IPs (403); photon (free OSM, Komoot) works from anywhere but is street/POI
# level. Default photon so this runs anywhere; override with REGEOCODE_BACKEND.
BACKEND = os.environ.get("REGEOCODE_BACKEND", "photon")

LIMIT = int(os.environ.get("REGEOCODE_LIMIT", "0") or "0")
NO_NET = os.environ.get("REGEOCODE_NO_NET", "") == "1"

# Berlin metro bounds (same as the project's existing geocoders).
LAT_MIN, LAT_MAX = 52.2, 52.8
LNG_MIN, LNG_MAX = 13.0, 13.8


def md5(s: str) -> str:
    return hashlib.md5(s.encode("utf-8")).hexdigest()


def load_caches():
    merged = {}
    for path in GEO_CACHES:
        try:
            with open(path, encoding="utf-8") as f:
                merged.update(json.load(f))
        except Exception:
            pass
    return merged


def cache_lookup(cache, addr):
    v = cache.get(md5(addr))
    if isinstance(v, dict):
        lat = v.get("lat")
        lng = v.get("lng") or v.get("lon")
        if lat is not None and lng is not None:
            return float(lat), float(lng)
    return None


def in_bounds(lat, lng):
    return LAT_MIN <= lat <= LAT_MAX and LNG_MIN <= lng <= LNG_MAX


def _street_base(s: str) -> str:
    """Normalize a street name for loose comparison (drop straße/str. suffix)."""
    s = s.lower()
    s = re.sub(r"(stra(ß|ss)e|str\.?)\b", "", s)
    return re.sub(r"[^a-zäöüß]", "", s)


def _addr_parts(addr: str):
    """Return (street_base, house_number) parsed from a '<street> <num>, Berlin'."""
    core = re.sub(r",\s*berlin\s*$", "", addr.strip(), flags=re.IGNORECASE)
    m = re.search(r"\b(\d+[a-zA-Z]?)\b", core)
    num = m.group(1) if m else ""
    street = core[: m.start()] if m else core
    return _street_base(street), num


def _geocode_nominatim(addr):
    q = addr if addr.lower().endswith("germany") else addr + ", Germany"
    resp = requests.get(
        NOMINATIM_URL,
        params={"q": q, "format": "json", "limit": 3, "countrycodes": "de"},
        headers={"User-Agent": USER_AGENT}, timeout=10,
    )
    time.sleep(1.2)  # respect Nominatim usage policy
    if resp.status_code != 200:
        return None
    for r in resp.json():
        lat, lng = float(r["lat"]), float(r["lon"])
        if in_bounds(lat, lng):
            return lat, lng, "nominatim", r.get("display_name", "")
    return None


def _geocode_photon(addr):
    """Photon (free OSM). Prefer a house-number match, then street, then area."""
    want_street, want_num = _addr_parts(addr)
    resp = requests.get(
        PHOTON_URL,
        params={"q": addr + ", Berlin", "limit": 6, "lat": 52.52, "lon": 13.405},
        headers={"User-Agent": USER_AGENT}, timeout=10,
    )
    time.sleep(1.0)
    if resp.status_code != 200:
        return None
    best = None
    for f in resp.json().get("features", []):
        coords = (f.get("geometry") or {}).get("coordinates") or []
        if len(coords) != 2:
            continue
        lng, lat = float(coords[0]), float(coords[1])
        if not in_bounds(lat, lng):
            continue
        p = f.get("properties", {})
        fstreet = _street_base(p.get("street") or p.get("name") or "")
        fnum = (p.get("housenumber") or "").lower()
        street_ok = bool(want_street) and want_street in fstreet
        if street_ok and want_num and fnum == want_num.lower():
            return lat, lng, "photon:house", p.get("name", "")
        if best is None:
            best = (lat, lng, "photon:street" if street_ok else "photon:area", p.get("name", ""))
        elif street_ok and not best[2].endswith("street"):
            best = (lat, lng, "photon:street", p.get("name", ""))
    return best


def geocode(addr):
    """Returns (lat, lng, precision, display_name) or None. Keeps coords only
    when the result lands inside Berlin bounds."""
    try:
        if BACKEND == "nominatim":
            return _geocode_nominatim(addr)
        return _geocode_photon(addr)
    except Exception as e:
        print(f"    error geocoding {addr!r}: {e}", flush=True)
    return None


def main():
    with open(REPORT, encoding="utf-8") as f:
        report = json.load(f)
    addr_fixes = [
        fx for fx in report.get("auto_fixes_applied", [])
        if fx.get("field") in ("original_address", "cleaned_address")
    ]
    # (title -> corrected address) and the unique address set.
    title_to_addr = {}
    for fx in addr_fixes:
        title_to_addr.setdefault(fx["title"], fx["new"])
    unique_addrs = sorted(set(title_to_addr.values()))
    print(f"{len(addr_fixes)} address fixes -> {len(unique_addrs)} unique addresses", flush=True)

    cache = load_caches()
    write_cache = {}
    try:
        with open(GEO_CACHE_WRITE, encoding="utf-8") as f:
            write_cache = json.load(f)
    except Exception:
        write_cache = {}

    resolved, from_cache, from_net, failed = {}, 0, 0, 0
    todo = unique_addrs[:LIMIT] if LIMIT else unique_addrs
    for i, addr in enumerate(todo, 1):
        hit = cache_lookup(cache, addr)
        if hit:
            resolved[addr] = (hit[0], hit[1], "cache")
            from_cache += 1
            continue
        if NO_NET:
            failed += 1
            continue
        res = geocode(addr)
        if res:
            lat, lng, prec, disp = res
            resolved[addr] = (lat, lng, prec)
            entry = {"lat": lat, "lng": lng, "display_name": disp,
                     "source": prec, "geocoded_for": "verify_2026"}
            write_cache[md5(addr)] = entry
            cache[md5(addr)] = entry
            from_net += 1
        else:
            failed += 1
        if i % 25 == 0:
            print(f"  ... {i}/{len(todo)} (cache={from_cache} net={from_net} fail={failed})", flush=True)

    print(f"resolved {len(resolved)}/{len(todo)}  (cache={from_cache}, net={from_net}, failed={failed})", flush=True)

    # Persist new cache entries.
    if from_net:
        with open(GEO_CACHE_WRITE, "w", encoding="utf-8") as f:
            json.dump(write_cache, f, ensure_ascii=False, indent=2)
        print(f"wrote {from_net} new entries to {GEO_CACHE_WRITE}", flush=True)

    # Update both dataset copies (coords only; never null an existing value).
    stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%d-%H%M%S")
    total_updated = 0
    for path in DATASETS:
        with open(path, encoding="utf-8") as f:
            recs = json.load(f)
        backup = path.replace(".json", f".pre-regeocode-{stamp}.json")
        with open(backup, "w", encoding="utf-8") as f:
            json.dump(recs, f, ensure_ascii=False, indent=2)
        updated = 0
        for rec in recs:
            new_addr = title_to_addr.get(rec.get("title"))
            if not new_addr or new_addr not in resolved:
                continue
            cur = rec.get("original_address") or rec.get("address") or ""
            if cur != new_addr:
                continue  # only records actually carrying the corrected address
            lat, lng, prec = resolved[new_addr]
            if rec.get("lat") != lat or rec.get("lng") != lng:
                rec["lat"], rec["lng"] = lat, lng
                rec["geocode_verified"] = True
                rec["geocode_source"] = prec
                updated += 1
        with open(path, "w", encoding="utf-8") as f:
            json.dump(recs, f, ensure_ascii=False, indent=2)
        print(f"{os.path.relpath(path, ROOT)}: updated {updated} records (backup: {os.path.basename(backup)})", flush=True)
        total_updated += updated

    print(f"=== done: {total_updated} record-coords updated across {len(DATASETS)} copies ===", flush=True)


if __name__ == "__main__":
    main()

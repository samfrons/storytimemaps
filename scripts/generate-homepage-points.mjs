#!/usr/bin/env node
/**
 * Generates the compact dataset that powers the homepage "living map" hero.
 *
 * Reads public/data/storymaps_test_full.json and writes
 * public/data/homepage-points.json in the shape:
 *
 *   {
 *     "bounds": [lngMin, latMin, lngMax, latMax],
 *     "years": [minYear, maxYear],
 *     "total": <total records in source dataset>,
 *     "plotted": <points included below>,
 *     "closingsByYear": { "1933": 237, ... },
 *     "points": [[x, y, startYear, endYear], ...]
 *   }
 *
 * x/y are quantized to a 0-4095 grid over the clipped Berlin bounding box
 * (y measured from the top, ready for canvas drawing). Records that carry
 * the geocoder's default fallback coordinate (52.52, 13.405) are excluded
 * from the plotted points — over a thousand records share that single
 * coordinate and would render as one misleading blob — but they still
 * count toward `total` and `closingsByYear`.
 *
 * Usage: node scripts/generate-homepage-points.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = resolve(root, 'public/data/storymaps_test_full.json')
const target = resolve(root, 'public/data/homepage-points.json')

const GRID = 4095
const DEFAULT_COORD = { lat: 52.52, lng: 13.405 }
const YEAR_MIN = 1900
const YEAR_MAX = 1945

const data = JSON.parse(readFileSync(source, 'utf8'))

const year = (value) => {
  if (typeof value !== 'string' || !/^\d{4}/.test(value)) return null
  return Number(value.slice(0, 4))
}

const isDefaultCoord = (lat, lng) =>
  Math.abs(lat - DEFAULT_COORD.lat) < 1e-9 && Math.abs(lng - DEFAULT_COORD.lng) < 1e-9

const located = data.filter(
  (b) => typeof b.lat === 'number' && typeof b.lng === 'number' && !isDefaultCoord(b.lat, b.lng)
)

// Clip to the 1st-99th percentile so far-flung geocoding errors
// (some records land outside Berlin entirely) don't stretch the map.
const percentile = (values, p) => values[Math.min(values.length - 1, Math.floor(values.length * p))]
const lats = located.map((b) => b.lat).sort((a, b) => a - b)
const lngs = located.map((b) => b.lng).sort((a, b) => a - b)
const latMin = percentile(lats, 0.005)
const latMax = percentile(lats, 0.995)
const lngMin = percentile(lngs, 0.005)
const lngMax = percentile(lngs, 0.995)

const closingsByYear = {}
for (const b of data) {
  const end = year(b.endDate)
  if (end !== null && end >= 1930 && end <= 1945) {
    closingsByYear[end] = (closingsByYear[end] || 0) + 1
  }
}

const points = []
for (const b of located) {
  if (b.lat < latMin || b.lat > latMax || b.lng < lngMin || b.lng > lngMax) continue
  const start = year(b.startDate)
  const end = year(b.endDate)
  if (start === null && end === null) continue
  const x = Math.round(((b.lng - lngMin) / (lngMax - lngMin)) * GRID)
  const y = Math.round(((latMax - b.lat) / (latMax - latMin)) * GRID)
  points.push([
    x,
    y,
    Math.max(YEAR_MIN, Math.min(start ?? YEAR_MIN, YEAR_MAX)),
    Math.max(YEAR_MIN, Math.min(end ?? YEAR_MAX, YEAR_MAX)),
  ])
}

const output = {
  bounds: [lngMin, latMin, lngMax, latMax],
  years: [YEAR_MIN, YEAR_MAX],
  total: data.length,
  plotted: points.length,
  closingsByYear,
  points,
}

writeFileSync(target, JSON.stringify(output))
console.log(
  `Wrote ${target}: ${points.length} of ${data.length} records plotted, ` +
    `${(JSON.stringify(output).length / 1024).toFixed(0)} KB`
)

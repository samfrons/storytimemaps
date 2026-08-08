/**
 * Business selection + normalisation for the compact LightBurn plaques.
 *
 * The compact 300 × 100 plaque exists for the long tail of the database: the
 * businesses we know four things about — name, trade, address, dates — and
 * nothing more. There is no narrative and no photograph to engrave, so the
 * plaque states the record and stops.
 *
 * Sources from data/storymaps.json, deliberately SKIPPING the first 16 records
 * (those are the featured stories, which get the full 300 × 200 treatment).
 */

const path = require('path')

const DATA = path.join(__dirname, '../data/storymaps.json')
const STORY_COUNT = 16 // first 16 records are the featured stories

// Plaques are German. Keyed on `sectorKey` — the stable slug written by
// scripts/recover_branch_fields_2026.py — NOT on the raw `businessType` label,
// because the HU Berlin source emits some sectors in English and some in
// German (and one in both, with a trailing space). Keying on the slug makes
// this map complete by construction: all 25 sectors, one German label each.
const TRADE_DE_BY_SECTOR = {
  ADVERTISING: 'Werbung',
  BANKS_AND_INSURANCE: 'Bankgeschäft',
  BOOKS_AND_ART: 'Buch- und Kunsthandlung',
  CHEMICALS_AND_PHARMACEUTICALS: 'Chemie und Pharmazie',
  CONSTRUCTION: 'Baugewerbe',
  CONSTRUCTION_MATERIALS_AND_FUEL: 'Baustoffe und Brennstoffe',
  DEPARTMENT_STORES: 'Warenhaus',
  ELECTRICAL_GOODS: 'Elektrowaren',
  FOOD_AND_BEVERAGES: 'Nahrungs- und Genussmittel',
  FURNITURE: 'Möbel',
  HOUSEHOLD_GOODS: 'Haushaltswaren',
  JEWELRY_AND_PRECIOUS_METALS: 'Juwelier',
  LEATHER_AND_SHOES: 'Leder und Schuhe',
  MACHINES_AND_VEHICLES: 'Maschinen und Kraftfahrzeuge',
  METALS_AND_METAL_GOODS: 'Metallwaren',
  OTHER: 'Sonstiges',
  PAPER_AND_PAPER_GOODS: 'Papierwaren',
  PHARMACIES: 'Apotheke',
  PHOTOGRAPHY_AND_FILM: 'Foto und Film',
  PUBLISHING_AND_PRINTING: 'Verlag und Druckerei',
  REAL_ESTATE: 'Grundstücksgeschäft',
  RESTAURANTS: 'Gaststätte',
  TEXTILES_AND_CLOTHING: 'Textilien und Bekleidung',
  TRANSPORTATION: 'Spedition',
  USED_GOODS: 'Altwarenhandlung',
}

// Legacy raw-label map, still consulted for the handful of hand-authored
// records that predate the sectorKey recovery.
const TRADE_DE = {
  'textiles and clothing': 'Textilien und Bekleidung',
  'retail shops and department stores': 'Warenhaus',
  'books and art': 'Buch- und Kunsthandlung',
  restaurants: 'Gaststätte',
  'jewelry and precious metals': 'Juwelier',
  'metals and metal goods': 'Metallwaren',
  'banks and insurance': 'Bankgeschäft',
  'chemicals and pharmaceuticals': 'Chemie und Pharmazie',
  'machines, motor vehicles & technical articles': 'Maschinen und Kraftfahrzeuge',
  'publishing and printing': 'Verlag und Druckerei',
  'leather and shoes': 'Leder und Schuhe',
  'electrical goods': 'Elektrowaren',
  'paper and paper goods': 'Papierwaren',
  'construction materials and fuel': 'Baustoffe und Brennstoffe',
  'Nahrungs- und Genussmittel': 'Nahrungs- und Genussmittel',
  Möbel: 'Möbel',
}

// "Sonstiges"/"other" says nothing about the business, so it fails the
// "a plaque must state the type of business" rule (CLAUDE.md). The source
// emits both spellings depending on the page.
const UNUSABLE_TRADES = new Set(['', 'other', 'Sonstiges', 'Jewish-owned business'])
const UNUSABLE_SECTORS = new Set(['OTHER'])

function year(d) {
  if (!d || d === 'Unknown') return null
  const y = String(d).slice(0, 4)
  return /^\d{4}$/.test(y) ? y : null
}

/** "Wallstr. 9/10,  Berlin" -> "WALLSTR. 9/10 · BERLIN" */
function formatAddress(addr) {
  return addr
    .replace(/,\s*Germany$/i, '')
    .replace(/\s+/g, ' ')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' · ')
    .toUpperCase()
}

/** A record is only usable if it carries all four facts a plaque must state. */
function isComplete(b) {
  return Boolean(
    b.title &&
    b.address &&
    b.address.includes('Berlin') &&
    year(b.startDate) &&
    year(b.endDate) &&
    b.businessType &&
    !UNUSABLE_TRADES.has(b.businessType) &&
    !UNUSABLE_SECTORS.has(b.sectorKey)
  )
}

function normalise(b) {
  return {
    id: b.id,
    name: b.title,
    trade: (
      TRADE_DE_BY_SECTOR[b.sectorKey] ||
      TRADE_DE[b.businessType] ||
      b.businessType
    ).toUpperCase(),
    address: formatAddress(b.address),
    years: `${year(b.startDate)} – ${year(b.endDate)}`,
    slug: b.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 32),
  }
}

/** every non-story record complete enough to put on a plaque */
function usable() {
  return require(DATA).slice(STORY_COUNT).filter(isComplete).map(normalise)
}

/**
 * The prototype set: four different trades, four different streets, all with
 * names short enough to hold the display line at full size.
 */
const SAMPLE_IDS = ['73', '29', '42', '81']

function samples() {
  const byId = new Map(usable().map((b) => [String(b.id), b]))
  return SAMPLE_IDS.map((id) => {
    const b = byId.get(id)
    if (!b) throw new Error(`sample business id=${id} is missing or incomplete in storymaps.json`)
    return b
  })
}

module.exports = {
  usable,
  samples,
  normalise,
  isComplete,
  formatAddress,
  TRADE_DE,
  TRADE_DE_BY_SECTOR,
}

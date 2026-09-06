/**
 * Capture the share-preview (Open Graph) images from the real, running site.
 *
 * A link posted to iMessage, Slack, WhatsApp, Bluesky or Facebook unfurls into
 * a card built from the page's og:image. This script screenshots each route and
 * writes the result to public/images/og/, so the card a reader sees is the page
 * as it actually looks today rather than a drawing of it that drifts out of date.
 *
 *   npx playwright install chromium                # once
 *   pnpm run build && pnpm run start -- -p 3000    # in one terminal
 *   pnpm run og:capture                            # in another
 *
 * Options:
 *   --base-url <url>   server to shoot (default http://127.0.0.1:3000)
 *   --only <slug,...>  capture just these targets (by output slug)
 *
 * Re-run it after any visual change to a captured page, and commit the PNGs —
 * they are build inputs, not build output, because unfurlers fetch them from
 * the deployed site and never run this script.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public', 'images', 'og')

// 1200 x 630 is what every unfurler asks for, and it is already about twice
// the size any of them draws the card at, so there is nothing to gain from
// shooting at 2x — only files several times heavier for a crawler to fetch.
const WIDTH = 1200
const HEIGHT = 630

// JPEG, not PNG. These are screenshots — photographic map tiles, scanned
// pages, antialiased type — which PNG stores badly: the same shots came out
// 3-5x larger, and the biggest crossed the ~600KB ceiling above which some
// unfurlers (WhatsApp among them) quietly show no image at all. At quality 90
// the difference is invisible at the size a card is drawn.
const QUALITY = 90

/**
 * Each target is one share card: `slug` names the file, `path` is the route,
 * and `hide` drops page chrome that would only eat into the frame.
 *
 * Add a route here and give its page metadata the matching image (see
 * src/app/shareCard.ts) — the two halves are deliberately kept together.
 *
 */
const TARGETS = [
  { slug: 'home', path: '/' },
  // The map needs a real NEXT_PUBLIC_MAPBOX_TOKEN in the environment the
  // server was built and started in. Without one the page renders "Map
  // Configuration Error", which REJECT_IF_VISIBLE below refuses to save.
  { slug: 'map', path: '/map' },
  { slug: 'history-tour', path: '/history-tour' },
  { slug: 'jewish-businesses', path: '/jewish-businesses' },
  { slug: 'frankfurt', path: '/frankfurt' },
  { slug: 'education', path: '/education' },
  // /plaques is deliberately absent. Its hero is
  // public/plaques/lightburn/e-braun-300x200-field.svg, a gitignored output of
  // `plaques:cut` — which shells out to Inkscape at a hardcoded macOS path and
  // so cannot run on a deploy. Capturing the page locally would produce a card
  // showing a plaque that the deployed page does not show. It falls back to the
  // homepage card until the hero renders in production.
  { slug: 'exhibit-vision', path: '/exhibit-vision' },
  { slug: 'collaborate', path: '/collaborate' },
]

function parseArgs(argv) {
  const args = { baseUrl: 'http://127.0.0.1:3000', only: null }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--base-url') args.baseUrl = argv[++i]
    else if (argv[i] === '--only') args.only = argv[++i].split(',').map((s) => s.trim())
  }
  return args
}

/**
 * Playwright is imported at call time, not at the top of the file. It is a
 * few hundred megabytes with a browser attached, and this script runs by hand
 * a handful of times a year — making it a devDependency would put that
 * download in front of every install and every deploy build instead.
 */
async function loadChromium() {
  try {
    const { chromium } = await import('playwright')
    return chromium
  } catch {
    throw new Error(
      'Playwright is not installed. It is kept out of package.json on purpose ' +
        '(a browser download on every deploy for a script run by hand). Install it ' +
        'just for this:\n  pnpm add --save-dev=false playwright && npx playwright install chromium'
    )
  }
}

/**
 * A page that failed still screenshots perfectly happily, and a share card is
 * the one thing nobody looks at before it ships. Refuse to save a shot of a
 * page showing any of these.
 */
const REJECT_IF_VISIBLE = [
  'Map Configuration Error',
  'Application error',
  'This page could not be found',
  'Something went wrong',
]

async function main() {
  const { baseUrl, only } = parseArgs(process.argv.slice(2))
  const targets = only ? TARGETS.filter((t) => only.includes(t.slug)) : TARGETS

  if (targets.length === 0) {
    throw new Error(`No targets matched --only. Known slugs: ${TARGETS.map((t) => t.slug).join(', ')}`)
  }

  // Fail loudly and early rather than writing seven screenshots of a
  // connection-refused page.
  const probe = await fetch(baseUrl).catch(() => null)
  if (!probe?.ok) {
    throw new Error(
      `No site answering at ${baseUrl}. Start one first:\n` +
        `  pnpm run build && pnpm run start -- -p ${new URL(baseUrl).port || 3000}`
    )
  }

  await mkdir(OUT_DIR, { recursive: true })

  const chromium = await loadChromium()
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    // The site animates the hero and reveals sections on scroll. A share card
    // is a still, so ask for the reduced-motion variant of every page.
    reducedMotion: 'reduce',
  })

  // Half a second after a first visit the consent dialog slides up over a
  // dimmed backdrop — the lower third of the page and all of its contrast,
  // which is most of what a 630px-tall card is. Answering it before the page
  // loads is cleaner than hiding two elements after the fact. The theme key
  // is deliberately left alone: an unset one is what a first-time visitor
  // gets, so the card shows the palette the site actually opens in.
  await context.addInitScript(() => {
    window.localStorage.setItem('storymap-cookie-consent', 'accepted')
  })

  // One route needing an environment variable nobody set should not cost you
  // the six shots that worked. Collect the failures, report them together,
  // and exit non-zero so a script or a CI step still notices.
  const failures = []

  try {
    for (const target of targets) {
      const page = await context.newPage()
      try {
        const url = new URL(target.path, baseUrl).toString()
        const response = await page.goto(url, { waitUntil: 'load', timeout: 60_000 })

        if (!response || response.status() >= 400) {
          throw new Error(`${target.path} returned ${response ? response.status() : 'no response'}`)
        }

        // Quiet network means the page has settled, but some routes hold a
        // connection open for as long as they are on screen and never go quiet
        // at all. Wait for it when it comes and shrug when it does not, rather
        // than failing a page that is perfectly finished drawing.
        await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})

        // Sections start hidden and fade in when an IntersectionObserver sees
        // them. Anything below the first screen never gets observed in a
        // 630px-tall window, so show everything before shooting.
        await page.addStyleTag({
          content: `
            .reveal, .reveal-stagger { opacity: 1 !important; transform: none !important; }
            *, *::before, *::after {
              animation-duration: 0s !important;
              animation-delay: 0s !important;
              transition-duration: 0s !important;
              transition-delay: 0s !important;
            }
          `,
        })

        // Chrome that orients a reader mid-session (sticky nav, cookie strips)
        // only steals room from the thing the card is meant to show.
        if (target.hide?.length) {
          await page.addStyleTag({
            content: `${target.hide.join(', ')} { display: none !important; }`,
          })
        }

        // Web fonts decide the whole look of these pages; a shot taken before
        // they land shows the fallback stack.
        await page.evaluate(() => document.fonts.ready)
        await page.waitForTimeout(600)

        const text = await page.evaluate(() => document.body.innerText)
        const failure = REJECT_IF_VISIBLE.find((phrase) => text.includes(phrase))
        if (failure) {
          throw new Error(
            `${target.path} rendered "${failure}" — refusing to save it as a share card. ` +
              'Check the server has the environment it needs, then re-run.'
          )
        }

        const buffer = await page.screenshot({ type: 'jpeg', quality: QUALITY })
        const file = join(OUT_DIR, `${target.slug}.jpg`)
        await writeFile(file, buffer)
        console.log(`  ✓ ${target.path} → public/images/og/${target.slug}.jpg`)
      } catch (error) {
        failures.push(`${target.path}: ${error.message}`)
        console.log(`  ✗ ${target.path} — ${error.message}`)
      } finally {
        await page.close()
      }
    }
  } finally {
    await browser.close()
  }

  const captured = targets.length - failures.length
  console.log(`\nCaptured ${captured}/${targets.length} share card(s) at ${WIDTH}x${HEIGHT}.`)

  if (failures.length > 0) {
    throw new Error(`${failures.length} target(s) failed:\n  - ${failures.join('\n  - ')}`)
  }
}

main().catch((error) => {
  console.error(`\ncapture-og-screenshots: ${error.message}\n`)
  process.exitCode = 1
})

/**
 * Capture the share-preview (Open Graph) images from the real, running site.
 *
 * A link posted to iMessage, Slack, WhatsApp, Bluesky or Facebook unfurls into
 * a card built from the page's og:image. This script screenshots each route and
 * writes the result to public/images/og/, so the card a reader sees is the page
 * as it actually looks today rather than a drawing of it that drifts out of date.
 *
 *   npx playwright install chromium                # once
 *   pnpm run build && pnpm run og:capture --serve  # builds nothing; serves .next and shoots
 *
 * Or against a server you already have running:
 *   pnpm run og:capture --base-url http://127.0.0.1:3000
 *
 * Options:
 *   --serve            start `next start` on a free port for the run, stop it after
 *   --base-url <url>   server to shoot (default http://127.0.0.1:3000; ignored with --serve)
 *   --only <slug,...>  capture just these targets (by output slug)
 *
 * The map pages read NEXT_PUBLIC_MAPBOX_TOKEN at BUILD time, so it has to be
 * in .env.local when `pnpm run build` runs, not just when this script does.
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
// A Mapbox/MapLibre canvas is on the page. There is no DOM signal for "all
// tiles drawn", so these wait for the network to go quiet for longer and then
// give the renderer a beat; under software WebGL that beat is not optional.
const MAP_READY = { readyWhen: 'canvas.mapboxgl-canvas, canvas.maplibregl-canvas', settleMs: 4000 }

const TARGETS = [
  { slug: 'home', path: '/' },
  // The map needs a real NEXT_PUBLIC_MAPBOX_TOKEN in the environment the
  // server was built and started in. Without one the page renders "Map
  // Configuration Error", which REJECT_IF_VISIBLE below refuses to save.
  { slug: 'map', path: '/map', ...MAP_READY },
  // The tour lifts its "Preparing the relief" veil on the map's load event.
  { slug: 'history-tour', path: '/history-tour', ...MAP_READY, readyWhen: '.ht-veil.is-hidden' },
  { slug: 'jewish-businesses', path: '/jewish-businesses', ...MAP_READY },
  { slug: 'frankfurt', path: '/frankfurt', ...MAP_READY },
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
  const args = { baseUrl: 'http://127.0.0.1:3000', only: null, serve: false }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--base-url') args.baseUrl = argv[++i]
    else if (argv[i] === '--only') args.only = argv[++i].split(',').map((s) => s.trim())
    else if (argv[i] === '--serve') args.serve = true
  }
  return args
}

/**
 * `next start` on a port nobody else holds, resolved once it answers. Saves
 * the second terminal, and means the server is always the build on disk
 * rather than whatever happened to be running.
 */
async function serveBuild() {
  const { spawn } = await import('node:child_process')
  const { createServer } = await import('node:net')

  const port = await new Promise((resolve, reject) => {
    const probe = createServer()
    probe.unref()
    probe.on('error', reject)
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address()
      probe.close(() => resolve(port))
    })
  })

  // `next start` forks a next-server child of its own. Killing only the
  // process we spawned would orphan that child, which keeps the port and our
  // stdout pipes open, and this script would then never exit. Put the whole
  // tree in its own process group and signal the group.
  const child = spawn('npx', ['next', 'start', '-p', String(port)], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })
  const stop = () => {
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      // Already gone.
    }
  }
  let log = ''
  child.stdout.on('data', (d) => (log += d))
  child.stderr.on('data', (d) => (log += d))

  const baseUrl = `http://127.0.0.1:${port}`
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`next start exited with ${child.exitCode} before answering:\n${log}`)
    }
    if (await fetch(baseUrl).then((r) => r.ok).catch(() => false)) break
    await new Promise((r) => setTimeout(r, 500))
  }
  if (!(await fetch(baseUrl).then((r) => r.ok).catch(() => false))) {
    stop()
    throw new Error(`next start did not answer on ${baseUrl} within 60s. Is there a build? Run pnpm run build first.\n${log}`)
  }

  return { baseUrl, stop }
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
  const args = parseArgs(process.argv.slice(2))
  const targets = args.only ? TARGETS.filter((t) => args.only.includes(t.slug)) : TARGETS

  if (targets.length === 0) {
    throw new Error(`No targets matched --only. Known slugs: ${TARGETS.map((t) => t.slug).join(', ')}`)
  }

  let baseUrl = args.baseUrl
  let stopServer = () => {}
  if (args.serve) {
    ;({ baseUrl, stop: stopServer } = await serveBuild())
    console.log(`  serving .next on ${baseUrl}`)
  } else {
    // Fail loudly and early rather than writing seven screenshots of a
    // connection-refused page.
    const probe = await fetch(baseUrl).catch(() => null)
    if (!probe?.ok) {
      throw new Error(
        `No site answering at ${baseUrl}. Either pass --serve, or start one first:\n` +
          `  pnpm run build && pnpm run start -- -p ${new URL(baseUrl).port || 3000}`
      )
    }
  }

  try {
    await capture(targets, baseUrl)
  } finally {
    stopServer()
  }
}

async function capture(targets, baseUrl) {
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
        // than failing a page that is perfectly finished drawing. Map pages
        // get longer: their tiles arrive in waves well after `load`.
        const idleMs = target.readyWhen ? 45_000 : 15_000
        await page.waitForLoadState('networkidle', { timeout: idleMs }).catch(() => {})

        // A readiness selector is a hard requirement, not a hint: a map that
        // never finished is a blank card, and a blank card should fail here
        // rather than ship.
        if (target.readyWhen) {
          await page.waitForSelector(target.readyWhen, { state: 'attached', timeout: 60_000 }).catch(() => {
            throw new Error(
              `${target.path} never became ready ("${target.readyWhen}" did not appear). ` +
                'For a map page this usually means tiles could not be fetched.'
            )
          })
          await page.waitForTimeout(target.settleMs ?? 0)
        }

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

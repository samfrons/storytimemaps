# Plaque fonts

Vendored because the plaque generators need the exact faces at render time:
`generate-premium-plaques.js` embeds the `.woff2` subsets in the SVG, and
`generate-lightburn-plaque.js` needs the `.ttf` files installed as system fonts
(`cp scripts/fonts/*.ttf ~/Library/Fonts/`) so Inkscape can convert text to
paths. Pulling them from a CDN at build time would make engraving output depend
on network state, and a substituted fallback face silently changes the physical
plaque.

| Family | Files | Used for |
|---|---|---|
| Cinzel | 400, 700, latin subset | plaque display names / Gedenktafel headers |
| EB Garamond | 400, 600, latin subset | narrative body copy on 300 × 200 plaques |
| Inter | 400, 700, latin subset | data lines, addresses, the funding attribution |
| Kameron | 400, 700, latin subset | slab alternative for the compact plaques |

## Licence

All four families are licensed under the **SIL Open Font License, Version 1.1**,
as distributed by Google Fonts. The OFL permits bundling and redistribution
provided the licence travels with the fonts and they are not sold on their own.

- Cinzel — Natanael Gama
- EB Garamond — Georg Duffner, Octavio Pardo
- Inter — Rasmus Andersson
- Kameron — Vernon Adams

Full licence text: https://openfontlicense.org/open-font-license-official-text/

None of these families has a Reserved Font Name, so the files may be modified,
but keep any modified copy under a different filename to avoid confusion with
the upstream release.

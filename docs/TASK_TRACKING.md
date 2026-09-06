# Task Tracking

How work is organized so collaborators can pick things up without stepping on each other.

## Where tasks live

| Kind of work | Tracked in |
|---|---|
| Code features & bugs | GitHub Issues on this repo |
| Outreach (per-address) | The outreach tracker at `/admin/outreach` — see [`OUTREACH_TRACKING.md`](./OUTREACH_TRACKING.md) |
| Research/data cleanup | GitHub Issues with the `research` label |
| Translations | GitHub Issues with the `i18n` label |

GitHub Issues is the single queue for everything except per-address outreach, which has
its own purpose-built tracker.

## Labels

Use these labels on issues so people can filter by track:

- `code` / `research` / `outreach` / `i18n` / `design` — the track
- `good-first-task` — well-scoped, low-context; ideal for new collaborators
- `blocked` — waiting on data, access, or a decision (say what, in a comment)
- `question` — needs maintainer input

## Claiming & working a task

1. **Claim:** comment "taking this" on the issue (or assign yourself). One task at a
   time until you know the codebase.
2. **Work:** branch `<type>/<short-description>`, follow the pre-commit checklist in
   [`ONBOARDING.md`](./ONBOARDING.md).
3. **Update:** if a task takes more than a week, drop a one-line status comment so it
   doesn't look abandoned. Stale claims (2+ weeks silent) are fair game to pick up.
4. **Close:** PR merged → close the issue with a link to the PR.

## Workstreams (standing areas of work)

These are the ongoing buckets new tasks fall into:

1. **Map & Timeline** — performance, clustering, time-slider states
2. **Data Integrity** — date verification, geocoding fixes, duplicate cleanup
3. **Plaque Program** — plaque pages, inquiry form, production pipeline
4. **Outreach** — occupant research and contact (tracker-driven)
5. **Localization** — DE/YI/HE translations, RTL support
6. **Frankfurt Expansion** — extending the platform beyond Berlin

## Proposing new work

Open an issue describing **what** and **why** before building. For anything touching the
theme system, map rendering, or data schema, wait for maintainer sign-off — these areas
have strict rules (`CLAUDE.md`) and history.

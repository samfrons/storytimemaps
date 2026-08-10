# Outreach Tracking Guide

How we track contact with the current occupants of former Jewish business addresses in
Berlin, as part of the memorial plaque program. The tracker lives at **`/admin/outreach`**
(password-protected; ask the maintainer for access — both the page and the underlying
`/api/outreach` endpoints are password-gated server-side).

- **UI:** `src/app/admin/outreach/page.tsx` + `src/app/components/outreach/`
- **API:** `src/app/api/outreach/` (data + CSV export)
- **Data model:** `src/lib/types/outreach.ts`
- **Source list:** `Outreach/Jewish Business Outreach - For Json.csv`

---

## 1. The Pipeline

Every address moves through a status pipeline. Update the status **every time** you touch
a record — the tracker is only useful if it reflects reality.

```
not_started → researching → contacted → awaiting_response ─┬→ interested → approved
                                        ↑                  │
                                        └─ follow_up_needed┴→ declined
                                                            → not_applicable
```

| Status | Means | Your next action |
|---|---|---|
| `not_started` | Nobody has looked at this address | Research current occupant |
| `researching` | Identifying occupant + contact info | Fill occupant/contact fields |
| `contacted` | First outreach sent | Set `first_contact_date`, log channel in notes |
| `awaiting_response` | Waiting on a reply | Set `next_follow_up_date` (~2 weeks out) |
| `follow_up_needed` | Follow-up date passed with no reply | Send follow-up, re-date |
| `interested` | Positive response, not yet committed | Send plaque details, arrange next step |
| `approved` | Occupant agreed to a plaque | Hand off to plaque production |
| `declined` | Occupant said no | Log reason in notes; do not re-contact |
| `not_applicable` | Building demolished / vacant / no viable contact | Log why |

**Interest level** (`high/medium/low/none/unknown`) is separate from status — use it to
prioritize follow-ups.

## 2. Research Workflow

Use **Research Mode** (button in the tracker header) to step through `not_started`
records one at a time.

For each address:
1. Look up the address on Google Maps / OpenStreetMap — who occupies it today?
2. Fill in: `current_occupant_name`, `current_occupant_type` (business / residential /
   office / public / vacant / demolished), `property_type`.
3. Find contact info: `contact_email`, `contact_phone`, `contact_website`, and a named
   `contact_person` if possible.
4. Record where the info came from (`data_source`: google_maps, osm, manual_research,
   site_visit, phone_call, website).
5. Set status to `researching` while incomplete, `contacted` once outreach is sent.

## 3. Contact Guidelines

Current occupants bear **no responsibility** for what happened at their address. Our tone
is always invitational, never accusatory.

- Lead with the project's mission: memory, education, neighborhood history.
- Explain what a plaque involves concretely (size, placement, cost to them: none).
- One follow-up after ~2 weeks, a second after ~4 weeks, then stop unless they respond.
- Log **every** interaction in `outreach_notes` with a date prefix:
  `2026-08-09: Called, spoke with office manager, sending info PDF.`
- A `declined` is final. Respect it.

## 4. Data Hygiene

- Dates in ISO format (`YYYY-MM-DD`) in date fields.
- Notes are append-only — never delete history, add new lines on top.
- Export a CSV backup (Export button → `/api/outreach/export`) before bulk edits.
- Never commit personal contact data to the public repo beyond what's in the tracker's
  data store.

## 5. Weekly Rhythm

1. Open the tracker, check the **stats bar** — the `follow_up_needed` count is your queue.
2. Clear follow-ups first, then continue research on `not_started`.
3. Aim for small consistent batches (5–10 addresses/session) over heroic sprints.
4. Note blockers or interesting responses in the project task board
   (see [`docs/TASK_TRACKING.md`](./TASK_TRACKING.md)).

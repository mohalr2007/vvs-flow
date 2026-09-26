# VVS Flow — Backend and full feature integration

Goal: replace demo data with a real backend (Lovable Cloud) so every screen works for real, while keeping the current design untouched.

## What will work for real after this

- **Customer booking**: requests (normal, emergency, project) are saved; the customer gets a private link for their booking.
- **Real AI understanding**: the customer's description is analyzed by AI (service type, urgency, missing details, estimated duration and price, confidence score). Low confidence automatically becomes "Needs assessment". The owner always approves.
- **Photo upload**: customers can attach leak/problem photos, stored privately.
- **Slots**: real availability calculated from working hours, existing jobs and travel buffers.
- **Token pages**: Offer (15-min countdown, accept/decline), Access confirmation, Reschedule all read and write real data.
- **Owner login**: real sign-in for Mats (email + password), owner-only access to the dashboard, protected by an owner role.
- **Dashboard**: Needs your attention, Revenue at risk, today's timeline, all computed from real data.
- **Job review**: edit, approve and find slots, save details.
- **Waitlist + cancellation recovery**: deterministic score (zone +40, duration +30, flexibility +15, waiting +5, urgency +2), cancel a job → best match found → real 15-minute offer → slot recovered or passed to next match when it expires.
- **Projects, Calendar, Leads (recover abandoned), Inbox simulator (still labelled Demo), ROT export (CSV download, not a government link), Settings (hours, zones, prices)**.
- **Demo controls** (Reset demo, Advance 15 min / 24 h) kept, owner-only, working on the real data with a simulated clock.
- Loading, empty and error states on every screen; no fake success.

## Work order

1. Enable Lovable Cloud; create tables, security rules and demo starter data (same Ekström VVS jobs as today).
2. Owner sign-in + owner role; dashboard gated behind it.
3. Rewrite the data services one by one (booking, job, waitlist, lead, project, file, AI) — screens stay the same.
4. Real AI intake.
5. Slot finder, offers, cancellation recovery, offer expiry.
6. Connect each screen, then settings, ROT export, demo controls.
7. End-to-end test: book as customer → review as owner → cancel → recover slot.

## Technical details

- Tables: settings, service_zones, customers, jobs (JobStatus enum), projects (ProjectStatus enum), appointments, waitlist_entries, offers (token, expires_at, status), access_tokens, leads, inbox_messages, rot_records, job_photos, user_roles (+ has_role), demo_clock. GRANTs + RLS on each; customer rows never publicly readable.
- Public customer actions go through server functions that validate tokens server-side (random unguessable tokens); owner actions use authenticated server functions checked with has_role(owner).
- AI: server function using openai/gpt-6-astra via the AI gateway, structured output (Zod), streamed; errors (402/429) shown clearly.
- Storage: private bucket for photos, signed URLs for the owner.
- Offer expiry evaluated on read + via demo clock (no cron needed); scoring stays a pure, testable function.
- `src/lib/services.ts` keeps the same interface so components barely change; `vvs-data.ts` becomes seed/type source. Update AGENTS.md and roadmap.md.

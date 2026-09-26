<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting published git history.
<!-- LOVABLE:END -->

- Keep entity types in `src/lib/vvs-data.ts` (derived from the database types) and call data only through `src/lib/services.ts`, so presentation code stays backend-agnostic.
- Customer (anonymous) actions live in `src/lib/public.functions.ts` and are authorised only by unguessable per-booking/offer tokens validated server-side; owner actions live in `src/lib/owner.functions.ts` and require auth plus the `owner` role, so customers never get table access.
- Scheduling and waitlist scoring stay pure and deterministic in `src/lib/scheduling.ts`, so AI never makes final decisions and scores are explainable.
- Time-dependent logic uses the settings clock offset (demo clock) and evaluates offer expiry on read, so no cron job is needed.
- Keep public customer pages in `CustomerShell` and operational pages beneath the `/dashboard` `OwnerShell`, so the two experiences remain visually related but structurally distinct.
- `/dashboard` is gated client-side (ssr:false) and every owner server function re-checks the owner role; the first confirmed account can claim ownership once, so the workspace always has a single owner.
- Do not use 3D visuals; use authentic trade photography and restrained interface motion for faster, more credible customer experiences.
- Use a bright Scandinavian industrial system across customer and owner screens: crisp white surfaces, charcoal structure, muted blue accents, Urbanist headings, and Epilogue body text.
- Use the root-level theme and motion layer for persistent appearance changes and route/scroll transitions, so every customer and owner page behaves consistently.

<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting published git history.
<!-- LOVABLE:END -->

- Keep all demo business entities in `src/lib/vvs-data.ts` and access future backends through `src/lib/services.ts`, so presentation code stays backend-agnostic.
- Keep public customer pages in `CustomerShell` and operational pages beneath the `/dashboard` `OwnerShell`, so the two experiences remain visually related but structurally distinct.
- Authentication is an explicit frontend demo boundary only; never represent it as production security until a real identity service is connected.
- Do not use 3D visuals; use authentic trade photography and restrained interface motion for faster, more credible customer experiences.
- Use a bright Scandinavian industrial system across customer and owner screens: crisp white surfaces, charcoal structure, muted blue accents, Urbanist headings, and Epilogue body text.

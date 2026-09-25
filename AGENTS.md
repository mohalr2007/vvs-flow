<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting published git history.
<!-- LOVABLE:END -->

- Keep all demo business entities in `src/lib/vvs-data.ts` and access future backends through `src/lib/services.ts`, so presentation code stays backend-agnostic.
- Keep public customer pages in `CustomerShell` and operational pages beneath the `/dashboard` `OwnerShell`, so the two experiences remain visually related but structurally distinct.
- Authentication is an explicit frontend demo boundary only; never represent it as production security until a real identity service is connected.

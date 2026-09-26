# Fluid English redesign enhancements

## Goal
Make the entire VVS Flow experience feel more polished through page transitions, scroll-based motion, and a complete light/dark appearance, while keeping every customer and owner screen in English.

## What will change
- Add a persistent light/dark switch to both the customer header and owner dashboard, with a system-aware default and no flash on page load.
- Extend the existing Scandinavian industrial palette into a carefully balanced dark version with clear contrast for cards, forms, tables, status labels, navigation, and emergency states.
- Add a subtle transition between pages and reusable reveal-on-scroll motion for primary page sections and repeated content.
- Keep motion restrained and purposeful: staggered entrances, small position/opacity changes, and smooth theme transitions rather than decorative effects.
- Disable or simplify motion automatically when reduced motion is enabled.
- Audit every public, token, login, and dashboard page so all visible labels, messages, actions, dates, and empty/error states are in English.
- Preserve all existing booking and dashboard behavior, demo data, and routes.

## Verification
- Check the homepage, booking flow, token page, login, dashboard, jobs, calendar, waitlist, leads, projects, inbox, ROT, and settings in both themes.
- Verify page navigation and scroll reveals on desktop and mobile.
- Confirm theme choice persists across navigation and reloads, focus remains visible, and no text loses contrast or gets clipped.
- Confirm the latest preview build has no errors.

## Technical details
- Use the existing semantic design tokens, adding `.dark` token values rather than hardcoded page colors.
- Introduce one shared theme control and one shared motion wrapper at the application shell level.
- Use `IntersectionObserver` for reveal-on-scroll and TanStack Router location state for page transitions, with safe client-side initialization.

# VVS Flow frontend build

## Goal
Build a polished, demo-ready frontend for Ekström VVS with two clearly distinct experiences: an effortless customer booking journey and an action-first owner operations workspace. Everything will run on centralized realistic demo data and mock service interfaces, with no claims of live integrations or secure production authentication.

## Customer experience
- Create a calm customer shell and routes for home, booking, emergency, time offers, access confirmation, and rescheduling.
- Build the guided booking conversation: service choice, emergency branch, request understanding, missing-detail prompts, location, availability, and confirmation.
- Add standalone token pages with touch-friendly decisions, reservation countdowns, and clear success/error states.
- Produce a lightweight copper-pipe signature visual with restrained movement and a reduced-motion/mobile fallback.

## Owner experience
- Create a separate responsive owner shell with desktop sidebar and purpose-built mobile navigation.
- Build login and a transparent mock authentication boundary that is explicitly demo-only.
- Build the action-first dashboard, revenue-at-risk explanation, today timeline, job review, calendar, waitlist scoring, cancellation recovery, offers, leads, projects, inbox simulator, ROT summary, settings, and demo controls.
- Include loading, error, and empty-state presentations across operational sections.

## Shared foundation
- Establish a Scandinavian industrial design system: warm neutral surfaces, charcoal/navy typography, muted blue, restrained success/warning/emergency roles, Manrope typography, precise spacing, and accessible focus states.
- Create reusable controls and domain components for buttons, cards, badges, metrics, timelines, jobs, waitlists, progress, overlays, countdowns, confidence, review panels, token pages, empty states, and skeletons.
- Centralize typed demo models and data, plus replaceable mock service interfaces for booking, jobs, waitlist, leads, projects, files, and AI.
- Add restrained state-driven motion, keyboard support, screen-reader status messages, touch targets, and reduced-motion handling.

## Routing and content
- Implement every requested public and owner route with its own metadata.
- Keep customer and owner layouts separate while sharing brand tokens and primitives.
- Use Västerås-specific sample customers, zones, jobs, pricing in SEK, and Swedish examples where they strengthen credibility.

## Verification
- Check the preview at 360, 390, 768, 1024, 1440, and 1920 widths.
- Exercise the booking confirmation, emergency result, job review, waitlist recovery, offer countdown, and mobile owner navigation flows.
- Confirm the generated build is healthy and that no screen falsely represents a backend or external integration as connected.

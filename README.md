# VVS Flow

Larabi:

VVS Flow — Frontend Design & UX Build

Build the complete frontend UI/UX for a premium Swedish plumbing service platform called VVS Flow, for a fictional business called Ekström VVS in Västerås, Sweden.

This first build is focused on the frontend, visual identity, responsive layouts, navigation, animations, micro-interactions, and complete user flows.

Do NOT build fake backend logic or pretend that real integrations already exist. Use realistic mock/demo data and clean service abstractions so the backend can be connected later.

The product has TWO completely different frontend experiences:

1. Customer-facing booking website
2. Owner/plumber operations dashboard

They must feel like the same product visually, but they must NOT look like the same page.

---

1. PRODUCT POSITIONING

VVS Flow is not just a booking calendar.

Core message:

"Every inquiry gets an outcome."

Secondary message:

"No valuable job gets silently lost."

The product helps a solo plumber handle:

- normal plumbing requests
- emergency requests
- AI-assisted request understanding
- appointment scheduling
- access confirmation
- cancellations
- intelligent waitlists
- recovered appointments
- unusual requests requiring assessment
- renovation / new installation projects

The design should communicate:

- reliability
- precision
- speed
- trust
- Scandinavian professionalism
- modern technology
- human control

Avoid making it look like a generic AI startup.

It should look like a serious premium Swedish service-business product.

---

2. VISUAL DIRECTION

Use a premium Scandinavian industrial aesthetic.

Think:

- Swedish architecture
- modern service company
- clean SaaS interface
- subtle industrial details
- high-quality typography
- large whitespace
- precise cards
- restrained colors
- elegant motion

Primary visual language:

- off-white / warm white backgrounds
- charcoal / deep navy text
- muted blue accents
- green for confirmed/success states
- amber for pending states
- red only for emergencies/destructive actions

Do NOT create a rainbow interface.

Do NOT overuse gradients.

Do NOT make every card colorful.

The interface should feel expensive and intentional.

---

3. TYPOGRAPHY

Use a modern highly readable sans-serif font.

Suggested:

Inter or Manrope

Use:

- large bold typography for important headlines
- medium weight for labels
- compact typography for operational data
- strong hierarchy

Avoid excessive uppercase text.

Use Swedish copy where appropriate, but the application can initially use English UI text with Swedish business/customer examples.

---

4. IMPORTANT: TWO DISTINCT EXPERIENCES

Create two separate application shells.

CUSTOMER EXPERIENCE

Routes:

/
/book
/emergency
/offer/:token
/access/:token
/reschedule/:token

Customer interface should be:

- calm
- simple
- visual
- reassuring
- mobile-first
- minimal
- extremely easy to understand

A customer should never feel like they are using business software.

---

OWNER EXPERIENCE

Routes:

/login

/dashboard
/dashboard/jobs
/dashboard/calendar
/dashboard/waitlist
/dashboard/leads
/dashboard/projects
/dashboard/inbox
/dashboard/rot
/dashboard/settings

Owner interface should be:

- information-dense
- professional
- operational
- desktop-first but responsive
- fast to scan
- optimized for one person managing the entire business

The owner should immediately understand:

What needs my attention right now?

---

5. CUSTOMER LANDING PAGE

Create a visually impressive landing page for Ekström VVS.

Hero:

Large headline:

"Plumbing help, without the waiting."

Supporting text:

"Describe what you need. We'll help find the right service and the next available time."

Primary CTA:

Book a service

Secondary CTA:

Emergency — water leaking now

Show a professional visual representation of a plumber/service environment.

Do NOT use cheesy stock-photo-heavy SaaS design.

Prefer a premium abstract/3D plumbing visual.

---

6. 3D VISUAL LANGUAGE

Use tasteful 3D elements where they genuinely improve the experience.

Potential visual:

A stylized premium 3D copper pipe s



Larabi:

ystem / water-flow sculpture.

The pipes can subtly form the VVS Flow logo/shape.

Use:

- realistic metallic materials
- subtle reflections
- soft shadows
- slow rotation
- subtle floating motion

The 3D element should NOT dominate the interface.

It must remain performant.

Use lightweight CSS/Canvas/WebGL approaches where practical.

If using a 3D library, keep it isolated and lazy-loaded.

On low-power/mobile devices, automatically provide a simpler static/fallback version.

Do NOT create heavy 3D scenes that damage performance.

---

7. CUSTOMER BOOKING FLOW

Create a beautiful multi-step booking experience.

Progress indicator:

Service
→
Details
→
Location
→
Time
→
Confirm

The interface should feel like one continuous guided conversation rather than a boring form.

---

8. FIRST CUSTOMER QUESTION

Large centered question:

"What type of service do you need?"

Two large cards:

Repair / Emergency

Icon: wrench / water drop

Text:

"Something needs fixing."

New Installation / Renovation

Icon: house / construction

Text:

"You're planning a new installation or renovation."

Cards should have elegant hover animations.

---

9. EMERGENCY QUESTION

For repair flow:

Ask:

"Is water leaking right now?"

Two large options:

Yes — Emergency

Use a subtle red accent.

No

Normal flow.

Emergency should visually transition into a more urgent interface.

Do not use flashing animations.

---

10. EMERGENCY SCREEN

Show:

"We'll help you find the fastest available response."

Fields:

- Name
- Phone
- Address
- What is happening?
- Optional photo

Primary CTA:

Find emergency availability

Show a small safety notice.

After submission, create a beautiful ETA result card using mock data.

Example:

Estimated arrival

14:20–14:45

Based on current workload and travel zone.

---

11. NORMAL AI INTAKE

Create a conversational-style intake interface.

Example:

Customer writes:

«"Our kitchen sink is leaking and there's water under the cabinet."»

The UI should visually show:

Understanding your request...

Then a structured result card:

Kitchen sink leak

Urgency
High

Estimated service
60–120 min

Then:

"We just need a few more details."

Only show missing fields.

Do not create a huge form.

---

12. CUSTOMER SLOT SELECTION

Create a premium availability interface.

Example:

Available times

Today
14:00
16:30

Tomorrow
09:00
11:30
14:00

Make the selected slot visually obvious.

Show a small travel/service indicator when appropriate.

Example:

12:00 is available

"Your appointment fits our current schedule."

---

13. CONFIRMATION SCREEN

After selecting a slot:

Large success state.

You're booked.

Tuesday, October 6
14:00–15:30

Kitchen sink repair

Show:

- address
- service
- date
- time
- estimated duration
- estimated price

Clearly label price:

Estimated price — not a binding quote

CTA:

View booking

Secondary:

Add to calendar

---

14. TOKEN PAGES

Create beautiful standalone customer pages for:

/offer/:token
/access/:token
/reschedule/:token

These pages should NOT require login.

---

/offer/:token

Show:

A time just opened for you.

Example:

Today
14:00–15:30

This offer is reserved for you for:

14:32

Large countdown.

CTA:

Accept this time

Secondary:

Decline

Make the countdown visually elegant, not stressful.

---

/access/:token

Show:

Will someone be able to let us in?

Options:

- Yes, I'll be home
- Key with neighbor
- Door code available
- I need to arrange access

Use large touch-friendly cards.

---

/reschedule/:token

Show current appointment and available alternatives.

---

15. OWNER LOGIN

Create a minimal professional login.

Brand:

VVS Flow

Subtitle:

Ekström VVS

Do not make login look like a generic consumer SaaS.

---

16. OWNER DASHBOARD

The dashboard is the operational heart of the product.

Desktop layout:

┌──────────────┬───────────────────────────────┐
│ │ │
│ Sidebar │ Main workspace │
│ │ │
│ Dashboard │ │
│ Jobs │



Larabi:

│
│ Calendar │ │
│ Waitlist │ │
│ Leads │ │
│ Projects │ │
│ Inbox │ │
│ ROT │ │
│ Settings │ │
│ │ │
└──────────────┴───────────────────────────────┘

Sidebar should be compact and elegant.

Use icons with labels.

On mobile, convert to a bottom navigation / drawer pattern.

---

17. DASHBOARD HERO

At the top:

Good morning, Mats.

Then:

Here's what needs your attention.

Do not make the dashboard primarily about analytics.

Make it about ACTION.

---

18. ACTION CENTER

This should be the most important section.

Example:

Needs your attention

3 jobs need review
2 appointments need access confirmation
1 BRF approval pending
1 cancelled slot can be recovered
2 unusual requests need assessment

Each item is clickable.

Use subtle priority indicators.

---

19. REVENUE AT RISK

Create a premium metric card:

Revenue at Risk

Example:

12,450 SEK

Subtitle:

Estimated value of open opportunities

Important:

This is NOT actual lost revenue.

It is the estimated value of unresolved opportunities.

Use a subtle visual indicator.

---

20. TODAY'S SCHEDULE

Create a beautiful timeline.

Example:

08:30
Kitchen leak
Confirmed

10:30
Faucet repair
Access confirmed

13:00
Boiler service
Needs access confirmation

15:30
Emergency buffer
Available

Use vertical timeline design.

Make the current time indicator visually distinct.

---

21. JOB REVIEW SCREEN

Create a detailed job review interface.

Header:

Review Job Details

Show:

AI Confidence
94%

Job type
Kitchen sink leak

Urgency
High

Duration
60–120 min

Zone
723

Include editable controls.

Buttons:

Approve & Find Slots

Edit details

AI must NEVER be presented as having final authority.

---

22. WAITLIST SCREEN

Create a highly visual waitlist.

Example:

Open slot
Today · 14:00

Best matches

92% Anna
Kitchen leak
Zone 723
Flexible

86% Erik
Toilet repair
Zone 724

71% Sara
Faucet repair
Zone 726

Clicking a customer opens a side panel explaining the score.

---

23. WAITLIST SCORE DETAIL

Show:

92% Match

Same zone +40
Duration fits +30
Flexibility +15
Waiting duration +5
Urgency +2

Use a clean visual breakdown.

Do NOT make this look like mysterious AI ranking.

It must feel deterministic and explainable.

---

24. CANCELLATION RECOVERY

Create a special visual interaction.

When an appointment is cancelled:

Show:

14:00 slot opened

Searching for compatible customers...

Then animate a subtle scanning effect.

After a short delay:

Best match found

Anna
92% match

Then:

Send 15-minute offer

This should be one of the strongest visual moments in the product.

---

25. 15-MINUTE OFFER DEMO

Show the owner:

Offer sent

Anna has 14:32 remaining

Use a circular or linear countdown.

When accepted:

Elegant transition:

Slot recovered

Add a subtle success animation.

---

26. NEEDS ASSESSMENT

Create a dedicated state for uncertain jobs.

Example:

Needs Assessment

AI confidence
42%

The request is unusual.
Manual review required.

Show customer description and optional photo.

CTA:

Review request

Then owner can set:

- Job type
- Duration
- Urgency
- Estimate
- Site visit required

---

27. PROJECTS

Create a separate Projects interface for:

New Installation / Renovation

Show cards:

Bathroom renovation
Site visit requested

Kitchen installation
Owner review

Boiler replacement
Approved

Use different visual language from quick repair jobs so projects are immediately recognizable.

---

28. CALENDAR

Create a polished calendar.

Views:

- Day
- Week

Appointments should show:

- customer
- job type
- duration
- zone
- status

Use realistic spacing.

Avoid a generic Google Calendar clone.

Include travel buffers visually where relevant.

---

29. LEADS

Create:

Leads

Sections:

New
Qualified
He



Larabi:

ld
Abandoned
Converted

Abandoned leads should have a clear:

Recover opportunity

action where applicable.

---

30. INBOX SIMULATOR

Create an owner-facing inbox simulator.

Header:

Inbox Simulator

Description:

"Paste a customer message to turn it into a structured service request."

Input:

Paste customer message...

Example:

«Hej, vår toalett läcker sedan igår...»

Button:

Understand request

Then show AI extraction.

Clearly label this:

Demo / Integration-ready

Do not claim that WhatsApp or Instagram is actually connected.

---

31. ROT

Create a simple ROT interface.

Show completed jobs eligible for a ROT summary.

Each row:

- Customer
- Work
- Labor
- Materials
- Estimated eligible amount
- Status

CTA:

Generate ROT Summary

This is a demo/export feature, not government integration.

---

32. MOBILE EXPERIENCE

The customer experience must be mobile-first.

The plumber dashboard must be:

desktop-first + fully responsive.

On mobile dashboard:

Use:

- bottom navigation
- sticky action buttons
- swipeable cards
- compact timeline
- large touch targets

Do not simply shrink the desktop UI.

---

33. MICRO-INTERACTIONS

Use polished motion throughout.

Examples:

- cards gently lift on hover
- buttons have subtle press feedback
- page transitions use fade/slide
- progress steps animate
- status changes animate
- booking confirmation has a subtle success animation
- waitlist search has a scanning animation
- countdown updates smoothly
- dashboard numbers can animate when loaded

Motion should communicate state.

Never use motion just for decoration.

---

34. 3D / MOTION HERO

Create one signature 3D visual.

Concept:

A modern copper plumbing network floating in space.

Water flows subtly through selected pipes.

The network can visually transition into the VVS Flow logo.

Interaction:

- slow idle movement
- slight parallax with mouse movement on desktop
- touch parallax on mobile if performant
- subtle lighting

Keep it lightweight.

If WebGL/3D is too expensive, implement a high-quality CSS/2D fallback.

Performance is more important than 3D complexity.

---

35. EMPTY STATES

Create polished empty states for every section.

Examples:

Waitlist:

No customers waiting

"New opportunities will appear here."

Leads:

No open leads

Projects:

No active projects

Calendar:

Nothing scheduled

Do not leave blank white screens.

---

36. LOADING STATES

Create skeleton loaders for:

- dashboard
- jobs
- calendar
- waitlist
- leads
- projects

Do not use generic spinning loaders everywhere.

---

37. ERROR STATES

Create clear error states.

Example:

Something went wrong

"Your booking hasn't been confirmed. Please try again."

Never falsely show success when the backend is not connected.

---

38. DEMO CONTROLS

Add a small owner-only Demo Controls area.

Buttons:

Reset Demo

Advance 15 min

Advance 24 hours

These controls should be visually separated from normal business functionality.

---

39. RESPONSIVE BREAKPOINTS

Design intentionally for:

- 360px mobile
- 390px mobile
- 768px tablet
- 1024px laptop
- 1440px desktop
- 1920px large desktop

Do not let cards become excessively wide.

Use a strong max-width system.

---

40. ACCESSIBILITY

Implement:

- keyboard navigation
- visible focus states
- semantic buttons
- readable contrast
- accessible form labels
- reduced-motion support
- large enough touch targets
- screen-reader-friendly status messages

If the user has "prefers-reduced-motion", disable heavy animations and 3D movement.

---

41. COMPONENT SYSTEM

Build reusable components:

Button
Card
StatusBadge
MetricCard
Timeline
AppointmentCard
JobCard
WaitlistCard
ProgressStepper
Modal
Drawer
Toast
EmptyState
Skeleton
Countdown
AIConfidenceBadge
ReviewPanel
CustomerTokenPage

Do not duplicate components unnecessarily.

---

42. DATA MODEL FOR FRONTEND

Use realistic mock data structures matching the future backend.

Example:

type JobStatus =
| "new"
| "qualified"
| "held"
| "confirmed"
| "access_confirmed"
| "in_progress"
| "completed"
| "cancelled"
| "expired"
| "waitlisted"



Larabi:

| "needs_assessment";

Also support project states:

type ProjectStatus =
| "project_request"
| "site_visit_requested"
| "site_visit_scheduled"
| "owner_review"
| "project_approved"
| "scheduled"
| "in_progress"
| "completed";

Keep all demo data centralized so it can later be replaced by Cloudflare Worker/D1 APIs.

---

43. ROUTING

Implement the route structure:

/
/book
/emergency
/offer/:token
/access/:token
/reschedule/:token

/login

/dashboard
/dashboard/jobs
/dashboard/calendar
/dashboard/waitlist
/dashboard/leads
/dashboard/projects
/dashboard/inbox
/dashboard/rot
/dashboard/settings

Customer routes and owner routes must have separate layout components.

Example architecture:

CustomerLayout
OwnerLayout

Never put the customer booking interface inside the owner dashboard shell.

---

44. OWNER ROUTE PROTECTION

The frontend should have an owner authentication boundary around:

/dashboard/*

Customer token routes must remain public.

For now, use a clean mock authentication state if backend authentication is not yet connected.

Do NOT expose fake "logged in" behavior that pretends to be secure.

Keep the auth abstraction ready for Cloudflare-based authentication.

---

45. IMPORTANT ARCHITECTURE RULE

Do not tightly couple UI components to Supabase.

There is NO Supabase in this project.

The future backend is:

Cloudflare Workers
Cloudflare D1
Cloudflare R2
Cloudflare Durable Objects
Cloudflare Cron
Groq

Create clean service interfaces such as:

bookingService
jobService
waitlistService
leadService
projectService
fileService
aiService

For this frontend phase, these can use mock implementations.

Later they will call Cloudflare Workers APIs.

---

46. PERFORMANCE

Performance is extremely important.

Do not sacrifice speed for visual effects.

Use:

- lazy loading
- code splitting
- optimized images
- lazy-loaded 3D
- minimal JavaScript for decorative elements
- reduced-motion fallback
- avoid unnecessary re-renders

The application must feel fast on an average laptop and mobile phone.

---

47. FINAL VISUAL QUALITY BAR

The result should feel like a product that could realistically be presented to:

- a Swedish plumbing company
- a SaaS investor
- a design jury
- a Lovable challenge jury

It should NOT look like:

- a generic admin template
- a beginner React project
- a generic AI chatbot
- a fake futuristic dashboard
- a template full of gradients
- a simple CRUD application

It should feel like a carefully designed real product.

---

48. DEMO-FIRST PRIORITY

Prioritize these screens for maximum polish:

1. Customer landing page
2. Customer booking flow
3. AI request understanding
4. Booking confirmation
5. Owner dashboard
6. Job review
7. Waitlist
8. Cancellation recovery
9. 15-minute offer
10. Needs Assessment
11. Project intake

These are the most important screens for the eventual 3-minute competition demo.

---

49. DO NOT BUILD YET

Do NOT spend significant time implementing:

- real Cloudflare API integration
- real Groq API calls
- real R2 upload
- real D1 database
- real Cron jobs
- real payment
- real WhatsApp
- real Instagram
- Google Maps
- Google Routes

First make the complete frontend experience excellent.

The UI must already be architected so these services can be plugged in later without redesigning the interface.

---

50. FINAL REQUEST

Build the complete frontend now.

Start with the design system and shared components, then implement:

1. Customer experience
2. Owner experience
3. Routing
4. Responsive layouts
5. Mock data
6. Interactive states
7. Animations
8. 3D hero/visual where appropriate
9. Loading/error/empty states
10. Demo controls

Make the product visually coherent from first page to final dashboard.

The most important principle:

The customer should feel that booking plumbing service is effortless.

The plumber should feel that VVS Flow tells him exactly what needs attention.

The jury should immediately understand that this is an operations system designed to prevent lost jobs, not merely another booking calendar.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b9506bcd-256a-4188-834f-9981db88d72f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

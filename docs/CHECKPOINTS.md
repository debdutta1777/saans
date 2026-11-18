# Saans project checkpoints

## Resume here

Project: **Saans — a little more breathing room**

Implementation is complete for the agreed family/community smog-assistant scope. All four phases below have been implemented and reviewed against the six rubric criteria. Do not rebuild from scratch. The repository includes a Vercel build. Configure Gemini on the deployment and verify a live response next.

Source and runtime secrets are separate. No Gemini key has been received, stored in chat, or committed. The app intentionally reports that generation is not configured.

## Phase 1 — Domain and evidence: COMPLETE

- Sourced action catalogue, eight cities, explicit US AQI categories.
- Household validation, practical routines and transparent scenario arithmetic.
- Avoids confusing carbon reductions with exposure or local AQI changes.
- Six-parameter gate: see RUBRIC.md; domain boundary tests pass.

## Phase 2 — Air and GenAI service integration: IMPLEMENTED / LIVE KEY PENDING

- Open-Meteo/CAMS adapter, freshness checks, cache/coalescing and unavailable state.
- Gemini structured-output adapter, server-only secrets, consent, action validation and bounded generation.
- Quota/error fallback, budget enforcement and basic emergency escalation.
- Six-parameter gate: mocked integration/security/efficiency tests pass. Real Gemini run is explicitly pending.

## Phase 3 — Family and community experience: COMPLETE

- Overview, daily plan/assistant, cleaner-home guide, community tools and transparency/setup page.
- Local preferences and daily completion, text exports, CADR sizing and editable CO₂ scenario.
- Responsive CSS, keyboard controls, semantic labels, live status regions and reduced-motion support.
- Six-parameter gate: desktop manual acceptance results documented; no unsupported mobile or WCAG certification claim.

## Phase 4 — Quality and submission preparation: COMPLETE WITH EXTERNAL FOLLOW-UPS

- 26 automated tests pass; syntax/build/artifact/format checks pass.
- README, setup guide, rubric evidence, security review, evaluation record and CI included.
- Private hosted preview and downloadable source prepared through the delivery workflow.
- Six-parameter gate: evidence and limitations recorded rather than an invented guaranteed score.

## External follow-ups

1. User enters Gemini key into `.env.local` locally or host private environment settings, never chat/public code.
2. Verify a real **Generated with Gemini** response.
3. Submit the public repository URL and verify the challenge's repository-size limit.
4. Decide whether to expose a public demo to judges. Current preview stays private; add distributed abuse controls/provider quotas before public use.
5. Optional next improvements: additional cities, fully translated catalogue/UI, real mobile/screen-reader audit, distributed limiter and broader prompt evaluations.

## Phase 5 — Rubric review and hardening (18 November 2026)

- Applied a single budget policy to daily plans, question fallbacks and generated actions. Plans explain the city, commute, exposure or equipment context where relevant.
- Preserved valid current AQI when optional forecast data is malformed. Bounded cached readings by source freshness. Removed duplicate catalogue payload and repeated action lookups.
- Kept urgent guidance independent of providers and made browser state recover from invalid saved data. Shortened accessible checkbox names to the action titles.
- Passed 38 tests, including a matrix of 96 household and air scenarios. Build, syntax, artifact and formatting checks passed. A production request verified live modelled Kolkata data and forecast for the site.
- Gemini secret entry remains an owner operation in Sites settings. Run the live-key smoke test after deploying a runtime revision with the secret.

## Phase 6 — GitHub and Vercel packaging (18 November 2026)

- Added a static Vercel build and three Node.js API entry points using the existing shared server logic. Preserve the tested local and Sites Worker build paths.
- Documented the Vercel dashboard flow for adding a sensitive Gemini key and verifying generation.

# Saans — a little more breathing room

A GenAI-assisted clean-air companion for families and communities navigating winter smog. Saans turns city-level air conditions, household routines and budgets into practical actions with an explanation of **why each choice matters**.

## Try it

Requires Node.js 22. No runtime packages, database or API key are required to explore the source-backed guide.

```bash
npm ci
npm start
```

Open http://localhost:3000. To activate generation, follow [secure Gemini setup](docs/SETUP.md). Never put a key into a browser field, a GitHub file or a chat message.

## Deploy to Vercel

Import this repository in [Vercel](https://vercel.com/new) with the repository root as the Root Directory. The `vercel.json` file configures the static build and API functions. In **Settings → Environment Variables**, add `GEMINI_API_KEY` as Sensitive for Production and, if needed, Preview. Deploy or redeploy after saving it. [Deployment and verification instructions](docs/SETUP.md#3-deploy-to-vercel)

## What works

- Eight supported cities: Kolkata, New Delhi, Mumbai, Bengaluru, Lucknow, Patna, Lahore and Dhaka.
- Current modelled US AQI, PM2.5, PM10 and a short hourly outlook from Open-Meteo/CAMS. No fabricated readings if the provider is unavailable.
- Personalisation by commute, daily return distance, budget, existing purifier, sensitive household needs and AI summary language.
- A daily checklist, local progress, source-backed explanations and text export.
- Server-side Gemini structured generation: an explanation plus validated IDs from a curated action catalogue. Explicit opt-in to send household context; no-AI mode remains useful.
- Indoor source-control guide and smoke-CADR room-sizing calculator.
- A transparent CO₂ scenario calculator with editable factors and a community note generator. Downloads are user-directed; nothing is posted automatically.
- Hindi and Bengali **AI summaries**; the UI and verified catalogue remain English.
- Keyboard-operable controls, focus states, accessible dialog, text status categories, responsive layout, reduced-motion and print styling.

## Why this fits the challenge

Saans addresses both sides of the problem: **reduce pollution exposure today** and **reduce avoidable emissions over time**. It does not recommend cycling through severe smog merely because cycling is low-carbon. Free and shared-cost options make the guidance useful beyond households that can afford a purifier.

The AI does a bounded job: selecting and explaining suitable actions from a sourced catalogue. Deterministic code handles AQI classification, input validation, emissions arithmetic, crisis escalation and budget constraints. This separation makes the most important behaviour inspectable and testable.

## Architecture

| Area              | Responsibility                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| `src/domain.js`   | City and action catalogue, AQI categories, profile validation, recommendation rules, impact calculations |
| `src/services.js` | Cached air-data adapter, structured Gemini adapter, validation and fallbacks                             |
| `src/security.js` | Security headers, bounded request parsing and per-instance rate limiting                                 |
| `src/http-api.js` | Shared request validation, routing and rate limits                                                       |
| `public/`         | Browser application, semantic HTML and responsive CSS                                                    |
| `scripts/`        | Dependency-free runtime/build/check scripts                                                              |
| `tests/`          | Domain, service and API/security tests using Node’s built-in runner                                      |
| `docs/`           | Setup, rubric evidence, security considerations, evaluation and checkpoints                              |

Vercel serves the frontend from its CDN and runs `/api/air`, `/api/config` and `/api/assist` as Node.js functions. The local server and Sites Worker use the same API implementation.

The fixed-module build emits one self-contained Worker ES module. The same handler runs in Node for local use or a Node host. Generated assets are build outputs; edit source files instead.

## Verification

```bash
npm run build
npm run build:vercel
npm run check
npm test
npm run validate
npm run format:check
```

Tests mock upstream providers: no key, network connection or paid request is needed. CI executes the same checks. See [evaluation evidence](docs/EVALUATION.md) and [rubric mapping](docs/RUBRIC.md). A real Gemini response cannot be verified until an API key is configured.

## Honest limitations

- The supported cities use regional model estimates, not hyperlocal sensor readings. US AQI is explicitly distinguished from India AQI. Indoor AQI is not measured.
- No personalised diagnosis, medication advice, guaranteed health outcomes or predicted AQI reduction.
- CO₂ defaults are **illustrative assumptions**, editable by the user; results are not measured savings and do not include full lifecycle emissions.
- Community features prepare practical initiatives and downloadable notes; they are not a social network, verified volunteer directory or automated broadcast system.
- The built-in rate limiter is per instance. Add host-level distributed controls and provider quotas before a public launch. The hosted preview is private.
- Model-generated summaries may still be wrong. Actions and sources are bounded; output validation cannot guarantee factual accuracy of free text.
- Free-tier access, quotas, permitted usage and model availability depend on the provider. Set `GEMINI_MODEL` to a supported structured-output model if your account requires a different model.

## Sources and attribution

- [EPA: Create a cleaner-air room](https://www.epa.gov/wildfires/how-create-cleaner-air-room-home)
- [EPA: Indoor air filtration](https://www.epa.gov/wildfires/indoor-air-filtration)
- [AirNow: AQI basics](https://www.airnow.gov/aqi/aqi-basics/)
- [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api), using Copernicus Atmosphere Monitoring Service (CAMS) forecasts. Consult provider terms before commercial use.
- [Gemini structured outputs](https://ai.google.dev/gemini-api/docs/structured-output)

Source consulted during implementation: 17 November 2026. Follow your local authority’s latest advisories. This is general environmental guidance, not medical advice.

MIT licensed. See [LICENSE](LICENSE).

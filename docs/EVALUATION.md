# Verification record — 18 November 2026

## Automated results

- **38 tests passed, 0 failed** using Node's built-in test runner.
- Build succeeded: self-contained Worker, approximately **92 KB uncompressed** before deployment packaging.
- JavaScript syntax checks passed.
- Client credential-pattern scan passed.
- Generated Worker imported successfully and exported a fetch handler.
- Source formatting check passed.
- Zero runtime dependencies; one pinned development formatter dependency.

### Coverage by behaviour

| Group        | Checks                                                                                                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain       | AQI category boundaries; unavailable/negative inputs; city/profile validation; sensitive households; budget; owned purifier; unique actions; exact CO₂ arithmetic; negative savings; topical fallback               |
| Air adapter  | Provider URL; valid current reading; coalescing; cache expiry; unavailable/stale/malformed data; negative cache                                                                                                     |
| Gemini       | No key; valid mocked response; API-key header; response schema; unknown action rejection; oversized summary; malformed output; quota; outage; emergency bypass; budget enforcement                                  |
| API/security | Bounded rate limiter; memory cap; reset; oversized stream; content type; cross-origin write rejection; unknown city/prototype keys; invalid profile; secret redaction; CSP; unknown routes; no-AI consent respected |

Tests intentionally use provider mocks. A passing mocked integration is not proof of a successful real Gemini call.

## Rubric review regression coverage

The 38 tests include 96 combinations of commute, budget, sensitivity and AQI. Regression cases cover consistency across recommendation modes, malformed forecasts, cache freshness, browser-state recovery, safe urgent guidance without network calls and short response payloads.

## Manual desktop browser acceptance

| Interaction                  | Observed result                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Dashboard                    | Layout rendered with provenance, AQI scale and an honest unavailable-data state                                           |
| Navigation                   | Overview, plan, home, community and transparency views reachable                                                          |
| Daily checkbox               | Completion count updated; checked state survived a reload                                                                 |
| Cooking question without key | Relevant cooking/smoke actions appeared, labelled source-backed rather than generated                                     |
| Household dialog             | Free-only budget and 20 km distance saved; no-idling action replaced the shared-cost recommendation                       |
| Impact calculator            | 20 km × 5 days × (0.17 − 0.05) displayed 12 kg potentially avoided; alternative 0.30 displayed 13 kg additional emissions |
| Community initiative         | Switching to errand buddy changed the drafted note                                                                        |
| Cleaner room calculator      | 300 ft² produced 200 cfm / approximately 340 m³/h                                                                         |
| Browser console              | No application JavaScript errors observed; unrelated browser-extension errors excluded                                    |

## Limits that remain explicit

- **Real Gemini response: pending the user's API key.** Secure configuration and a precise success-label check are documented in SETUP.md.
- The development environment exercised the unavailable-data path. A production endpoint check returned current modelled Kolkata data, pollutant concentrations and hourly forecast from Open-Meteo/CAMS on 18 November. Availability can change with the provider.
- No formal screen-reader audit, mobile-device execution, load test or external penetration test was performed. Responsive and accessibility mechanisms are implemented; do not claim certification.
- Export handlers are implemented; downloaded file contents were not independently audited during the initial desktop pass.
- The public source includes the Vercel build and CI for the contest. Live Gemini verification on Vercel requires a project with its server-side key configured.

## Re-run locally

```bash
npm ci
npm run build
npm run build:vercel
npm run check
npm test
npm run validate
npm run format:check
```

## Live-key smoke test after configuration

1. Use a non-sensitive test profile and question: “How can I reduce cooking pollution on a small budget?”
2. Confirm the UI says the server is configured.
3. Opt in to Gemini and submit once.
4. Confirm **Generated with Gemini**, sensible explanation, catalogue actions and no invented AQI/savings.
5. Repeat a school-run question and an unknown-air-data case.
6. Verify quota/provider failures still produce explicitly labelled guidance.
7. Do not include API keys or private household data in screenshots, logs or submission materials.

## Vercel production review

On 18 November 2026, the deployed app returned live Kolkata air data and generated a Gemini answer in the daily planner about low-cost indoor steps during smog. The answer displayed the Gemini label and linked the summary to specific catalogue actions. The indoor calculator returned 160 cfm for 240 ft². Three participating households produced an illustrative 18 kg CO₂ estimate under the default travel assumptions. The community note changed when the initiative was switched, and the export control prepared a download.

The browser review found two keyboard navigation issues. Submitting a question moved focus to the page body, and the skip link changed the active page. The implementation now keeps the existing question form in the DOM, moves focus to the result after keyboard submission, and sends the skip link directly to the current main region. Checklist completion uses a labelled native progress control. Air reading and forecast times display in the selected city’s time zone.

The deployment responses included a restrictive Content Security Policy, HSTS, content-type protection, and private API cache rules. The Gemini adapter rejects redirects and the API accepts the `application/json` media type with optional parameters. The suite includes 41 checks. Per-instance request limits and the need for host-level traffic controls for wider public use remain documented in SECURITY.md.

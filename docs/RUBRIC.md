# Submission rubric: implementation evidence

The uploaded criteria identify Code Quality and Problem Statement Alignment as high impact; Security and Efficiency as medium; Testing and Accessibility as low. Every phase considers all six. No numerical score is claimed because the evaluator's exact rules and weights are not available.

| Parameter                    | Evidence in the submission                                                                                                                                                                                                                 | Verification / remaining limit                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Code quality — high**      | Separate pure domain rules, service adapters, HTTP/security layer and UI. Descriptive names, JSDoc at boundaries, deterministic build, formatted source, setup/architecture docs and locked development dependency. Zero runtime packages. | Syntax, formatting, artifact import and unit/integration tests. No framework complexity needed for this scope.                       |
| **Problem alignment — high** | Household and location personalisation; smog-safe routines; low-cost indoor improvements; sustainable travel choices; explicit impact explanations; community initiatives; Gemini-generated summaries and catalogue selection.             | Eight cities, meaningful no-AI fallback, no fabricated local readings or guaranteed outcomes. Real Gemini run awaits the user's key. |
| **Security — medium**        | Server-only secrets, opt-in data sharing, strict input limits, fixed upstream URLs, same-origin checks, CSP, output escaping, rate limiting and no private prompt logs.                                                                    | Automated rejection/error/secret tests. Per-instance limiter needs distributed enforcement before a large public launch.             |
| **Efficiency — medium**      | 92 KB uncompressed Worker artifact, no runtime dependencies, bounded memory, city cache, coalesced requests, negative cache, provider timeouts, token cap and no retry loops.                                                              | Cache and coalescing tests; artifact byte count recorded in evaluation. No production load-test claim.                               |
| **Testing — low**            | Node built-in tests cover boundaries, invalid input, cache behaviour, budget rules, AI output validation, consent, secrets, quota and outage handling. CI runs reproducibly. Manual browser acceptance checks documented.                  | Real Gemini and all-region provider reliability cannot be certified without credentials and deployed observation.                    |
| **Accessibility — low**      | Semantic landmarks, skip link, labelled controls, native modal, keyboard access, visible focus, text alongside AQI colours, live regions, mobile layout, reduced motion and export/print support.                                          | Desktop browser checks; no formal WCAG audit or unperformed screen-reader/mobile test claim.                                         |

## Phase gates

| Phase                   | Quality                                          | Alignment                                          | Security                                    | Efficiency                                 | Testing                                 | Accessibility                                 |
| ----------------------- | ------------------------------------------------ | -------------------------------------------------- | ------------------------------------------- | ------------------------------------------ | --------------------------------------- | --------------------------------------------- |
| 1: Domain and sources   | Pure functions / catalogue                       | Family + community actions / low-emission routines | Allowlisted profile and city                | Small fixed catalogue                      | AQI/impact/budget boundaries            | Text categories / plain explanations          |
| 2: Providers and Gemini | Injectable adapters                              | Grounded generation / current context              | Server keys / schema / consent / fixed URLs | Cache / timeouts / bounded output          | Success, outage, quota, malformed mocks | Clear fallback/loading/error status           |
| 3: Product interface    | Shared domain logic / no duplicated calculations | All five sections / usable without key             | Local data / escaped summaries              | No third-party frontend requests           | Browser interaction checks              | Keyboard controls / labels / responsive rules |
| 4: Submission readiness | Formatting / README / reproducible CI            | Demo flow / honest limits                          | Secret exclusions / deployment guidance     | Small package / no runtime dependency tree | Full suite / build / syntax / artifact  | Accessibility checklist / exported text       |

## Suggested judge walkthrough

1. Choose Kolkata or New Delhi and inspect the provenance and US AQI label. If unavailable, observe the honest fallback.
2. Set free-only budget, a private commute and a sensitive household. Open the personalised checklist.
3. Ask about a school run or cooking; after secure key setup, opt in and inspect the **Generated with Gemini** label.
4. Open a “Why this helps” explanation and its source.
5. Change the transport scenario, including a higher-emission alternative. Observe signed arithmetic and caveats.
6. Generate a community initiative note and export the plan.
7. Run `npm test` and inspect security tests and phase checkpoints.

The preview is private. Vercel import and a successful live-key smoke test remain deployment steps; do not conceal these gaps in the submission description.

## Review update for 18 November

The original feature set has 38 passing tests. The review tightened budget fit, added explanations tied to location and lifestyle, and improved source freshness. A production request confirmed the live Kolkata data path. The evaluation record identifies the remaining real-key Gemini check.

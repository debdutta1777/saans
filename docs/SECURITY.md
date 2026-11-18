# Security and privacy review

## Boundaries

The browser is untrusted. Server-side validation reconstructs an allowlisted household profile, bounds distance, limits question length to 800 characters, and rejects unknown cities. Body parsing enforces an 8 KiB byte limit even without Content-Length. The server obtains its own air data; it does not trust client-supplied AQI or source URLs.

Gemini keys live exclusively in server environment variables and travel in the provider's API-key header, never in a query string. The public configuration route exposes only a boolean readiness flag. Gemini receives minimal context only after the caller opts in. The key is not part of the prompt.

Fixed upstream domains and city allowlists prevent user-directed server-side URL fetching. Same-origin checks reject browser cross-site writes. No permissive CORS header is present. CSP restricts scripts/styles/connections to the application's origin and disallows objects; external links use noopener/noreferrer. Generated summaries are HTML-escaped, never interpreted as markup.

## Abuse and cost

- 12 assistant requests/client/minute/instance.
- 90 air requests/client/minute/instance.
- Rate-limiter storage capped at 2,000 clients; reject new clients at capacity.
- 8-second air-provider timeout; 20-second Gemini timeout.
- Air data cached for 15 minutes; failed air requests cached for 60 seconds.
- Concurrent requests for the same city share one upstream request.
- Bounded Gemini output and structured schema; no retry storm on 429s.
- No prompt/response cache and no application logging of personal prompts.

**Residual risk:** in-memory controls are not global across Worker isolates or Node replicas. Production public deployments need edge-wide rate limiting, suitable user authentication if required, and provider quotas. The Node adapter trusts only its connection address, not incoming identity headers. The hosted Worker trusts identity headers inserted by its hosting platform; do not assume those headers are trustworthy on an unrelated host.

## AI and content risks

Catalogue action IDs must pass schema validation. Unknown IDs, oversized summaries, malformed responses, blocked outputs, timeouts and provider errors fall back to explicit non-AI guidance. Buying a purifier is removed if it conflicts with the household's budget and existing equipment. Basic English emergency phrases bypass generation. This is a conservative keyword guard, not a medical triage system or multilingual emergency classifier.

The system prompt treats user input as untrusted data, forbids diagnoses, invented AQI/savings and unsafe pollution interventions, and does not grant tool access. Free-text model summaries can still be inaccurate or influenced by prompt injection. Curated action text is authoritative; users must review generated explanations. Model output is not a substitute for professional/local-authority guidance.

## Data lifecycle

Preferences and daily completion persist only in localStorage. The clear-data action removes them. Questions and generated plans are not persisted by this application. Providers/hosting may retain metadata under their own policies. No precise geolocation, name, medical history, analytics or advertising trackers are collected. City selections are shared with the air provider as city coordinates; opted-in AI requests send the disclosed context to Google.

## Checks

See automated security tests and manual browser checks in EVALUATION.md. This review is not an independent penetration test, formal WCAG certification or a guarantee of security.

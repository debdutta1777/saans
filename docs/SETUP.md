# Secure setup and deployment

## 1. Run the app locally

Install Node.js 22 on your computer. Extract the source archive and open its folder in VS Code. In the integrated terminal:

```bash
npm ci
npm start
```

Open http://localhost:3000. All deterministic features work without a key.

## 2. Put the Gemini key in the correct place

1. Open https://aistudio.google.com/apikey in your own browser. Use your existing key or create a key in your own project. Check the project's free-tier eligibility and quotas.
2. In VS Code's file explorer, copy `.env.example` and rename the copy to **`.env.local`**.
3. Open **`.env.local`** in your editor. Paste the actual key immediately after `GEMINI_API_KEY=`. Do not surround it with backticks. Leave `GEMINI_MODEL=gemini-2.5-flash`, unless your account requires another compatible model.
4. Save the file. Stop the local server with Ctrl+C, then run `npm start` again.
5. Open **How it works**. The status should say **Configured on the server**. This means the key exists, not that the provider has accepted it yet.
6. Open **My daily plan**, enter a non-sensitive question, tick the Gemini consent checkbox, and submit. Success is explicitly labelled **Generated with Gemini**. A fallback label means the provider request was not successful; do not present that as a live AI demonstration.

`.env.local` is ignored by Git. The server reads the key; the browser never receives it. Do not send the key in chat, place it in `public/`, use a `NEXT_PUBLIC_`/`VITE_` prefix, or commit it. There is deliberately no key-entry form in the application.

## 3. Deploy to Vercel

1. In [Vercel New Project](https://vercel.com/new), import `debdutta1777/saans`. If the repo is absent, grant the Vercel GitHub app access to that repository.
2. Use **Other** as the framework preset and leave **Root Directory** at the repository root. Vercel reads the commands from `vercel.json`. The build command is `npm run build:vercel`, the output directory is `dist/vercel`, and the function runtime is Node.js 22.
3. Before deploying, add `GEMINI_API_KEY` in **Environment Variables**. Enable **Sensitive**, select **Production**, and include **Preview** only if you want Preview deployments to use your Gemini quota. `GEMINI_MODEL` is optional.
4. Deploy. If you added the key after a previous deployment, redeploy to apply it. The application reads the key within the Node function at request time.
5. Open **My daily plan**, enter a sample question, enable Gemini, and verify the **Generated with Gemini** label. The `GET /api/config` endpoint reports readiness only. A value of `true` means the server received a key. A generated response verifies the key and model actually work.

If you want to run a separate Node server behind a reverse proxy, set `APP_ORIGIN` to its exact public origin, without a trailing slash, when the proxy rewrites the request scheme. Vercel uses the incoming URL by default.

## 4. Public GitHub submission

Submit the public repository URL for code review. Add your Vercel URL if the challenge asks for a demo. Keep `.env.local` and actual keys out of GitHub. The provided `.env.example` contains placeholders. Check any repository-size or access requirements on the competition page.

## 5. Troubleshooting

| Symptom                                | Meaning / next step                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Awaiting your server-side key          | Variable is missing or server was not restarted                                                        |
| Configured, but source-backed response | Configuration exists, but no successful generation yet; inspect the displayed reason                   |
| Quota reached                          | Wait for provider quota reset or adjust your project quota; there is no automatic retry loop           |
| Provider unavailable                   | Check key restrictions, project eligibility, model availability and outbound access                    |
| Air data unavailable                   | External air provider/network unavailable or readings were invalid/stale; app will not invent readings |
| Too many requests                      | Built-in guard allows 12 assistant requests per client per minute per instance                         |

Provider response bodies and secrets are deliberately not returned to the browser or printed by the application. Use your provider dashboard for account-level errors. Rotate any accidentally exposed key promptly.

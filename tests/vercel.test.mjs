import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { GET as air } from "../api/air.js";
import { POST as assist } from "../api/assist.js";
import { GET as config } from "../api/config.js";
import { HEADERS } from "../src/security.js";

const root = new URL("../", import.meta.url);
const origin = "https://saans.example";

test("Vercel serves only the frontend assets with the expected security headers", async () => {
  const settings = JSON.parse(
    await readFile(new URL("vercel.json", root), "utf8"),
  );
  const output = new URL(`${settings.outputDirectory}/`, root);
  assert.deepEqual((await readdir(output)).sort(), [
    "app.js",
    "domain.js",
    "index.html",
    "planner-view.js",
    "styles.css",
  ]);
  assert.equal(
    await readFile(new URL("domain.js", output), "utf8"),
    await readFile(new URL("src/domain.js", root), "utf8"),
  );
  const headers = Object.fromEntries(
    settings.headers[0].headers.map(({ key, value }) => [key, value]),
  );
  for (const [key, value] of Object.entries(HEADERS)) {
    if (key !== "Cache-Control") assert.equal(headers[key], value);
  }
});

test("Vercel uses the server Gemini setting without returning the value", async () => {
  const previous = process.env.GEMINI_API_KEY;
  try {
    process.env.GEMINI_API_KEY = "test-only-value";
    const response = await config(new Request(`${origin}/api/config`));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { aiConfigured: true });
    assert.equal(response.headers.get("cache-control"), "no-store");
  } finally {
    if (previous === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
  }
});

test("Vercel API entry points preserve air validation and same-origin protection", async () => {
  assert.equal(
    (await air(new Request(`${origin}/api/air?city=unknown`))).status,
    400,
  );
  const request = (requestOrigin) =>
    new Request(`${origin}/api/assist`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: requestOrigin },
      body: JSON.stringify({
        profile: {},
        question: "I cannot breathe",
        useAI: true,
      }),
    });
  const result = await assist(request(origin));
  assert.equal(result.status, 200);
  assert.equal((await result.json()).reason, "urgent_guidance");
  assert.equal((await assist(request("https://other.example"))).status, 403);
});

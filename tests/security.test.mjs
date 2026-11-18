import test from "node:test";
import assert from "node:assert/strict";
import { createLimiter, readJSON } from "../src/security.js";
import worker from "../worker/index.js";
test("rate limiter bounds requests and memory and resets windows", () => {
  const allow = createLimiter({ limit: 2, windowMs: 100, maxEntries: 1 });
  assert(allow("a", 0));
  assert(allow("a", 1));
  assert(!allow("a", 2));
  assert(!allow("b", 3));
  assert(allow("b", 101));
});
test("request reader rejects oversized streams and wrong content types", async () => {
  await assert.rejects(() =>
    readJSON(
      new Request("https://x", {
        method: "POST",
        body: "x".repeat(9000),
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
  await assert.rejects(() =>
    readJSON(new Request("https://x", { method: "POST", body: "{}" })),
  );
});
test("API rejects cross-origin writes before using provider", async () => {
  const response = await worker.fetch(
    new Request("https://saans.test/api/assist", {
      method: "POST",
      headers: {
        Origin: "https://evil.test",
        "Content-Type": "application/json",
      },
      body: "{}",
    }),
    {},
  );
  assert.equal(response.status, 403);
});
test("unknown city and prototype names are rejected", async () => {
  for (const city of ["unknown", "__proto__", "constructor"]) {
    const response = await worker.fetch(
      new Request("https://saans.test/api/air?city=" + city),
    );
    assert.equal(response.status, 400);
  }
});
test("invalid request never reaches Gemini", async () => {
  const response = await worker.fetch(
    new Request("https://saans.test/api/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"profile":{"distance":-1},"question":"hello","useAI":true}',
    }),
    { GEMINI_API_KEY: "test-secret" },
  );
  assert.equal(response.status, 400);
  assert(!(await response.text()).includes("secret"));
});
test("configuration reveals only readiness, not secrets", async () => {
  const response = await worker.fetch(
    new Request("https://saans.test/api/config"),
    { GEMINI_API_KEY: "test-secret" },
  );
  const text = await response.text();
  assert(!text.includes("test-secret"));
  assert(JSON.parse(text).aiConfigured);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});
test("HTML has restrictive security headers and no third-party scripts", async () => {
  const response = await worker.fetch(new Request("https://saans.test/"));
  assert.equal(response.status, 200);
  assert(
    response.headers
      .get("Content-Security-Policy")
      .includes("script-src 'self'"),
  );
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert(!(await response.text()).includes('script src="https:'));
});
test("unknown routes do not fall back to an ambiguous success", async () => {
  assert.equal(
    (await worker.fetch(new Request("https://saans.test/api/unknown"))).status,
    404,
  );
  assert.equal(
    (await worker.fetch(new Request("https://saans.test/nope"))).status,
    404,
  );
});
test("user who declines AI never sends their question to Gemini", async () => {
  const original = globalThis.fetch;
  const hosts = [];
  globalThis.fetch = async (url) => {
    hosts.push(new URL(url).hostname);
    throw new Error("offline test");
  };
  try {
    const response = await worker.fetch(
      new Request("https://saans.test/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {},
          question: "Help with cooking",
          useAI: false,
        }),
      }),
      { GEMINI_API_KEY: "test-secret" },
    );
    const body = await response.json();
    assert.equal(body.mode, "guidance");
    assert(body.actionIds.includes("cook"));
    assert(!hosts.includes("generativelanguage.googleapis.com"));
  } finally {
    globalThis.fetch = original;
  }
});

test("urgent questions at the API boundary bypass both upstream services", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = () => {
    calls++;
    throw new Error("Must not call");
  };
  try {
    const request = new Request("http://internal/api/assist", {
      method: "POST",
      headers: {
        Origin: "https://saans.test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        profile: {},
        question: "I cannot breathe",
        useAI: true,
      }),
    });
    const response = await worker.fetch(request, {
      APP_ORIGIN: "https://saans.test",
      GEMINI_API_KEY: "test-secret",
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.reason, "urgent_guidance");
    assert.match(data.summary, /urgent local medical care/);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
  }
});

test("readiness reports only Gemini configuration", async () => {
  const data = await (
    await worker.fetch(new Request("https://saans.test/api/config"))
  ).json();
  assert.deepEqual(data, { aiConfigured: false });
});

test("rate-limit expiry does not evict a newer client early", () => {
  const allow = createLimiter({ limit: 1, windowMs: 100, maxEntries: 2 });
  assert(allow("first", 0));
  assert(allow("second", 50));
  assert(allow("third", 101));
  assert(!allow("second", 102));
  assert(allow("second", 151));
});

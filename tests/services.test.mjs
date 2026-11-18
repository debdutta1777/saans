import test from "node:test";
import assert from "node:assert/strict";
import { getAir, clearAirCache, parseAI, assist } from "../src/services.js";
import { validateProfile } from "../src/domain.js";
const now = Date.now();
const validAir = () =>
  Response.json({
    current: {
      us_aqi: 180,
      pm2_5: 70,
      pm10: 100,
      time: Math.floor(now / 1000),
    },
    hourly: { time: [Math.floor(now / 1000) + 3600], us_aqi: [170] },
  });
test("air fetch uses fixed provider, validates data, coalesces calls and caches", async () => {
  clearAirCache();
  let calls = 0;
  const fake = async (url) => {
    assert.equal(url.hostname, "air-quality-api.open-meteo.com");
    calls++;
    return validAir();
  };
  const [a, b] = await Promise.all([
    getAir("delhi", fake, now),
    getAir("delhi", fake, now),
  ]);
  assert.equal(a.aqi, 180);
  assert.equal(b.status, "live");
  await getAir("delhi", fake, now);
  assert.equal(calls, 1);
});
test("expired air cache triggers fresh request", async () => {
  clearAirCache();
  let calls = 0;
  const fake = async () => {
    calls++;
    return validAir();
  };
  await getAir("kolkata", fake, now);
  await getAir("kolkata", fake, now + 16 * 60000);
  assert.equal(calls, 2);
});
test("missing, stale, malformed and failed AQI are unavailable, never synthetic", async () => {
  for (const fake of [
    async () => {
      throw new Error("offline");
    },
    async () => Response.json({ current: { us_aqi: 100, time: 0 } }),
    async () => Response.json({ current: { us_aqi: "100", time: now / 1000 } }),
    async () => new Response("", { status: 500 }),
  ]) {
    clearAirCache();
    const result = await getAir("kolkata", fake, now);
    assert.equal(result.status, "unavailable");
    assert.equal(result.aqi, null);
  }
});
test("AI output must reference approved actions and bounded summary", () => {
  assert.deepEqual(
    parseAI('{"summary":"Try this","actionIds":["cook","cook"]}').actionIds,
    ["cook"],
  );
  for (const value of [
    "not json",
    '{"summary":"x","actionIds":["buy-ozone"]}',
    '{"summary":"x","actionIds":[]}',
    JSON.stringify({ summary: "x".repeat(2000), actionIds: ["cook"] }),
  ])
    assert.throws(() => parseAI(value));
});
const input = {
  profile: validateProfile({}),
  question: "Help with cooking",
  air: { aqi: 170, status: "live", scale: "US AQI" },
};
test("missing key makes zero provider calls and is honestly labelled", async () => {
  const answer = await assist(input, {}, () => {
    throw new Error("Must not call");
  });
  assert.equal(answer.reason, "not_configured");
  assert.equal(answer.mode, "guidance");
});
test("Gemini request keeps key in header, contains schema, validates success", async () => {
  const fake = async (url, options) => {
    assert(!url.includes("test-secret"));
    assert.equal(options.headers["x-goog-api-key"], "test-secret");
    assert.equal(options.redirect, "error");
    const payload = JSON.parse(options.body);
    assert(payload.generationConfig.responseSchema);
    assert(payload.systemInstruction.parts[0].text.includes("Never diagnose"));
    return Response.json({
      candidates: [
        {
          content: {
            parts: [
              {
                text: '{"summary":"A lower-smoke meal fits your routine.","actionIds":["cook"]}',
              },
            ],
          },
        },
      ],
    });
  };
  const answer = await assist(input, { GEMINI_API_KEY: "test-secret" }, fake);
  assert.equal(answer.mode, "gemini");
  assert.deepEqual(answer.actionIds, ["cook"]);
});
test("quota, malformed response and provider outages degrade without exposing secrets", async () => {
  for (const [fake, reason] of [
    [async () => new Response("", { status: 429 }), "rate_limited"],
    [async () => Response.json({ candidates: [] }), "provider_error"],
    [
      async () => {
        throw new Error("secret");
      },
      "provider_error",
    ],
  ]) {
    const answer = await assist(input, { GEMINI_API_KEY: "test-secret" }, fake);
    assert.equal(answer.reason, reason);
    assert.equal(answer.mode, "guidance");
    assert(!JSON.stringify(answer).includes("secret"));
  }
});
test("urgent symptoms bypass generation and give immediate escalation guidance", async () => {
  const answer = await assist(
    { ...input, question: "I have chest pain and cannot breathe" },
    { GEMINI_API_KEY: "test-secret" },
    () => {
      throw new Error("Must not call");
    },
  );
  assert.equal(answer.reason, "urgent_guidance");
  assert.match(answer.summary, /urgent local medical care/);
});
test("provider cannot prescribe buying filtration outside the chosen budget", async () => {
  const fake = async () =>
    Response.json({
      candidates: [
        {
          content: {
            parts: [
              {
                text: '{"summary":"Consider home changes.","actionIds":["filter","no-burn"]}',
              },
            ],
          },
        },
      ],
    });
  const answer = await assist(input, { GEMINI_API_KEY: "test-secret" }, fake);
  assert.deepEqual(answer.actionIds, ["no-burn"]);
});
test("unavailable provider results have a short negative cache", async () => {
  clearAirCache();
  let calls = 0;
  const fake = async () => {
    calls++;
    throw new Error("offline");
  };
  await getAir("mumbai", fake, now);
  await getAir("mumbai", fake, now + 1000);
  assert.equal(calls, 1);
  await getAir("mumbai", fake, now + 61000);
  assert.equal(calls, 2);
});

test("malformed optional forecasts preserve valid current AQI", async () => {
  const fake = async () =>
    Response.json({
      current: { us_aqi: 180, time: now / 1000, pm2_5: -10 },
      hourly: { time: [now / 1000 + 3600] },
    });
  const result = await getAir("patna", fake, now);
  assert.equal(result.status, "live");
  assert.equal(result.aqi, 180);
  assert.deepEqual(result.forecast, []);
  assert.equal(result.pm25, null);
});

test("cached reading expires at the three-hour source freshness boundary", async () => {
  let calls = 0;
  const fake = async () => {
    calls++;
    return Response.json({
      current: { us_aqi: 80, time: (now - 3 * 3600000 + 60000) / 1000 },
    });
  };
  assert.equal((await getAir("dhaka", fake, now)).status, "live");
  assert.equal(
    (await getAir("dhaka", fake, now + 120000)).status,
    "unavailable",
  );
  assert.equal(calls, 2);
});

test("empty or non-object model outputs are rejected", () => {
  for (const raw of ["null", "[]", '{"summary":"  ","actionIds":["cook"]}'])
    assert.throws(() => parseAI(raw));
});

test("unsupported cities are rejected outside of HTTP routes as well", async () => {
  await assert.rejects(
    () =>
      getAir(
        "unknown",
        () => {
          throw new Error("Must not call");
        },
        now,
      ),
    /Unknown city/,
  );
});

test("generated shared-cost action is removed for a free-only household", async () => {
  const fake = async () =>
    Response.json({
      candidates: [
        {
          content: {
            parts: [
              {
                text: '{"summary":"Try community steps.","actionIds":["shared-room","buddy"]}',
              },
            ],
          },
        },
      ],
    });
  const answer = await assist(
    { ...input, profile: { ...input.profile, budget: "free" } },
    { GEMINI_API_KEY: "test-secret" },
    fake,
  );
  assert.deepEqual(answer.actionIds, ["buddy"]);
});

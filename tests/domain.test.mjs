import test from "node:test";
import assert from "node:assert/strict";
import {
  category,
  validateProfile,
  recommend,
  calculateImpact,
  fallbackAnswer,
} from "../src/domain.js";
const profile = validateProfile({});
test("US AQI boundary values and unknown data never appear safe", () => {
  for (const [value, label] of [
    [0, "Good"],
    [50, "Good"],
    [51, "Moderate"],
    [100, "Moderate"],
    [101, "Unhealthy for sensitive groups"],
    [150, "Unhealthy for sensitive groups"],
    [151, "Unhealthy"],
    [200, "Unhealthy"],
    [201, "Very unhealthy"],
    [300, "Very unhealthy"],
    [301, "Hazardous"],
    [null, "Unavailable"],
    [NaN, "Unavailable"],
    [-1, "Unavailable"],
  ])
    assert.equal(category(value).label, label);
});
test("profile validation rejects unknown locations, injection-like enums and nonfinite values", () => {
  for (const bad of [
    { city: "__proto__" },
    { commute: "<script>" },
    { distance: Infinity },
    { distance: -1 },
    { distance: 201 },
    { budget: "expensive" },
    null,
    [],
  ])
    assert.throws(() => validateProfile(bad));
  assert.equal(profile.city, "kolkata");
});
test("smog plan avoids outdoor exercise and adapts to budget", () => {
  const actions = recommend(
    { ...profile, budget: "free", purifier: false },
    { aqi: 350 },
  );
  assert(actions.some((a) => a.id === "indoor-move"));
  assert(!actions.some((a) => a.id === "filter"));
  assert(actions.some((a) => a.id === "no-idling"));
  assert.equal(new Set(actions.map((a) => a.id)).size, actions.length);
});
test("unknown AQI uses precautionary guidance; owned purifier stays useful on free budget", () => {
  const actions = recommend(
    { ...profile, budget: "free", purifier: true },
    { aqi: null },
  );
  assert(actions.some((a) => a.id === "clean-room"));
  assert(actions.some((a) => a.id === "filter"));
});
test("sensitive household changes low-AQI plan", () => {
  assert(
    recommend({ ...profile, sensitive: true }, { aqi: 40 }).some(
      (a) => a.id === "indoor-move",
    ),
  );
});
test("transport scenario has transparent arithmetic and permits a worse alternative", () => {
  assert.equal(calculateImpact({ distance: 10, days: 5 }).kgCO2, 6);
  assert.equal(
    calculateImpact({ distance: 10, days: 5, households: 10 }).kgCO2,
    60,
  );
  assert.equal(calculateImpact({ distance: 0, days: 5 }).kgCO2, 0);
  assert(
    calculateImpact({ distance: 10, days: 5, alternative: 0.3 }).kgCO2 < 0,
  );
  assert.throws(() => calculateImpact({ distance: NaN, days: 5 }));
});
test("fallback answers are labelled and relevant to cooking", () => {
  const answer = fallbackAnswer("How should I cook?", profile, { aqi: null });
  assert.equal(answer.mode, "guidance");
  assert(answer.actionIds.includes("cook"));
});

test("free-only fallback excludes purchases and shared costs", () => {
  const free = { ...profile, budget: "free", purifier: false };
  for (const question of ["indoor purifier advice", "community school plan"]) {
    const { actionIds } = fallbackAnswer(question, free, { aqi: 400 });
    assert(actionIds.length);
    assert(!actionIds.includes("filter"));
    assert(!actionIds.includes("shared-room"));
  }
});

test("96 commute, budget, sensitivity and air combinations produce usable plans", () => {
  for (const commute of ["car", "transit", "walk", "remote"]) {
    for (const budget of ["free", "low", "flexible"]) {
      for (const sensitive of [false, true]) {
        for (const aqi of [null, 40, 150, 350]) {
          const actions = recommend(
            { ...profile, commute, budget, sensitive },
            { aqi },
          );
          assert(actions.length);
          assert.equal(
            new Set(actions.map((action) => action.id)).size,
            actions.length,
          );
          assert(actions.every((action) => action.detail && action.impact));
          if (budget === "free")
            assert(
              !actions.some((action) =>
                ["filter", "shared-room"].includes(action.id),
              ),
            );
        }
      }
    }
  }
});

test("corrupt browser storage is recoverable and progress expires at a new date", async () => {
  const { restoreState } = await import("../src/domain.js");
  for (const raw of [
    "null",
    "[]",
    "42",
    "{invalid",
    '{"profile":{"city":"unknown"}}',
  ]) {
    assert.deepEqual(restoreState(raw, "2026-11-18"), {
      profile,
      completed: [],
    });
  }
  const raw = JSON.stringify({
    profile,
    date: "2026-11-18",
    completed: ["cook", "cook", "fake"],
  });
  assert.deepEqual(restoreState(raw, "2026-11-18").completed, ["cook"]);
  assert.deepEqual(restoreState(raw, "2026-11-19").completed, []);
});

test("plan explanations distinguish owned equipment, unavailable AQI and good outdoor air", async () => {
  const { selectionReason } = await import("../src/domain.js");
  assert.match(
    selectionReason("filter", { ...profile, purifier: true }, { aqi: 200 }),
    /already owns/,
  );
  assert.match(
    selectionReason("clean-room", profile, { aqi: null }),
    /unavailable/,
  );
  assert.doesNotMatch(
    selectionReason("clean-room", profile, { aqi: 40 }),
    /elevated/,
  );
});

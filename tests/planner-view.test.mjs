import test from "node:test";
import assert from "node:assert/strict";
import { renderAnswer, renderChecklist } from "../dist/vercel/planner-view.js";
import { ACTION_BY_ID, validateProfile } from "../dist/vercel/domain.js";

const answer = {
  mode: "gemini",
  summary: "Open <windows> & doors?",
  actionIds: ["cook"],
};

test("generated text stays plain text and catalogue titles appear in the answer", () => {
  const html = renderAnswer(answer, "English");
  assert.match(html, /Generated with Gemini/);
  assert.match(html, /Open &lt;windows&gt; &amp; doors/);
  assert.ok(html.includes(ACTION_BY_ID.get("cook").title));
});

test("translated Gemini summaries carry the selected reading language", () => {
  for (const [language, tag] of [
    ["Hindi", "hi"],
    ["Bengali", "bn"],
  ]) {
    assert.ok(renderAnswer(answer, language).includes(`lang="${tag}"`));
  }
});

test("provider fallback keeps the English reading language and explains the failure", () => {
  const html = renderAnswer(
    { ...answer, mode: "guidance", reason: "rate_limited" },
    "Hindi",
  );
  assert.match(html, /AI not used/);
  assert.match(html, /quota/);
  assert.doesNotMatch(html, /lang="hi"/);
});

test("urgent guidance omits empty lists and task progress", () => {
  const html = renderAnswer(
    {
      mode: "guidance",
      reason: "urgent_guidance",
      summary: "Seek urgent care.",
      actionIds: [],
    },
    "English",
  );
  assert.match(html, /Seek urgent care/);
  assert.doesNotMatch(html, /<ul/);
  assert.doesNotMatch(
    renderChecklist([], new Set(), validateProfile({}), {}),
    /<progress|type="checkbox"/,
  );
});

test("progress counts only visible actions and each checkbox has a corresponding label", () => {
  const actions = ["cook", "clean-room"].map((id) => ACTION_BY_ID.get(id));
  const html = renderChecklist(
    actions,
    new Set(["cook", "buddy"]),
    validateProfile({}),
    { aqi: 150 },
  );
  assert.match(html, /1 \/ 2 done today/);
  assert.match(html, /value="1" max="2"/);
  for (const { id, title } of actions) {
    assert.ok(html.includes(`id="action-${id}"`));
    assert.ok(html.includes(`<label for="action-${id}">${title}</label>`));
  }
  assert.match(html, /data-action="cook" checked/);
  assert.doesNotMatch(html, /data-action="clean-room" checked/);
});

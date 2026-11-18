import { ACTION_BY_ID, selectionReason } from "./domain.js";

const entities = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
export function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) => entities[character],
  );
}

const fallbackReasons = {
  not_configured: "Gemini is not configured yet.",
  rate_limited: "Gemini’s quota was reached. The guide remains available.",
  urgent_guidance: "Urgent symptoms need medical care, not generated advice.",
  configuration: "The model configuration needs checking.",
  provider_error: "Gemini could not respond. Showing the practical guide.",
};

export function renderAnswer(answer, language) {
  if (!answer)
    return '<p class="empty">Your personalised response will appear here. You can use the daily checklist without AI.</p>';
  const generated = answer.mode === "gemini";
  const label = generated
    ? "Generated with Gemini · Review before acting"
    : "Source-backed guidance · AI not used";
  const reason = fallbackReasons[answer.reason];
  const lang = generated && { Hindi: "hi", Bengali: "bn" }[language];
  const items = answer.actionIds
    .map((id) => ACTION_BY_ID.get(id))
    .filter(Boolean)
    .map((action) => `<li>${action.title}</li>`)
    .join("");
  return `<div class="notice info">${label}${reason ? "<br>" + reason : ""}</div>
    <p class="chat-answer"${lang ? ` lang="${lang}"` : ""}>${escapeHTML(answer.summary)}</p>
    ${items ? `<ul class="result-list">${items}</ul>` : ""}`;
}

export function completedCount(actions, completed) {
  return actions.filter((action) => completed.has(action.id)).length;
}

function renderStep(action, checked, reason) {
  const id = `action-${action.id}`;
  return `<article class="plan-item${checked ? " done" : ""}">
    <input type="checkbox" id="${id}" data-action="${action.id}"${checked ? " checked" : ""}>
    <div>
      <h3><label for="${id}">${action.title}</label></h3>
      <p>${action.detail}</p>
      ${reason ? `<p><strong>Why this fits:</strong> ${escapeHTML(reason)}</p>` : ""}
      <p><strong>Why it helps:</strong> ${action.impact}</p>
      <span class="cost">${action.cost} · ${action.category}</span>
    </div></article>`;
}

export function renderChecklist(actions, completed, profile, air) {
  if (!actions.length)
    return '<div class="notice">The current question needs urgent medical attention. See the assistant response.</div>';
  const done = completedCount(actions, completed);
  const steps = actions.map((action) =>
    renderStep(
      action,
      completed.has(action.id),
      selectionReason(action.id, profile, air),
    ),
  );
  return `<div class="section-heading"><h2>Your manageable next steps</h2>
    <span class="completion-label" role="status">${done} / ${actions.length} done today</span></div>
    <progress class="progress" aria-label="Daily checklist completion" value="${done}" max="${actions.length}"></progress>
    <div class="plan-list">${steps.join("")}</div>`;
}

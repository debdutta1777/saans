import {
  CITIES,
  ACTIONS,
  SOURCES,
  category,
  validateProfile,
  recommend,
  calculateImpact,
  ACTION_BY_ID,
  selectionReason,
  restoreState,
} from "/domain.js";
const $ = (s) => document.querySelector(s);
const STORAGE = "saans-v1";
const defaults = {
  city: "kolkata",
  commute: "car",
  budget: "low",
  sensitive: false,
  purifier: false,
  distance: 10,
  language: "English",
};
const airTime = (timestamp) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: CITIES[profile.city].timeZone ?? "Asia/Kolkata",
  }).format(timestamp);
const todayKey = () => new Date().toLocaleDateString("en-CA");
let rawState;
try {
  rawState = localStorage.getItem(STORAGE);
} catch {
  /* Optional persistence. */
}
const restored = restoreState(rawState, todayKey());
let profile = restored.profile;
let completed = new Set(restored.completed);
let air = { status: "loading", aqi: null, forecast: [] },
  config = { aiConfigured: false },
  planIds = null,
  aiResult = null,
  airRequest = 0;
let communityDraft = "";
let pendingQuestion;
let activeDate = todayKey();
const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function persist() {
  try {
    localStorage.setItem(
      STORAGE,
      JSON.stringify({ profile, date: todayKey(), completed: [...completed] }),
    );
  } catch {
    toast("Browser storage is unavailable. Your changes last for this visit.");
  }
}
let toastTimer;
function toast(message) {
  $("#toast").textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").textContent = ""), 5000);
}
function currentPage() {
  const p = location.hash.slice(1);
  return ["today", "plan", "home", "community", "guide"].includes(p)
    ? p
    : "today";
}
function heading(eyebrow, title, description) {
  return `<div class="intro"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${description}</p></div><span class="date">${new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "long" }).format(new Date())}</span></div>`;
}
const ART = `<svg class="hero-art" viewBox="0 0 260 300" aria-hidden="true"><circle cx="140" cy="120" r="100" fill="#dce4cb"/><path d="M10 275Q110 230 260 270V300H10" fill="#c7d3b9"/><path d="M156 268V91" stroke="#6b8660" stroke-width="3"/><path d="M155 180Q83 180 84 119Q148 112 155 180M157 148Q226 150 226 91Q168 91 157 148M156 224Q215 224 220 171Q164 163 156 224" fill="#789467"/><path d="M155 122Q110 121 119 72Q161 81 155 122" fill="#a0b68a"/><path d="M125 239H188L177 288H136Z" fill="#b68567"/><path d="M35 238V169H84V238" fill="#f4f3e8"/><path d="M29 170L60 142L91 170" fill="#87967d"/><path d="M48 238V208H67V238" fill="#c1cdb6"/><rect x="44" y="180" width="12" height="13" rx="2" fill="#c1cdb6"/><rect x="66" y="180" width="10" height="13" rx="2" fill="#c1cdb6"/><path d="M16 98Q43 83 68 97M28 108Q48 98 66 105" stroke="#b7c4a9" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
function airCard() {
  const cat = category(air.aqi);
  return `<section class="card air-card" aria-label="Outdoor air quality"><div class="card-top"><span class="card-label">THE AIR IN ${escapeHTML(CITIES[profile.city].name.toUpperCase())}</span><button id="refresh-air" class="icon-button" aria-label="Refresh air quality">↻</button></div><div class="air-reading"><span class="air-number">${air.aqi === null ? "—" : Math.round(air.aqi)}</span><span class="badge">${air.status === "loading" ? "Checking…" : cat.label}</span></div><p class="air-caption muted">US AQI · Modelled outdoor air</p><div class="aqi-spectrum" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div><div class="air-bottom"><div>PM2.5<strong>${air.pm25 == null ? "—" : air.pm25.toFixed(1)} <small>µg/m³</small></strong></div><div>PM10<strong>${air.pm10 == null ? "—" : air.pm10.toFixed(1)} <small>µg/m³</small></strong></div><div>Source time<strong>${air.at ? airTime(air.at) : "—"}</strong></div></div><p class="source-note">Open-Meteo / CAMS · Regional estimate, not a street sensor.<br>US AQI is different from India’s National AQI.</p></section>`;
}
function airNotice() {
  if (air.status === "loading")
    return '<p class="notice info" role="status">Checking modelled air quality for your city…</p>';
  if (air.status === "unavailable")
    return '<p class="notice" role="status">Live air data is unavailable. We won’t guess an AQI or a safe outdoor window. Check your local pollution authority’s advisory; the precautionary guide still works.</p>';
  if (air.aqi > 100)
    return '<p class="notice">Pollution is elevated. Prioritise reducing exposure, particularly for sensitive household members. Lower-emission travel should not mean extra exertion outdoors in smog.</p>';
  return '<p class="notice info">Use local advisories alongside this regional estimate. Indoor air quality is not measured by this app.</p>';
}
function actionCard(a) {
  return `<article class="card action-card"><div class="action-icon" aria-hidden="true">${a.category === "routine" ? "↗" : a.category === "indoor" ? "⌂" : "♧"}</div><h3>${a.title}</h3><p>${a.detail}</p><span class="tag">${a.cost}</span><details><summary>Why this helps</summary><p>${a.impact}</p>${a.source ? `<a href="${SOURCES.find((s) => s.id === a.source).url}" target="_blank" rel="noopener noreferrer">Read the source ↗</a>` : "<p>Practical sustainability guidance; no measured local reduction claimed.</p>"}</details></article>`;
}
function renderToday() {
  const picks = recommend(profile, air).slice(0, 3);
  const assumed = calculateImpact({
    distance: profile.distance,
    days: 5,
  }).kgCO2;
  return (
    heading(
      "SMALL STEPS. CLEANER DAYS.",
      "A little more breathing room.",
      "Practical choices for your family. A lighter footprint for your city.",
    ) +
    `<div class="hero-grid"><section class="hero"><span class="badge">✧ YOUR DAY, WITH A LITTLE MORE CARE</span><h2>Better air starts<br>with a doable plan.</h2><p>Let’s find small changes that fit your home, your routine and your budget.</p><a class="primary" href="#plan">Build my daily plan <span aria-hidden="true">↗</span></a>${ART}</section>${airCard()}</div>${airNotice()}<div class="section-heading"><h2>A few good places to start</h2><a class="text-button" href="#home">Explore the home guide ↗</a></div><div class="three-grid">${picks.map(actionCard).join("")}</div><div class="bottom-grid"><section class="assistant-card"><span class="badge">✧ SAANS ASSISTANT</span><h2>A question about your everyday?</h2><p>Find practical guidance for school runs, cooking, commuting and life during smog season.</p><a class="secondary" href="#plan">Ask your clean-air companion ↗</a></section><section class="card impact-mini"><p class="eyebrow">SMALL CHANGES ADD UP</p><h2>What could a shared commute change?</h2><div class="impact-value">${assumed.toFixed(1)} <small>kg CO₂ / 5 days</small></div><p>Illustrative scenario for ${profile.distance} km/day, replacing a solo car journey. Not a measured saving.</p><a class="text-button" href="#community">Explore the assumptions →</a></section></div>`
  );
}
function activeActions() {
  return planIds
    ? planIds.map((id) => ACTION_BY_ID.get(id)).filter(Boolean)
    : recommend(profile, air);
}
function fitNote(action) {
  const reason = selectionReason(action.id, profile, air);
  return reason
    ? `<p><strong>Why this fits:</strong> ${escapeHTML(reason)}</p>`
    : "";
}
function checklist() {
  const actions = activeActions(),
    done = actions.filter((a) => completed.has(a.id)).length;
  if (!actions.length)
    return '<div class="notice">The current question needs urgent medical attention. See the assistant response.</div>';
  return `<div class="section-heading"><h2>Your manageable next steps</h2><span class="completion-label" role="status">${done} / ${actions.length} done today</span></div><progress class="progress" aria-label="Daily checklist completion" value="${done}" max="${actions.length}"></progress><div class="plan-list">${actions.map((a) => `<article class="plan-item ${completed.has(a.id) ? "done" : ""}"><input type="checkbox" id="action-${a.id}" data-action="${a.id}" ${completed.has(a.id) ? "checked" : ""}><div><h3><label for="action-${a.id}">${a.title}</label></h3><p>${a.detail}</p>${fitNote(a)}<p><strong>Why it helps:</strong> ${a.impact}</p><span class="cost">${a.cost} · ${a.category}</span></div></article>`).join("")}</div>`;
}
function resultHTML() {
  if (!aiResult)
    return '<p class="empty">Your personalised response will appear here. You can use the daily checklist without AI.</p>';
  return `<div class="notice info">${aiResult.mode === "gemini" ? "Generated with Gemini · Review before acting" : "Source-backed guidance · AI not used"}${aiResult.reason ? `<br>${{ not_configured: "Gemini is not configured yet.", rate_limited: "Gemini’s quota was reached. The guide remains available.", urgent_guidance: "Urgent symptoms need medical care, not generated advice.", configuration: "The model configuration needs checking.", provider_error: "Gemini could not respond. Showing the practical guide." }[aiResult.reason] || ""}` : ""}</div><p class="chat-answer" ${aiResult.mode === "gemini" && profile.language === "Hindi" ? 'lang="hi"' : aiResult.mode === "gemini" && profile.language === "Bengali" ? 'lang="bn"' : ""}>${escapeHTML(aiResult.summary)}</p><ul class="result-list">${aiResult.actionIds.map((id) => `<li>${ACTION_BY_ID.get(id)?.title || ""}</li>`).join("")}</ul>`;
}
function renderPlan() {
  return (
    heading(
      "YOUR HOUSEHOLD, YOUR ROUTINE",
      "Make today a little lighter.",
      "A realistic checklist, shaped around what you can actually do.",
    ) +
    `<div class="inline-actions"><button class="secondary" id="plan-profile">Edit household preferences</button><button class="secondary" id="download-plan">Export my plan ↓</button><button class="text-button" id="reset-plan">Reset today’s checklist</button></div>${airNotice()}<div class="plan-layout"><section id="checklist">${checklist()}</section><section class="card"><p class="eyebrow">✧ ASK SAANS</p><h2>Let’s work around your life.</h2><p class="small muted">${escapeHTML(CITIES[profile.city].name)} · ${profile.budget === "free" ? "Free changes" : profile.budget === "low" ? "Low-cost changes" : "Flexible budget"} · ${profile.sensitive ? "Sensitive household" : "General guidance"}</p><form id="chat-form" class="chat-form"><label for="question">What would you like help with?</label><textarea id="question" name="question" maxlength="800" minlength="3" required placeholder="How can I reduce pollution at home without buying a purifier?"></textarea><div class="suggestions"><button type="button" class="chip" data-question="How can I make my school pickup routine lower-emission and reduce roadside exposure?">School runs</button><button type="button" class="chip" data-question="How can I reduce cooking pollution on a small budget?">Cooking & air</button><button type="button" class="chip" data-question="Help me plan a lower-emission commute without more outdoor exertion during smog.">My commute</button></div><label class="check-label"><input id="ai-consent" type="checkbox" ${config.aiConfigured ? "" : "disabled"}> Use Gemini: send this question, city, household preferences and outdoor AQI to Google. Do not include private or medical details.</label><button class="primary" id="ask-submit" type="submit">Get tailored guidance <span aria-hidden="true">↗</span></button><p class="source-note">${config.aiConfigured ? "Gemini configured. Availability depends on provider quota." : "Gemini is not configured. The source-backed guide works now; see How it works for secure setup."}</p></form><div id="answer" tabindex="-1" aria-label="Assistant response" role="region" aria-live="polite">${resultHTML()}</div><p class="emergency">For severe breathlessness, chest pain or a medical emergency, seek urgent local medical care. Saans does not diagnose or replace a clinician’s advice.</p></section></div><section class="card forecast-card"><h2>Upcoming outdoor conditions</h2><p class="small muted">Modelled US AQI. Lower does not necessarily mean safe. Times are local to ${escapeHTML(CITIES[profile.city].name)}.</p><div class="forecast">${
      air.forecast?.length
        ? air.forecast
            .slice(0, 8)
            .map(
              (x) =>
                `<div class="forecast-item">${airTime(x.time)}<strong>${Math.round(x.aqi)}</strong></div>`,
            )
            .join("")
        : '<p class="empty">Forecast unavailable. No outdoor activity window is being recommended.</p>'
    }</div></section>`
  );
}
function renderHome() {
  return (
    heading(
      "A CLEANER HOME",
      "Start with the air indoors.",
      "Simple source control first. Thoughtful filtration next. No miracle fixes.",
    ) +
    `<div class="notice info">Houseplants, steam and fragrances are not substitutes for particle filtration. Outdoor AQI cannot tell us your indoor AQI.</div><div class="three-grid">${ACTIONS.filter(
      (a) => a.category === "indoor",
    )
      .map(actionCard)
      .join(
        "",
      )}</div><section class="card calculator"><h2>Size a cleaner-air room</h2><p class="small muted">EPA’s smoke CADR rule of thumb: at least two-thirds of room area in square feet. This is a starting point for typical rooms; follow manufacturer guidance for ceiling height and use.</p><label for="room-area">Room area (square feet)</label><input id="room-area" type="number" value="150" min="20" max="2000"><p id="room-result" class="notice info" aria-live="polite">For 150 ft², look for a smoke CADR of at least 100 cfm (about 170 m³/h).</p><a class="text-button" href="https://www.epa.gov/wildfires/indoor-air-filtration" target="_blank" rel="noopener noreferrer">Read EPA’s filtration guide ↗</a></section>`
  );
}
function renderCommunity() {
  return (
    heading(
      "THE AIR WE SHARE",
      "Small shifts. Shared skies.",
      "Turn individual choices into a practical neighbourhood conversation.",
    ) +
    `<div class="three-grid">${ACTIONS.filter((a) => a.category === "community")
      .map(actionCard)
      .join(
        "",
      )}</div><div class="two-grid calculator"><section class="card"><p class="eyebrow">UNDERSTAND YOUR IMPACT</p><h2>What if we shared the journey?</h2><p class="small muted">Compare a travel scenario. Values below are editable illustrative assumptions, not verified city-specific emission factors.</p><form id="impact-form"><div class="form-grid"><label>Return distance / day (km)<input name="distance" type="number" min="0" max="200" step="any" value="${profile.distance}" required></label><label>Travel days<input name="days" type="number" min="0" max="31" value="5" required></label><label>Baseline kg CO₂ / passenger-km<input name="baseline" type="number" min="0" max="2" step="0.001" value="0.17" required></label><label>Alternative kg CO₂ / passenger-km<input name="alternative" type="number" min="0" max="2" step="0.001" value="0.05" required></label><label>Participating households<input name="households" type="number" min="1" max="1000" value="1" required></label></div></form><div class="calculator-result" id="impact-result" aria-live="polite"></div><details class="guide-copy"><summary>Show formula & limitations</summary><p>Distance × days × (baseline factor − alternative factor) × households. Each household represents one traveller making the stated trip. Account for occupancy in your factors.</p><p>This estimates operational CO₂ only. It excludes vehicle manufacture, infrastructure and local PM2.5 dispersion. It does not predict a percentage AQI improvement or health benefit. Negative results mean the alternative emits more under your assumptions.</p></details></section><section class="card"><p class="eyebrow">MAKE IT A SHARED HABIT</p><h2>A note for your community.</h2><label>Choose an initiative<select id="initiative"><option value="no-idling">No-idling pickup area</option><option value="buddy">Neighbour errand buddy</option><option value="shared-room">Shared cleaner-air space</option></select></label><p class="small muted">A draft you can adapt and share yourself. Nothing is posted or sent automatically.</p><div id="community-note" class="community-letter" aria-live="polite"></div><button class="secondary" id="download-note">Download community note ↓</button></section></div>`
  );
}
function renderGuide() {
  return (
    heading(
      "CLEAR GUIDANCE. CLEAR LIMITS.",
      "Trust starts with transparency.",
      "Know where the advice comes from, what we calculate, and what stays private.",
    ) +
    `<div class="two-grid"><section class="card guide-copy"><h2>How your plan is made</h2><p><strong>1. Context.</strong> Your selected city, travel routine, budget and household needs guide the plan.</p><p><strong>2. Grounding.</strong> A curated catalogue links practical exposure advice to EPA and AirNow sources. The particle-control principles are relevant to urban smog; follow local authorities for local restrictions.</p><p><strong>3. Generation.</strong> When you opt in and Gemini is configured, the model explains and selects catalogue actions. The server validates its output. AI summaries may still make mistakes.</p><p><strong>4. Action.</strong> Your daily checklist records actions on this device. Tick marks are not verified emissions savings.</p><h3>Air-quality honesty</h3><p>Open-Meteo supplies CAMS regional model output. It is not a nearby monitoring station. The app uses the <strong>US AQI scale</strong>, not India’s AQI. Current data older than three hours is rejected, and data is cached for up to 15 minutes. No synthetic readings are shown.</p><h3>US AQI categories</h3><p>0–50 Good · 51–100 Moderate · 101–150 Unhealthy for sensitive groups · 151–200 Unhealthy · 201–300 Very unhealthy · 301+ Hazardous.</p><h3>Sources</h3><div class="source-list">${SOURCES.map((s) => `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.name} ↗</a>`).join("")}</div></section><section class="card guide-copy"><h2>Your privacy, by design</h2><p>Preferences and checklist progress live in this browser’s local storage. There are no advertising trackers, public profiles or community activity counters.</p><p>The air-data request sends city coordinates to Open-Meteo. Gemini receives your question and minimal household context only when you opt in. Google’s data terms and free-tier policies apply. Avoid names, precise addresses and medical histories.</p><p>Our app code does not log questions or API keys. Hosting and API providers may retain request metadata under their policies.</p><button class="secondary" id="guide-erase">Clear local preferences & progress</button><h3>Secure Gemini configuration</h3><p>Current status: <strong>${config.aiConfigured ? "Configured on the server" : "Awaiting your server-side key"}</strong>.</p><p>For the downloaded source: copy <code>.env.example</code> to <code>.env.local</code>, then paste your key after <code>GEMINI_API_KEY=</code> in your own code editor. Start with <code>npm start</code>. This ignored file must never be committed.</p><p>For a hosted Node deployment, put <code>GEMINI_API_KEY</code> in the host’s private environment-variable settings and restart. Do not use a public/client-prefixed variable.</p><p>The application intentionally has no browser field for storing API keys. See <code>docs/SETUP.md</code> for deployment and key verification.</p><a class="text-button" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Open Google AI Studio ↗</a><h3>Built for accessible use</h3><p>Keyboard navigation, visible focus, semantic labels, text AQI categories, readable contrast, reduced-motion support and a printable/exportable plan. Hindi and Bengali apply to Gemini summaries; the interface and catalogue remain English.</p></section></div>`
  );
}
function render() {
  if (activeDate !== todayKey()) {
    activeDate = todayKey();
    completed.clear();
    persist();
  }
  const draft = $("#question")?.value;
  const consent = $("#ai-consent")?.checked;
  const focused = document.activeElement?.id;
  const page = currentPage();
  document.querySelectorAll("[data-page]").forEach((a) => {
    a.classList.toggle("active", a.dataset.page === page);
    if (a.dataset.page === page) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  $("#main").innerHTML = {
    today: renderToday,
    plan: renderPlan,
    home: renderHome,
    community: renderCommunity,
    guide: renderGuide,
  }[page]();
  bindPage();
  if ($("#question") && draft !== undefined) $("#question").value = draft;
  if ($("#ai-consent") && consent && config.aiConfigured)
    $("#ai-consent").checked = true;
  updateQuestionStatus();
  if (focused && document.activeElement === document.body) {
    document.getElementById(focused)?.focus({ preventScroll: true });
  }
}
async function loadAir() {
  const seq = ++airRequest;
  air = { status: "loading", aqi: null, forecast: [] };
  render();
  try {
    const response = await fetch("/api/air?city=" + profile.city);
    if (!response.ok) throw new Error("Unavailable");
    const data = await response.json();
    if (seq !== airRequest) return;
    air = data;
  } catch {
    if (seq !== airRequest) return;
    air = { status: "unavailable", aqi: null, forecast: [] };
  }
  if (["today", "plan"].includes(currentPage())) render();
}
function openProfile() {
  const form = $("#profile-form");
  for (const key of ["commute", "distance", "budget", "language"])
    form.elements[key].value = profile[key];
  for (const key of ["sensitive", "purifier"])
    form.elements[key].checked = profile[key];
  $("#profile-dialog").showModal();
}
function download(name, text) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(
    new Blob([text], { type: "text/plain;charset=utf-8" }),
  );
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  toast("Download prepared.");
}
function clearData() {
  try {
    localStorage.removeItem(STORAGE);
  } catch {}
  profile = { ...defaults };
  completed.clear();
  clearAnswer();
  $("#city").value = profile.city;
  $("#profile-dialog").close();
  loadAir();
  toast("Saved preferences and progress cleared.");
}
function updateImpact() {
  const form = $("#impact-form");
  if (!form) return;
  try {
    const values = Object.fromEntries(
      [...new FormData(form)].map(([k, v]) => [k, Number(v)]),
    );
    if (!form.checkValidity()) throw new Error("Check the input ranges.");
    const result = calculateImpact(values);
    $("#impact-result").innerHTML =
      `<strong>${Math.abs(result.kgCO2).toFixed(2)}</strong> kg CO₂ ${result.kgCO2 >= 0 ? "potentially avoided" : "additional emissions"}<p class="small">Across ${result.kilometres} passenger-km in this scenario. Estimate, not a measured result.</p>`;
  } catch {
    $("#impact-result").textContent =
      "Enter valid numbers within the displayed ranges.";
  }
}
function updateNote() {
  const id = $("#initiative").value,
    a = ACTION_BY_ID.get(id);
  communityDraft = `A small clean-air initiative for our neighbourhood in ${CITIES[profile.city].name}\n\nLet’s try: ${a.title.toLowerCase()}.\n\n${a.detail}\n\nWhy it matters: ${a.impact}\n\nBefore we start: agree on an organiser, accessible arrangements, a practical time and permission where needed. Check the local air-quality advisory.\n\nNo measured pollution reduction is promised. Let’s review what worked after one week.\n\nPrepared with Saans · ${new Date().toLocaleDateString("en-IN")}`;
  $("#community-note").textContent = communityDraft;
}
function bindPage() {
  $("#refresh-air")?.addEventListener("click", loadAir);
  $("#plan-profile")?.addEventListener("click", openProfile);
  $("#reset-plan")?.addEventListener("click", () => {
    completed.clear();
    clearAnswer();
    persist();
    render();
    toast("Checklist reset.");
  });
  bindChecklist();
  document.querySelectorAll("[data-question]").forEach((button) =>
    button.addEventListener("click", () => {
      $("#question").value = button.dataset.question;
      $("#question").focus();
    }),
  );
  $("#chat-form")?.addEventListener("submit", ask);
  $("#download-plan")?.addEventListener("click", () =>
    download(
      "saans-daily-plan.txt",
      `SAANS DAILY PLAN · ${CITIES[profile.city].name}\n${new Date().toLocaleDateString("en-IN")}\nAir: ${air.aqi ?? "Unavailable"} US AQI (CAMS model)\n\n` +
        activeActions()
          .map(
            (a) =>
              `${completed.has(a.id) ? "[x]" : "[ ]"} ${a.title}\n${a.detail}\nWhy: ${a.impact}\n`,
          )
          .join("\n") +
        "\nSources:\n" +
        SOURCES.map((s) => s.url).join("\n") +
        "\nGeneral guidance, not medical advice.",
    ),
  );
  $("#room-area")?.addEventListener("input", (event) => {
    const area = Number(event.target.value);
    $("#room-result").textContent =
      area >= 20 && area <= 2000
        ? `For ${area} ft², look for a smoke CADR of at least ${Math.ceil((area * 2) / 3)} cfm (about ${Math.ceil(((area * 2) / 3) * 1.699)} m³/h).`
        : "Enter a room area between 20 and 2,000 ft².";
  });
  $("#impact-form")?.addEventListener("input", updateImpact);
  updateImpact();
  $("#initiative")?.addEventListener("change", updateNote);
  if ($("#initiative")) updateNote();
  $("#download-note")?.addEventListener("click", () =>
    download("saans-community-note.txt", communityDraft),
  );
  $("#guide-erase")?.addEventListener("click", clearData);
}
function bindChecklist() {
  document.querySelectorAll("[data-action]").forEach((input) =>
    input.addEventListener("change", () => {
      input.checked
        ? completed.add(input.dataset.action)
        : completed.delete(input.dataset.action);
      persist();
      input.closest(".plan-item").classList.toggle("done", input.checked);
      const actions = activeActions();
      const done = actions.filter((action) => completed.has(action.id)).length;
      $(".completion-label").textContent =
        `${done} / ${actions.length} done today`;
      $(".progress").value = done;
    }),
  );
}
function clearAnswer() {
  pendingQuestion?.abort();
  pendingQuestion = undefined;
  planIds = null;
  aiResult = null;
}
function updateQuestionStatus() {
  const button = $("#ask-submit");
  if (!button) return;
  button.setAttribute("aria-disabled", Boolean(pendingQuestion));
  button.textContent = pendingQuestion
    ? "Preparing your guidance…"
    : "Get tailored guidance";
  if (pendingQuestion) $("#answer").textContent = "Working on your question…";
}
async function ask(event) {
  event.preventDefault();
  const question = $("#question").value.trim();
  if (question.length < 3 || pendingQuestion) return;
  const controller = new AbortController();
  pendingQuestion = controller;
  updateQuestionStatus();
  try {
    const response = await fetch("/api/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        profile,
        question,
        useAI: $("#ai-consent").checked,
      }),
    });
    const data = await response.json();
    if (controller.signal.aborted) return;
    if (!response.ok) throw new Error(data.error || "Please try again.");
    pendingQuestion = undefined;
    aiResult = data;
    planIds = data.actionIds;
    if (currentPage() === "plan") {
      const fromSubmit = document.activeElement?.id === "ask-submit";
      const checklistRegion = $("#checklist");
      const fromChecklist = checklistRegion.contains(document.activeElement);
      checklistRegion.innerHTML = checklist();
      bindChecklist();
      $("#answer").innerHTML = resultHTML();
      if (fromSubmit || fromChecklist) $("#answer").focus();
    }
    toast(
      data.mode === "gemini"
        ? "Your Gemini plan is ready."
        : "Your source-backed plan is ready.",
    );
  } catch (error) {
    if (!controller.signal.aborted && $("#answer")) {
      $("#answer").textContent =
        error.message || "Connection unavailable. Try again.";
    }
  } finally {
    if (pendingQuestion === controller) pendingQuestion = undefined;
    updateQuestionStatus();
  }
}
$("#city").innerHTML = Object.entries(CITIES)
  .map(([id, c]) => `<option value="${id}">${c.name}</option>`)
  .join("");
$("#city").value = profile.city;
$("#city").addEventListener("change", () => {
  profile.city = $("#city").value;
  clearAnswer();
  persist();
  loadAir();
});
$("#settings").addEventListener("click", openProfile);
$("#edit-profile").addEventListener("click", openProfile);
$("#close-profile").addEventListener("click", () =>
  $("#profile-dialog").close(),
);
$("#erase").addEventListener("click", clearData);
$("#profile-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.target);
  try {
    profile = validateProfile({
      ...profile,
      ...Object.fromEntries(data),
      sensitive: data.has("sensitive"),
      purifier: data.has("purifier"),
    });
    persist();
    clearAnswer();
    $("#profile-dialog").close();
    render();
    toast("Household preferences updated.");
  } catch (error) {
    toast(error.message);
  }
});
$(".skip").addEventListener("click", (event) => {
  event.preventDefault();
  $("#main").focus();
  $("#main").scrollIntoView();
});
window.addEventListener("hashchange", () => {
  render();
  $("#main").focus();
  window.scrollTo(0, 0);
});
fetch("/api/config")
  .then((r) => {
    if (!r.ok) throw new Error("Configuration unavailable");
    return r.json();
  })
  .then((data) => {
    config = data;
    if (["plan", "guide"].includes(currentPage())) render();
  })
  .catch(() =>
    toast("Configuration unavailable. The local guide still works."),
  );
loadAir();

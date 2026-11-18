/** Pure, deterministic domain rules. US AQI is deliberately never called India AQI. */
export const CITIES = {
  kolkata: { name: "Kolkata", lat: 22.5726, lon: 88.3639 },
  delhi: { name: "New Delhi", lat: 28.6139, lon: 77.209 },
  mumbai: { name: "Mumbai", lat: 19.076, lon: 72.8777 },
  bengaluru: { name: "Bengaluru", lat: 12.9716, lon: 77.5946 },
  lucknow: { name: "Lucknow", lat: 26.8467, lon: 80.9462 },
  patna: { name: "Patna", lat: 25.5941, lon: 85.1376 },
  lahore: { name: "Lahore", lat: 31.5204, lon: 74.3587 },
  dhaka: { name: "Dhaka", lat: 23.8103, lon: 90.4125 },
};
export const SOURCES = [
  {
    id: "epa-room",
    name: "EPA · Create a cleaner-air room",
    url: "https://www.epa.gov/wildfires/how-create-cleaner-air-room-home",
  },
  {
    id: "epa-filter",
    name: "EPA · Indoor air filtration",
    url: "https://www.epa.gov/wildfires/indoor-air-filtration",
  },
  {
    id: "airnow",
    name: "AirNow · AQI basics",
    url: "https://www.airnow.gov/aqi/aqi-basics/",
  },
  {
    id: "cams",
    name: "Open-Meteo / CAMS · Modelled air quality",
    url: "https://open-meteo.com/en/docs/air-quality-api",
  },
];
export const ACTIONS = [
  {
    id: "indoor-move",
    category: "routine",
    title: "Move your workout indoors",
    detail:
      "On polluted days, choose gentle movement in the cleanest available indoor space. Avoid busy roads and strenuous outdoor exercise.",
    impact:
      "Less time breathing heavily in polluted outdoor air can reduce exposure. Indoor air must also be kept clean.",
    cost: "Free",
    source: "airnow",
  },
  {
    id: "transit",
    category: "routine",
    title: "Make one trip a shared trip",
    detail:
      "If practical, use metro or bus, or share a car. Choose the route with the least roadside waiting; do not replace the trip with cycling in heavy smog.",
    impact:
      "Sharing motorised travel can reduce emissions per passenger. Route, occupancy and vehicle type change the benefit.",
    cost: "Variable",
    source: null,
  },
  {
    id: "remote",
    category: "routine",
    title: "Skip one unnecessary journey",
    detail:
      "Work remotely when possible, combine essential errands, or coordinate one household shopping trip.",
    impact:
      "An avoided vehicle trip removes that trip’s exhaust emissions and reduces time in traffic.",
    cost: "Free",
    source: null,
  },
  {
    id: "clean-room",
    category: "indoor",
    title: "Create a cleaner-air corner",
    detail:
      "Choose a room where your household spends time. During outdoor smoke episodes, limit entry of polluted air, keep exits clear and maintain a safe temperature. Ventilate when outdoor conditions improve.",
    impact:
      "Reducing outdoor particle entry helps; closing windows alone does not remove particles or indoor gases.",
    cost: "Free",
    source: "epa-room",
  },
  {
    id: "filter",
    category: "indoor",
    title: "Run a correctly sized particle filter",
    detail:
      "Use a mechanical HEPA air cleaner with a suitable smoke CADR for your room. Keep airflow unobstructed and maintain filters. Avoid ozone generators and ionizers.",
    impact:
      "Mechanical filtration captures airborne particles. It does not remove every gas and cannot guarantee a specific indoor AQI.",
    cost: "Investment",
    source: "epa-filter",
  },
  {
    id: "damp-clean",
    category: "indoor",
    title: "Damp-wipe instead of dry sweeping",
    detail:
      "Use a damp cloth or mop for settled dust. Avoid raising dust with dry sweeping; use a HEPA-filter vacuum if available.",
    impact:
      "Traps settled dust instead of resuspending it. This complements filtration; it does not replace it.",
    cost: "Low cost",
    source: "epa-room",
  },
  {
    id: "no-burn",
    category: "indoor",
    title: "Keep indoor air smoke-free",
    detail:
      "Skip incense, candles, smoking and waste burning. Choose a non-burning ritual or electric light instead.",
    impact:
      "Removing a combustion source prevents additional particles from being released indoors.",
    cost: "Free",
    source: "epa-room",
  },
  {
    id: "cook",
    category: "indoor",
    title: "Choose a lower-smoke meal",
    detail:
      "Use lower-heat cooking and avoid charring or deep-frying. Use a kitchen hood that vents outdoors. Never use an outdoor stove or generator indoors.",
    impact:
      "Source control reduces cooking pollution. A closed home still needs safe management of combustion gases.",
    cost: "Free",
    source: "epa-room",
  },
  {
    id: "buddy",
    category: "community",
    title: "Check in on a neighbour",
    detail:
      "Offer an older neighbour or someone with limited mobility help with essential errands. Share official advisories, not unverified AQI screenshots.",
    impact:
      "Combining errands can avoid duplicate trips and help people reduce unnecessary exposure.",
    cost: "Free",
    source: null,
  },
  {
    id: "no-idling",
    category: "community",
    title: "Start a no-idling pickup routine",
    detail:
      "Ask your housing society or school to encourage drivers to switch off safely while parked. Keep pickup queues away from entrances.",
    impact:
      "Less unnecessary engine running means less exhaust at the places people wait.",
    cost: "Free",
    source: null,
  },
  {
    id: "shared-room",
    category: "community",
    title: "Plan a shared cleaner-air space",
    detail:
      "Ask your community centre to identify an accessible room with appropriate filtration, capacity and safe ventilation. Confirm permission and availability before inviting others.",
    impact:
      "Shared filtration can make cleaner indoor air more accessible without every household buying equipment.",
    cost: "Shared cost",
    source: "epa-room",
  },
];
export const ACTION_BY_ID = new Map(
  ACTIONS.map((action) => [action.id, action]),
);

/** Apply the same budget constraints to every recommendation source. */
export function eligibleActionIds(ids, profile) {
  return [...new Set(ids)].filter((id) => {
    if (!ACTION_BY_ID.has(id)) return false;
    if (id === "filter")
      return profile.purifier || profile.budget === "flexible";
    if (id === "shared-room") return profile.budget !== "free";
    return true;
  });
}

export function selectionReason(id, profile, air) {
  if (id === "filter")
    return profile.purifier
      ? "Uses the purifier your household already owns."
      : "Your budget allows an investment in filtration.";
  if (id === "transit" && profile.commute === "car")
    return `An alternative to your ${profile.distance} km daily return trip by car.`;
  if (id === "remote")
    return profile.commute === "remote"
      ? "Builds on your existing mostly-at-home routine."
      : "An option when work or errands allow you to skip a trip.";
  if (id === "indoor-move" || id === "clean-room") {
    if (air?.status === "loading")
      return "A precaution while we check your city’s air data.";
    if (!Number.isFinite(air?.aqi))
      return `A precaution while air data for ${CITIES[profile.city].name} is unavailable.`;
    if (profile.sensitive)
      return "Prioritises sensitive household members, as requested.";
    if (air.aqi > 100)
      return `Modelled US AQI is elevated in ${CITIES[profile.city].name}.`;
    return "An indoor option to keep ready for higher pollution days.";
  }
  if (id === "shared-room")
    return "Lets households share the cost of air filtration.";
  if (id === "no-idling" || id === "buddy")
    return "A community action that requires no new equipment.";
  return null;
}

export function restoreState(raw, date) {
  const defaults = { profile: validateProfile({}), completed: [] };
  try {
    const saved = JSON.parse(raw || "{}");
    if (!saved || typeof saved !== "object" || Array.isArray(saved))
      return defaults;
    const profile = validateProfile(saved.profile ?? {});
    const completed =
      saved.date === date && Array.isArray(saved.completed)
        ? [...new Set(saved.completed.filter((id) => ACTION_BY_ID.has(id)))]
        : [];
    return { profile, completed };
  } catch {
    return defaults;
  }
}

export function isUrgentQuestion(question) {
  return /chest pain|can.?t breathe|cannot breathe|severe breathlessness/i.test(
    question,
  );
}

export function category(aqi) {
  if (!Number.isFinite(aqi) || aqi < 0)
    return { label: "Unavailable", tone: "neutral" };
  if (aqi <= 50) return { label: "Good", tone: "good" };
  if (aqi <= 100) return { label: "Moderate", tone: "moderate" };
  if (aqi <= 150)
    return { label: "Unhealthy for sensitive groups", tone: "sensitive" };
  if (aqi <= 200) return { label: "Unhealthy", tone: "unhealthy" };
  if (aqi <= 300) return { label: "Very unhealthy", tone: "very" };
  return { label: "Hazardous", tone: "hazardous" };
}
export function validateProfile(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("A household profile is required.");
  const oneOf = (key, values, fallback) => {
    const value = input[key] ?? fallback;
    if (!values.includes(value)) throw new Error(`Invalid ${key}.`);
    return value;
  };
  const distance = Number(input.distance ?? 10);
  if (!Number.isFinite(distance) || distance < 0 || distance > 200)
    throw new Error("Daily distance must be 0–200 km.");
  return {
    city: oneOf("city", Object.keys(CITIES), "kolkata"),
    commute: oneOf("commute", ["car", "transit", "walk", "remote"], "car"),
    budget: oneOf("budget", ["free", "low", "flexible"], "low"),
    sensitive: input.sensitive === true,
    purifier: input.purifier === true,
    distance,
    language: oneOf("language", ["English", "Hindi", "Bengali"], "English"),
  };
}
export function recommend(profile, air) {
  const ids = ["no-burn", "damp-clean", "cook"];
  if (!Number.isFinite(air?.aqi) || air.aqi > 100 || profile.sensitive)
    ids.unshift("indoor-move", "clean-room");
  if (profile.commute === "car") ids.push("transit", "remote");
  else if (profile.commute === "remote") ids.push("remote");
  else ids.push("no-idling");
  if (profile.purifier || profile.budget === "flexible") ids.push("filter");
  else ids.push(profile.budget === "free" ? "no-idling" : "shared-room");
  ids.push("buddy");
  return eligibleActionIds(ids, profile).map((id) => ACTION_BY_ID.get(id));
}
/** Scenario estimate, not a measured saving. Factors are editable illustrative assumptions. */
export function calculateImpact({
  distance,
  days,
  baseline = 0.17,
  alternative = 0.05,
  households = 1,
}) {
  for (const [k, v, max] of [
    ["distance", distance, 200],
    ["days", days, 31],
    ["baseline", baseline, 2],
    ["alternative", alternative, 2],
    ["households", households, 1000],
  ]) {
    if (!Number.isFinite(v) || v < 0 || v > max)
      throw new Error(`Invalid ${k}.`);
  }
  return {
    kgCO2: Number(
      (distance * days * (baseline - alternative) * households).toFixed(2),
    ),
    kilometres: distance * days * households,
  };
}
export function fallbackAnswer(question, profile, air) {
  const q = question.toLowerCase();
  if (isUrgentQuestion(q))
    return {
      mode: "guidance",
      summary:
        "Seek urgent local medical care for severe breathlessness, chest pain or trouble breathing. Do not wait for an app response. Saans cannot assess or treat symptoms.",
      actionIds: [],
    };
  const ids = /cook|kitchen|meal/.test(q)
    ? ["cook", "no-burn"]
    : /school|neigh|community/.test(q)
      ? ["no-idling", "buddy", "shared-room"]
      : /filter|purif|indoor|window/.test(q)
        ? ["clean-room", "filter", "damp-clean"]
        : recommend(profile, air)
            .slice(0, 3)
            .map((a) => a.id);
  return {
    mode: "guidance",
    summary:
      "Here are relevant actions from the evidence-based guide. This response uses rule-based guidance, not AI generation.",
    actionIds: eligibleActionIds(ids, profile),
  };
}

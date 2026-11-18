import {
  CITIES,
  validateProfile,
  isUrgentQuestion,
  fallbackAnswer,
} from "./domain.js";
import { getAir, assist } from "./services.js";
import { jsonResponse, readJSON, createLimiter } from "./security.js";
const allowAI = createLimiter();
const allowAir = createLimiter({ limit: 90 });

export async function handleApi(request, env, client = "local") {
  const url = new URL(request.url);
  const path = url.pathname;
  if (request.method === "GET" && path === "/api/config")
    return jsonResponse({
      aiConfigured: Boolean(env.GEMINI_API_KEY),
    });
  if (request.method === "GET" && path === "/api/air") {
    if (!allowAir(client))
      return jsonResponse({ error: "Please wait before refreshing." }, 429, {
        "Retry-After": "60",
      });
    const city = url.searchParams.get("city");
    if (!Object.hasOwn(CITIES, city))
      return jsonResponse({ error: "Choose a supported city." }, 400);
    return jsonResponse(await getAir(city));
  }
  if (request.method === "POST" && path === "/api/assist") {
    const origin = request.headers.get("origin");
    if (origin && origin !== (env.APP_ORIGIN || url.origin))
      return jsonResponse(
        { error: "Cross-origin requests are not allowed." },
        403,
      );
    if (request.headers.get("sec-fetch-site") === "cross-site")
      return jsonResponse(
        { error: "Cross-site requests are not allowed." },
        403,
      );
    if (!allowAI(client))
      return jsonResponse(
        { error: "Too many requests. Please try again in one minute." },
        429,
        { "Retry-After": "60" },
      );
    try {
      const body = await readJSON(request),
        profile = validateProfile(body.profile);
      if (
        typeof body.question !== "string" ||
        body.question.trim().length < 3 ||
        body.question.length > 800
      )
        return jsonResponse(
          { error: "Enter a question of 3–800 characters." },
          400,
        );
      if (isUrgentQuestion(body.question)) {
        return jsonResponse({
          ...fallbackAnswer(body.question, profile),
          reason: "urgent_guidance",
        });
      }
      const air = await getAir(profile.city);
      if (body.useAI !== true) {
        return jsonResponse({
          ...fallbackAnswer(body.question, profile, air),
          air,
        });
      }
      return jsonResponse({
        ...(await assist(
          { profile, question: body.question.trim(), air },
          env,
        )),
        air,
      });
    } catch {
      return jsonResponse(
        { error: "Invalid request. Check your profile and question." },
        400,
      );
    }
  }
  return jsonResponse({ error: "Endpoint or method not found." }, 404);
}

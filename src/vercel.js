import { handleApi } from "./http-api.js";

export function serveVercelApi(request) {
  const client = request.headers.get("x-vercel-forwarded-for");
  return handleApi(request, process.env, client || undefined);
}

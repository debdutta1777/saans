import { HEADERS } from "../src/security.js";
import { handleApi } from "../src/http-api.js";
import { ASSETS } from "../src/assets.generated.js";

export default {
  async fetch(request, env = {}) {
    const path = new URL(request.url).pathname;
    if (request.method === "GET" && Object.hasOwn(ASSETS, path)) {
      const { body, type } = ASSETS[path];
      return new Response(body, {
        headers: { ...HEADERS, "Content-Type": type },
      });
    }
    if (path.startsWith("/api/")) {
      const client =
        request.headers.get("oai-authenticated-user-id") ||
        request.headers.get("cf-connecting-ip");
      return handleApi(request, env, client || undefined);
    }
    return new Response("Not found", { status: 404, headers: HEADERS });
  },
};

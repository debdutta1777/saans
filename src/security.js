/** Bounded per-isolate abuse guard. Production public deployments should add an edge-wide limiter. */
export function createLimiter({
  limit = 12,
  windowMs = 60000,
  maxEntries = 2000,
} = {}) {
  const clients = new Map();
  return (key, now = Date.now()) => {
    // With a fixed window, expired entries form a prefix in insertion order.
    for (const [id, record] of clients) {
      if (record.until > now) break;
      clients.delete(id);
    }
    let record = clients.get(key);
    if (!record) {
      if (clients.size >= maxEntries) return false;
      record = { count: 0, until: now + windowMs };
      clients.set(key, record);
    }
    return ++record.count <= limit;
  };
}
export const HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com",
  "Cache-Control": "no-store",
};
export function jsonResponse(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      ...extra,
    },
  });
}
export async function readJSON(request, maxBytes = 8192) {
  const mediaType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (mediaType !== "application/json")
    throw new Error("Send application/json.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Request body is required.");
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error("Request too large.");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

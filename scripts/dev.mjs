import "./build.mjs";
import http from "node:http";
const { default: worker } = await import("../worker/index.js");
const server = http.createServer(async (req, res) => {
  try {
    const origin = `http://${req.headers.host}`;
    const headers = { ...req.headers };
    delete headers["cf-connecting-ip"];
    delete headers["oai-authenticated-user-id"];
    headers["cf-connecting-ip"] = req.socket.remoteAddress || "local";
    const request = new Request(new URL(req.url, origin), {
      method: req.method,
      headers,
      ...(!["GET", "HEAD"].includes(req.method)
        ? { body: req, duplex: "half" }
        : {}),
    });
    const result = await worker.fetch(request, process.env);
    res.writeHead(result.status, Object.fromEntries(result.headers));
    res.end(Buffer.from(await result.arrayBuffer()));
  } catch {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end('{"error":"Server unavailable"}');
  }
});
server.requestTimeout = 30000;
const portArg = process.argv.indexOf("--port");
const hostArg = process.argv.indexOf("--host");
const port = Number(
  portArg >= 0 ? process.argv[portArg + 1] : process.env.PORT || 3000,
);
const host = hostArg >= 0 ? process.argv[hostArg + 1] : "0.0.0.0";
server.listen(port, host, () =>
  console.log("Saans server ready on port " + port),
);

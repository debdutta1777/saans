import { readFile, writeFile, mkdir, rm, copyFile } from "node:fs/promises";
const assets = {};
for (const [path, file, type] of [
  ["/", "index.html", "text/html"],
  ["/app.js", "app.js", "text/javascript"],
  ["/styles.css", "styles.css", "text/css"],
  ["/domain.js", "../src/domain.js", "text/javascript"],
])
  assets[path] = {
    body: await readFile(new URL("../public/" + file, import.meta.url), "utf8"),
    type: type + "; charset=utf-8",
  };
await writeFile(
  new URL("../src/assets.generated.js", import.meta.url),
  "export const ASSETS = " + JSON.stringify(assets) + ";\n",
);
// A fixed, acyclic module list keeps the deploy artifact self-contained without third-party dependencies.
const files = [
  "src/domain.js",
  "src/services.js",
  "src/security.js",
  "src/http-api.js",
  "src/assets.generated.js",
  "worker/index.js",
];
let bundle = "";
for (const file of files) {
  const source = await readFile(new URL("../" + file, import.meta.url), "utf8");
  bundle +=
    "\n// " +
    file +
    "\n" +
    source
      .replace(/^import [\s\S]*?;\n/gm, "")
      .replace(/^export (?!default)/gm, "");
}
await rm(new URL("../dist", import.meta.url), { recursive: true, force: true });
await mkdir(new URL("../dist/server", import.meta.url), { recursive: true });
await mkdir(new URL("../dist/.openai", import.meta.url), { recursive: true });
await writeFile(new URL("../dist/server/index.js", import.meta.url), bundle);
await copyFile(
  new URL("../.openai/hosting.json", import.meta.url),
  new URL("../dist/.openai/hosting.json", import.meta.url),
);
console.log(
  "Built self-contained Worker (" + Buffer.byteLength(bundle) + " bytes).",
);

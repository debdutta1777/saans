import { copyFile, cp, mkdir, rm } from "node:fs/promises";

const output = new URL("../dist/vercel/", import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(new URL("../public/", import.meta.url), output, { recursive: true });
await copyFile(
  new URL("../src/domain.js", import.meta.url),
  new URL("domain.js", output),
);
console.log("Built Vercel static assets in dist/vercel.");

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
for (const folder of ["src", "worker", "api", "public", "scripts", "tests"])
  for (const file of readdirSync(folder))
    if (/\.(m?js)$/.test(file))
      execFileSync(process.execPath, ["--check", `${folder}/${file}`]);
for (const file of ["public/app.js", "public/index.html"])
  if (
    /AIza[0-9A-Za-z_-]{20,}|sk-proj-[A-Za-z0-9]{10,}/.test(
      readFileSync(file, "utf8"),
    )
  )
    throw new Error("Potential credential in client asset");
console.log("Syntax and client credential checks passed.");

/* Runs every lot's browser checks in sequence against NIDZ_URL (default
   http://127.0.0.1:8080) and exits non-zero if any check failed. */
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(here).filter((f) => /^lot\d+.*\.mjs$/.test(f)).sort();
let failed = 0;
for (const file of files) {
  console.log(`\n=== ${file}`);
  const run = spawnSync(process.execPath, [join(here, file)], { stdio: "inherit" });
  if (run.status !== 0) failed += 1;
}
console.log(`\n${files.length - failed}/${files.length} files passed`);
process.exitCode = failed ? 1 : 0;

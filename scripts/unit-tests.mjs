/**
 * Unit tests: `npm run test:unit`.
 *
 * No test framework is installed in this repository, and none is added by
 * this script: tests use Node's built-in `node:test` and `node:assert`, and
 * Vite — already the build tool — loads them, so the `@/` alias and
 * TypeScript resolve exactly as they do in the app. Tests live in
 * `tests/unit/*.test.ts` and cover pure domain logic only (matching, the
 * request draft, publication rules, request transitions, storage
 * validation). Screens are covered by the browser checks in `e2e/`.
 */
import { readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "tests", "unit");

const server = await createServer({
  root,
  configFile: false,
  logLevel: "error",
  appType: "custom",
  server: { middlewareMode: true, hmr: false, watch: null },
  resolve: { alias: { "@": join(root, "src") } },
  optimizeDeps: { noDiscovery: true, include: [] },
});

try {
  const files = readdirSync(dir).filter((f) => f.endsWith(".test.ts")).sort();
  for (const file of files) await server.ssrLoadModule(join(dir, file));
} finally {
  await server.close();
}
/* node:test runs the registered tests once this module settles, prints the
   report, and sets a non-zero exit code if any failed. */

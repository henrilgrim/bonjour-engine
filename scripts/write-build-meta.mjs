// scripts/gen-build-meta.mjs (ou .js se "type":"module" no package.json)
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const run = (cmd) => {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
};

const commit = run("git rev-parse --short HEAD") || "nogit";
const builtAt = new Date().toISOString();
const buildId = `${builtAt}_${commit}`;

// Também exportamos aliases para retrocompatibilidade
const version = buildId;
const buildTime = builtAt;

// 1) public/version.json — usado pelo checador remoto
mkdirSync("public", { recursive: true });
writeFileSync(
  resolve("public", "version.json"),
  JSON.stringify({ buildId, builtAt, commit, version, buildTime }, null, 2) + "\n"
);

// 2) src/build-meta.ts — usado dentro do app
const ts = `export const BUILD_ID = "${buildId}";
export const builtAt = "${builtAt}";
export const commit = "${commit}";
export const version = BUILD_ID;
export const buildTime = builtAt;

export const BUILD_META = {
  buildId: BUILD_ID,
  builtAt,
  commit,
  version,
  buildTime,
} as const;

export default BUILD_META;
`;

mkdirSync("src", { recursive: true });
writeFileSync(resolve("src", "build-meta.ts"), ts);

console.log("✅ wrote public/version.json and src/build-meta.ts:", buildId);

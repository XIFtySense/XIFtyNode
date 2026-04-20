"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createRequire } = require("node:module");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const packageJson = require(path.join(root, "package.json"));

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });

  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || "");
    process.exit(result.status ?? 1);
  }

  return result;
}

function fieldsByName(output) {
  return Object.fromEntries(
    (output.normalized?.fields ?? []).map((field) => [field.field, field]),
  );
}

function valueForField(field) {
  if (!field?.value) {
    return undefined;
  }
  return field.value.value;
}

function isNonZero(value) {
  if (value == null) {
    return false;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "string") {
    return value !== "" && value !== "0";
  }
  return true;
}

const packResult = run("npm", ["pack", "--json"], { cwd: root });
const [{ filename }] = JSON.parse(packResult.stdout);
const tarball = path.join(root, filename);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "xifty-node-packed-"));
run("npm", ["init", "-y"], { cwd: tempDir });
run("npm", ["install", tarball], { cwd: tempDir });

const fixture =
  process.env.XIFTY_SMOKE_FIXTURE || path.join(root, "fixtures", "happy.jpg");
const requiredFields = (
  process.env.XIFTY_SMOKE_FIELDS || "captured_at,device.make,device.model"
)
  .split(",")
  .map((field) => field.trim())
  .filter(Boolean);
const nonZeroFields = new Set(
  (process.env.XIFTY_SMOKE_NONZERO_FIELDS || "")
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean),
);

const requireFromTemp = createRequire(path.join(tempDir, "package.json"));
const xifty = requireFromTemp("@xifty/xifty");

if (xifty.packageVersion() !== packageJson.version) {
  process.stderr.write(
    `packed package version mismatch: expected ${packageJson.version}, got ${xifty.packageVersion()}\n`,
  );
  process.exit(1);
}

const output = xifty.extract(fixture, { view: "normalized" });
const fields = fieldsByName(output);

for (const fieldName of requiredFields) {
  const value = valueForField(fields[fieldName]);
  if (value == null) {
    process.stderr.write(
      `packed package smoke failed: missing normalized field ${fieldName} for fixture ${fixture}\n`,
    );
    process.exit(1);
  }
  if (nonZeroFields.has(fieldName) && !isNonZero(value)) {
    process.stderr.write(
      `packed package smoke failed: expected non-zero value for ${fieldName}, got ${JSON.stringify(value)}\n`,
    );
    process.exit(1);
  }
}

// ESM interop probe against the installed tarball: confirms an ESM consumer
// in a real npm project can `import` the package via Node's CJS-ESM interop.
const esmConsumerPath = path.join(tempDir, "esm-consumer.mjs");
fs.writeFileSync(
  esmConsumerPath,
  [
    'import xifty from "@xifty/xifty";',
    'import { extract, packageVersion } from "@xifty/xifty";',
    "if (xifty.packageVersion !== packageVersion) {",
    '  throw new Error("ESM interop mismatch: default vs named packageVersion");',
    "}",
    "const fixturePath = process.argv[2];",
    'const output = extract(fixturePath, { view: "normalized" });',
    "if (!output || !output.normalized || !Array.isArray(output.normalized.fields) || output.normalized.fields.length === 0) {",
    '  throw new Error("ESM extract did not return a populated normalized view");',
    "}",
    'process.stdout.write(`ESM-OK ${packageVersion()}\\n`);',
    "",
  ].join("\n"),
);

const esmResult = spawnSync(
  process.execPath,
  [esmConsumerPath, fixture],
  { cwd: tempDir, stdio: "pipe", encoding: "utf8" },
);

if (esmResult.status !== 0) {
  process.stderr.write(
    `packed package ESM smoke failed (exit ${esmResult.status}):\n${esmResult.stderr || esmResult.stdout || ""}`,
  );
  process.exit(esmResult.status ?? 1);
}

const expectedEsmLine = `ESM-OK ${packageJson.version}`;
if (!esmResult.stdout.includes(expectedEsmLine)) {
  process.stderr.write(
    `packed package ESM smoke failed: expected stdout to contain "${expectedEsmLine}", got:\n${esmResult.stdout}`,
  );
  process.exit(1);
}

process.stdout.write(
  `packed package smoke passed for ${path.basename(fixture)} with ${requiredFields.join(", ")}\n`,
);
process.stdout.write(
  `packed package ESM interop smoke passed (${expectedEsmLine})\n`,
);

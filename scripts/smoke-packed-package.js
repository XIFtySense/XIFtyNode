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
const sidecarFields = (process.env.XIFTY_SMOKE_SIDECAR_FIELDS || "")
  .split(",")
  .map((field) => field.trim())
  .filter(Boolean);
const expectedSidecarNamespace =
  process.env.XIFTY_SMOKE_SIDECAR_NAMESPACE || "sony_nrt";

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

process.stdout.write(
  `packed package smoke passed for ${path.basename(fixture)} with ${requiredFields.join(", ")}\n`,
);

// Optional sidecar-aware verification path. Set XIFTY_SMOKE_SIDECAR_FIELDS to a
// comma list of normalized fields that must surface from a sidecar (e.g.
// `umid,recording.mode,timecode.ltc.start`). Each field's `sources[]` is
// asserted to contain at least one entry whose `namespace` equals
// XIFTY_SMOKE_SIDECAR_NAMESPACE (default `sony_nrt`).
if (sidecarFields.length > 0) {
  const sidecarOutput = xifty.extract(fixture, {
    view: "normalized",
    sidecars: { discoverFrom: fixture },
  });
  const sidecarFieldsByName = fieldsByName(sidecarOutput);

  for (const fieldName of sidecarFields) {
    const field = sidecarFieldsByName[fieldName];
    if (!field) {
      process.stderr.write(
        `packed package sidecar smoke failed: missing field ${fieldName} for fixture ${fixture} (sidecar discovery enabled)\n`,
      );
      process.exit(1);
    }
    const namespaces = (field.sources ?? []).map((source) => source.namespace);
    if (!namespaces.includes(expectedSidecarNamespace)) {
      process.stderr.write(
        `packed package sidecar smoke failed: ${fieldName} has no source with namespace='${expectedSidecarNamespace}'; got namespaces=${JSON.stringify(namespaces)}\n`,
      );
      process.exit(1);
    }
  }

  process.stdout.write(
    `packed package sidecar smoke passed for ${path.basename(fixture)} with ${sidecarFields.join(", ")} (namespace=${expectedSidecarNamespace})\n`,
  );
}

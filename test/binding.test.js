"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const packageJson = require("../package.json");

const xifty = require("..");

const fixture = path.resolve(__dirname, "../fixtures/happy.jpg");

function fieldsByName(output) {
  return Object.fromEntries(
    output.normalized.fields.map((field) => [field.field, field]),
  );
}

test("package version returns the npm package version", () => {
  assert.equal(xifty.packageVersion(), packageJson.version);
});

test("core version returns a non-empty semantic-looking string", () => {
  assert.match(xifty.version(), /^\d+\.\d+\.\d+/);
});

test("probe returns input summary for the fixture", () => {
  const output = xifty.probe(fixture);

  assert.equal(output.schema_version, "0.1.0");
  assert.equal(output.input.detected_format, "jpeg");
  assert.equal(output.input.container, "jpeg");
  assert.equal(output.input.path, fixture);
});

test("extract defaults to the full envelope", () => {
  const output = xifty.extract(fixture);

  assert.ok(output.raw);
  assert.ok(output.interpreted);
  assert.ok(output.normalized);
  assert.ok(output.report);
});

test("raw view preserves low-level metadata and container evidence", () => {
  const output = xifty.extract(fixture, { view: "raw" });

  assert.equal(output.input.detected_format, "jpeg");
  assert.equal(output.raw.containers[0].label, "jpeg");
  assert.equal(output.raw.metadata[0].namespace, "exif");
  assert.equal(output.raw.metadata[0].tag_name, "ImageWidth");
  assert.equal(output.raw.metadata[0].value.value, 800);
  assert.deepEqual(output.report, { issues: [], conflicts: [] });
});

test("interpreted view exposes decoded EXIF tag names", () => {
  const output = xifty.extract(fixture, { view: "interpreted" });
  const tagNames = output.interpreted.metadata.map((entry) => entry.tag_name);

  assert.ok(tagNames.includes("Make"));
  assert.ok(tagNames.includes("Model"));
  assert.ok(tagNames.includes("DateTimeOriginal"));
});

test("normalized view yields stable application-facing fields", () => {
  const output = xifty.extract(fixture, { view: "normalized" });
  const fields = fieldsByName(output);

  assert.equal(fields["captured_at"].value.value, "2024-04-16T12:34:56");
  assert.equal(fields["device.make"].value.value, "XIFtyCam");
  assert.equal(fields["device.model"].value.value, "IterationOne");
  assert.equal(fields["software"].value.value, "XIFtyTestGen");
  assert.equal(fields["orientation"].value.value, 1);
  assert.equal(fields["dimensions.width"].value.value, 800);
  assert.equal(fields["dimensions.height"].value.value, 600);
  assert.equal(fields["device.make"].sources[0].namespace, "exif");
});

test("report view remains present and explicit even when empty", () => {
  const output = xifty.extract(fixture, { view: "report" });

  assert.deepEqual(output.report.issues, []);
  assert.deepEqual(output.report.conflicts, []);
  assert.equal(output.raw, undefined);
  assert.equal(output.normalized, undefined);
});

test("numeric view selection matches named view selection", () => {
  const named = xifty.extract(fixture, { view: "normalized" });
  const numeric = xifty.extract(fixture, { view: 3 });

  assert.deepEqual(numeric.normalized, named.normalized);
});

test("invalid view throws a targeted error", () => {
  assert.throws(
    () => xifty.extract(fixture, { view: "bad-view" }),
    /unsupported view: bad-view/,
  );
});

test("ESM consumer can import the package via Node's CJS interop", () => {
  const { spawnSync } = require("node:child_process");
  const esmFixture = path.resolve(__dirname, "fixtures/esm-consumer.mjs");

  const result = spawnSync(process.execPath, [esmFixture, fixture], {
    cwd: path.resolve(__dirname, ".."),
    stdio: "pipe",
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout || "");
  assert.match(result.stdout, /ESM-OK /);
  assert.ok(
    result.stdout.includes(`ESM-OK ${packageJson.version}`),
    `expected ESM-OK ${packageJson.version} in stdout, got: ${result.stdout}`,
  );
});

test("consumer installs do not switch to source-build mode from cached core alone", () => {
  const script = `
    const path = require("node:path");
    const os = require("node:os");
    const fs = require("node:fs");
    const cacheDir = path.join(os.tmpdir(), "xifty-node-test-cache-" + process.pid);
    const coreDir = path.join(cacheDir, "main");
    fs.mkdirSync(coreDir, { recursive: true });
    fs.writeFileSync(path.join(coreDir, "Cargo.toml"), "[package]\\nname='fake'\\nversion='0.0.0'\\n");
    process.env.XIFTY_CORE_CACHE_DIR = cacheDir;
    delete process.env.XIFTY_CORE_DIR;
    delete process.env.XIFTY_FORCE_BUILD;
    const { shouldUseSourceBuild } = require("./scripts/core-config");
    if (shouldUseSourceBuild()) process.exit(1);
  `;

  const { spawnSync } = require("node:child_process");
  const result = spawnSync(process.execPath, ["-e", script], {
    cwd: path.resolve(__dirname, ".."),
    stdio: "pipe",
  });

  assert.equal(result.status, 0, result.stderr.toString("utf8"));
});

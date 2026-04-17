"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const prebuildsDir = path.join(root, "prebuilds");

if (process.env.XIFTY_PRESERVE_PREBUILDS !== "1") {
  fs.rmSync(prebuildsDir, { recursive: true, force: true });
}

const tsc = require.resolve("typescript/bin/tsc");
let result = spawnSync(process.execPath, [tsc, "-p", "tsconfig.json"], {
  stdio: "inherit",
  env: process.env,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const buildScript = path.join(__dirname, "build-addon.js");
result = spawnSync(process.execPath, [buildScript, "release"], {
  stdio: "inherit",
  env: {
    ...process.env,
    XIFTY_CARGO_PROFILE: "release",
  },
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const prebuildify = require.resolve("prebuildify/bin.js");
result = spawnSync(process.execPath, [prebuildify, "--napi", "--strip"], {
  stdio: "inherit",
  env: {
    ...process.env,
    XIFTY_CARGO_PROFILE: "release",
  },
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

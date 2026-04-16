"use strict";

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const coreDir = process.env.XIFTY_CORE_DIR
  ? path.resolve(process.env.XIFTY_CORE_DIR)
  : path.resolve(root, "..", "XIFty");
const manifestPath = path.join(coreDir, "Cargo.toml");

const result = spawnSync(
  "cargo",
  ["build", "-p", "xifty-ffi", "--manifest-path", manifestPath],
  { stdio: "inherit" },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}


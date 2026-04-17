"use strict";

const { spawnSync } = require("node:child_process");
const {
  cargoArgsForProfile,
  ensureCoreCheckout,
  manifestPath,
  resolveProfile,
} = require("./core-config");

const profile = resolveProfile(process.argv[2]);
const dir = ensureCoreCheckout();
const args = cargoArgsForProfile(profile, manifestPath(dir));

const result = spawnSync("cargo", args, {
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

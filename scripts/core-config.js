"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const coreDir = process.env.XIFTY_CORE_DIR
  ? path.resolve(process.env.XIFTY_CORE_DIR)
  : path.resolve(root, "..", "XIFty");

const manifestPath = path.join(coreDir, "Cargo.toml");

function resolveProfile(value) {
  const profile = String(value || process.env.XIFTY_CARGO_PROFILE || "release").toLowerCase();
  if (profile !== "debug" && profile !== "release") {
    throw new Error(`unsupported cargo profile: ${profile}`);
  }
  return profile;
}

const cargoProfile = resolveProfile();
const profileDir = path.join(coreDir, "target", cargoProfile);

function staticLibraryName() {
  if (process.platform === "win32") {
    return "xifty_ffi.lib";
  }
  return "libxifty_ffi.a";
}

const staticLibraryPath = path.join(profileDir, staticLibraryName());

function cargoArgsForProfile(profile) {
  const args = ["build"];
  if (profile === "release") {
    args.push("--release");
  }
  args.push("-p", "xifty-ffi", "--manifest-path", manifestPath);
  return args;
}

function hasCoreCheckout() {
  return fs.existsSync(manifestPath);
}

module.exports = {
  cargoArgsForProfile,
  cargoProfile,
  coreDir,
  hasCoreCheckout,
  manifestPath,
  profileDir,
  resolveProfile,
  staticLibraryPath,
};

"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const explicitCoreDir = process.env.XIFTY_CORE_DIR
  ? path.resolve(process.env.XIFTY_CORE_DIR)
  : null;
const coreRepo = process.env.XIFTY_CORE_REPO || "https://github.com/XIFtySense/XIFty.git";
const coreRef = process.env.XIFTY_CORE_REF || "main";
const coreCacheDir = process.env.XIFTY_CORE_CACHE_DIR
  ? path.resolve(process.env.XIFTY_CORE_CACHE_DIR)
  : path.join(os.homedir(), ".cache", "xifty-node", "core");
const explicitCargoTargetDir = process.env.XIFTY_CARGO_TARGET_DIR
  ? path.resolve(process.env.XIFTY_CARGO_TARGET_DIR)
  : null;
const cargoProfile = resolveProfile();

function resolveProfile(value) {
  const profile = String(value || process.env.XIFTY_CARGO_PROFILE || "release").toLowerCase();
  if (profile !== "debug" && profile !== "release") {
    throw new Error(`unsupported cargo profile: ${profile}`);
  }
  return profile;
}

function staticLibraryName() {
  if (process.platform === "win32") {
    return "xifty_ffi.lib";
  }
  return "libxifty_ffi.a";
}

function sanitizeRef(value) {
  return String(value).replace(/[^A-Za-z0-9._-]+/g, "-");
}

function defaultCoreDir() {
  return path.join(coreCacheDir, sanitizeRef(coreRef));
}

function coreDir() {
  return explicitCoreDir || defaultCoreDir();
}

function manifestPath(dir = coreDir()) {
  return path.join(dir, "Cargo.toml");
}

function includeDir(dir = coreDir()) {
  return path.join(dir, "include");
}

function profileDir(profile = resolveProfile(), dir = coreDir()) {
  const targetRoot = explicitCargoTargetDir || path.join(dir, "target");
  return path.join(targetRoot, profile);
}

function staticLibraryPath(profile = resolveProfile(), dir = coreDir()) {
  return path.join(profileDir(profile, dir), staticLibraryName());
}

function cargoArgsForProfile(profile, manifest) {
  const args = ["build"];
  if (profile === "release") {
    args.push("--release");
  }
  args.push("-p", "xifty-ffi", "--manifest-path", manifest);
  return args;
}

function hasCoreCheckout(dir = coreDir()) {
  return fs.existsSync(manifestPath(dir));
}

function runOrThrow(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with status ${result.status ?? 1}`);
  }
}

function ensureCoreCheckout() {
  if (explicitCoreDir) {
    if (!hasCoreCheckout(explicitCoreDir)) {
      throw new Error(
        `XIFTY_CORE_DIR does not point to a valid XIFty checkout: ${explicitCoreDir}`,
      );
    }
    return explicitCoreDir;
  }

  const dir = defaultCoreDir();
  fs.mkdirSync(coreCacheDir, { recursive: true });

  if (!fs.existsSync(path.join(dir, ".git"))) {
    runOrThrow("git", ["clone", "--depth", "1", "--branch", coreRef, coreRepo, dir]);
  } else {
    runOrThrow("git", ["-C", dir, "fetch", "--depth", "1", "origin", coreRef]);
    runOrThrow("git", ["-C", dir, "checkout", "--force", "FETCH_HEAD"]);
  }

  if (!hasCoreCheckout(dir)) {
    throw new Error(`cached XIFty checkout is missing Cargo.toml: ${dir}`);
  }

  return dir;
}

function describeCoreSource() {
  if (explicitCoreDir) {
    return `XIFTY_CORE_DIR=${explicitCoreDir}`;
  }
  return `${coreRepo}#${coreRef} cached at ${defaultCoreDir()}`;
}

module.exports = {
  cargoArgsForProfile,
  cargoProfile,
  coreCacheDir,
  coreDir,
  coreRef,
  coreRepo,
  explicitCargoTargetDir,
  describeCoreSource,
  ensureCoreCheckout,
  hasCoreCheckout,
  includeDir,
  manifestPath,
  profileDir,
  resolveProfile,
  staticLibraryPath,
};

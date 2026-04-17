"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { coreDir } = require("./core-config");

const root = path.resolve(__dirname, "..");
const prebuildsDir = path.join(root, "prebuilds");
const cacheRoot = path.join(os.homedir(), ".cache", "xifty-node", "docker", "linux-x64");
const workRoot = path.join(cacheRoot, "work");
const cargoHome = path.join(cacheRoot, "cargo");
const rustupHome = path.join(cacheRoot, "rustup");
const coreCacheDir = path.join(cacheRoot, "core");
const cargoTargetDir = path.join(cacheRoot, "target");

fs.mkdirSync(cacheRoot, { recursive: true });
fs.mkdirSync(prebuildsDir, { recursive: true });
fs.mkdirSync(workRoot, { recursive: true });
fs.mkdirSync(cargoHome, { recursive: true });
fs.mkdirSync(rustupHome, { recursive: true });
fs.mkdirSync(coreCacheDir, { recursive: true });
fs.mkdirSync(cargoTargetDir, { recursive: true });

const explicitCoreDir = process.env.XIFTY_CORE_DIR ? path.resolve(coreDir()) : null;
const dockerArgs = [
  "run",
  "--rm",
  "--platform",
  "linux/amd64",
  "-v",
  `${root}:/src:ro`,
  "-v",
  `${prebuildsDir}:/out`,
  "-v",
  `${workRoot}:/work`,
  "-v",
  `${cargoHome}:/cargo-home`,
  "-v",
  `${rustupHome}:/rustup-home`,
  "-v",
  `${coreCacheDir}:/core-cache`,
  "-v",
  `${cargoTargetDir}:/cargo-target`,
];

if (explicitCoreDir) {
  dockerArgs.push("-v", `${explicitCoreDir}:/explicit-core:ro`);
}

dockerArgs.push(
  "public.ecr.aws/sam/build-nodejs22.x:1.136.0",
  "bash",
  "-lc",
  [
    "set -euo pipefail",
    "rm -rf /work/src && mkdir -p /work/src",
    "tar -C /src --exclude=node_modules --exclude=prebuilds --exclude=dist --exclude=build -cf - . | tar -C /work/src -xf -",
    "cd /work/src",
    "export HOME=/tmp/xifty-home",
    "mkdir -p \"$HOME\" /cargo-home /rustup-home /core-cache /cargo-target",
    "export CARGO_HOME=/cargo-home",
    "export RUSTUP_HOME=/rustup-home",
    "if ! command -v cargo >/dev/null 2>&1; then curl https://sh.rustup.rs -sSf | sh -s -- -y --profile minimal; fi",
    "source \"$CARGO_HOME/env\"",
    "npm ci --ignore-scripts",
    explicitCoreDir ? "export XIFTY_CORE_DIR=/explicit-core" : "export XIFTY_CORE_CACHE_DIR=/core-cache",
    "export XIFTY_CARGO_TARGET_DIR=/cargo-target",
    "export XIFTY_PRESERVE_PREBUILDS=1",
    "node scripts/prebuild.js",
    "rm -rf /out/linux-x64",
    "cp -R /work/src/prebuilds/linux-x64 /out/",
  ].join(" && "),
);

const result = spawnSync("docker", dockerArgs, {
  stdio: "inherit",
  env: process.env,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

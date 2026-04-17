"use strict";

const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { resolveProfile } = require("./core-config");

const profile = resolveProfile(process.argv[2]);
const buildCore = path.join(__dirname, "build-core.js");
const nodeGyp = require.resolve("node-gyp/bin/node-gyp.js");

function run(command, args, env) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const env = {
  ...process.env,
  XIFTY_CARGO_PROFILE: profile,
};

run(process.execPath, [buildCore, profile], env);

const nodeGypArgs = [nodeGyp, "rebuild"];
if (profile === "debug") {
  nodeGypArgs.push("--debug");
}

run(process.execPath, nodeGypArgs, env);

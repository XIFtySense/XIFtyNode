"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const prebuildsDir = path.join(root, "prebuilds");

fs.rmSync(prebuildsDir, { recursive: true, force: true });

function runNodeScript(scriptName, extraEnv = {}) {
  const scriptPath = path.join(__dirname, scriptName);
  const result = spawnSync(process.execPath, [scriptPath], {
    stdio: "inherit",
    env: {
      ...process.env,
      ...extraEnv,
    },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

runNodeScript("prebuild.js", { XIFTY_PRESERVE_PREBUILDS: "1" });

if (!(process.platform === "linux" && process.arch === "x64")) {
  runNodeScript("prebuild-linux-x64.js");
}

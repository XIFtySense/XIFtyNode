"use strict";

const { spawnSync } = require("node:child_process");
const { describeCoreSource, shouldUseSourceBuild } = require("./core-config");

if (!shouldUseSourceBuild()) {
  process.stdout.write(
    `No explicit source-build request detected; skipping source build and expecting bundled prebuilds. Maintainer builds can use XIFTY_CORE_DIR or XIFTY_FORCE_BUILD=1 with the cached core source flow (${describeCoreSource()}).\n`,
  );
  process.exit(0);
}

const scriptPath = require("node:path").join(__dirname, "build-addon.js");
const result = spawnSync(process.execPath, [scriptPath, "release"], {
  stdio: "inherit",
  env: {
    ...process.env,
    XIFTY_CARGO_PROFILE: "release",
  },
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

"use strict";

const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { coreDir, hasCoreCheckout } = require("./core-config");

if (!hasCoreCheckout()) {
  process.stdout.write(
    `No local XIFty core checkout detected at ${coreDir}; skipping source build and expecting bundled prebuilds.\n`,
  );
  process.exit(0);
}

const scriptPath = path.join(__dirname, "build-addon.js");
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

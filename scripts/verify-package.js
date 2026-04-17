"use strict";

const { spawnSync } = require("node:child_process");

const result = spawnSync("npm", ["pack", "--json", "--dry-run"], {
  encoding: "utf8",
  stdio: ["inherit", "pipe", "inherit"],
  env: process.env,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const output = JSON.parse(result.stdout);
const files = new Set(output[0].files.map((file) => file.path));
const requiredFiles = [
  "prebuilds/darwin-arm64/@xifty+xifty.node",
  "prebuilds/linux-x64/@xifty+xifty.node",
  "dist/index.js",
  "dist/index.d.ts",
];

const missing = requiredFiles.filter((file) => !files.has(file));
if (missing.length > 0) {
  process.stderr.write(
    `package verification failed; missing files: ${missing.join(", ")}\n`,
  );
  process.exit(1);
}

process.stdout.write("package verification passed\n");

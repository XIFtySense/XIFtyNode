"use strict";

const path = require("node:path");

const root = path.resolve(__dirname, "..");
const coreDir = process.env.XIFTY_CORE_DIR
  ? path.resolve(process.env.XIFTY_CORE_DIR)
  : path.resolve(root, "..", "XIFty");

const command = process.argv[2];

function out(value) {
  process.stdout.write(`${value}\n`);
}

switch (command) {
  case "core-dir":
    out(coreDir);
    break;
  case "manifest":
    out(path.join(coreDir, "Cargo.toml"));
    break;
  case "include":
    out(path.join(coreDir, "include"));
    break;
  case "staticlib":
    out(path.join(coreDir, "target", "debug", "libxifty_ffi.a"));
    break;
  default:
    process.stderr.write(`unsupported command: ${command}\n`);
    process.exit(1);
}


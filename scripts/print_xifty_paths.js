"use strict";

const path = require("node:path");
const {
  cargoProfile,
  coreDir,
  manifestPath,
  profileDir,
  staticLibraryPath,
} = require("./core-config");

const command = process.argv[2];

function out(value) {
  process.stdout.write(`${value}\n`);
}

function toGypPath(value) {
  return String(value).split(path.sep).join("/");
}

switch (command) {
  case "core-dir":
    out(toGypPath(coreDir));
    break;
  case "manifest":
    out(toGypPath(manifestPath));
    break;
  case "include":
    out(toGypPath(`${coreDir}/include`));
    break;
  case "profile":
    out(cargoProfile);
    break;
  case "profile-dir":
    out(toGypPath(profileDir));
    break;
  case "staticlib":
    out(toGypPath(staticLibraryPath));
    break;
  default:
    process.stderr.write(`unsupported command: ${command}\n`);
    process.exit(1);
}

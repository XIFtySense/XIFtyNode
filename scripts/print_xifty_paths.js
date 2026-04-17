"use strict";

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

switch (command) {
  case "core-dir":
    out(coreDir);
    break;
  case "manifest":
    out(manifestPath);
    break;
  case "include":
    out(`${coreDir}/include`);
    break;
  case "profile":
    out(cargoProfile);
    break;
  case "profile-dir":
    out(profileDir);
    break;
  case "staticlib":
    out(staticLibraryPath);
    break;
  default:
    process.stderr.write(`unsupported command: ${command}\n`);
    process.exit(1);
}

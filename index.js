"use strict";

function loadNativeBinding() {
  try {
    return require("node-gyp-build")(__dirname);
  } catch (error) {
    if (
      error &&
      typeof error.message === "string" &&
      error.message.includes("No native build was found")
    ) {
      throw new Error(
        [
          "xifty does not ship a native build for this platform.",
          "Supported platforms: macos-arm64, linux-x64.",
          "Unsupported platforms include macos-x64, windows, and other Linux architectures.",
        ].join(" "),
        { cause: error },
      );
    }
    throw error;
  }
}

const native = loadNativeBinding();

const viewByName = {
  full: 0,
  raw: 1,
  interpreted: 2,
  normalized: 3,
  report: 4,
};

function version() {
  return native.version();
}

function probe(path) {
  return JSON.parse(native.probeJson(path));
}

function extract(path, options = {}) {
  const view = options.view ?? "full";
  const viewMode = typeof view === "number" ? view : viewByName[String(view)];
  if (viewMode === undefined) {
    throw new TypeError(`unsupported view: ${view}`);
  }
  return JSON.parse(native.extractJson(path, viewMode));
}

module.exports = {
  version,
  probe,
  extract,
};

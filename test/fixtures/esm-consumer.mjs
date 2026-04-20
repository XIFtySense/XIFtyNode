// ESM interop fixture — imports the CJS package via Node's CJS-ESM interop.
// Invoked as a subprocess by test/binding.test.js and by
// scripts/smoke-packed-package.js. Receives a fixture image path via argv[2].
//
// On success: prints `ESM-OK <packageVersion>` to stdout and exits 0.
// On any import/shape mismatch: throws (non-zero exit).

import xifty from "@xifty/xifty";
import { extract, packageVersion } from "@xifty/xifty";

// Same function reference via default-import namespace and named import:
// confirms Node's CJS interop exposes both the `module.exports` object as
// default and its properties as named bindings.
if (xifty.packageVersion !== packageVersion) {
  throw new Error(
    "ESM interop mismatch: default.packageVersion !== named packageVersion",
  );
}
if (xifty.extract !== extract) {
  throw new Error(
    "ESM interop mismatch: default.extract !== named extract",
  );
}

const fixturePath = process.argv[2];
if (!fixturePath) {
  throw new Error("ESM fixture requires a fixture path as argv[2]");
}

const output = extract(fixturePath, { view: "normalized" });
if (
  !output ||
  !output.normalized ||
  !Array.isArray(output.normalized.fields) ||
  output.normalized.fields.length === 0
) {
  throw new Error("ESM extract did not return a populated normalized view");
}

process.stdout.write(`ESM-OK ${packageVersion()}\n`);

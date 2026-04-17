"use strict";

const path = require("node:path");
const xifty = require("..");

const fixture = path.resolve(__dirname, "../fixtures/happy.jpg");
const normalized = xifty.extract(fixture, { view: "normalized" });
const fields = Object.fromEntries(
  normalized.normalized.fields.map((field) => [field.field, field.value.value]),
);

console.log("XIFty package:", xifty.packageVersion());
console.log("XIFty core:", xifty.version());
console.log("Detected format:", normalized.input.detected_format);
console.log("Camera:", `${fields["device.make"]} ${fields["device.model"]}`);
console.log("Captured at:", fields.captured_at);
console.log("Dimensions:", `${fields["dimensions.width"]}x${fields["dimensions.height"]}`);
console.log("Normalized envelope:");
console.log(JSON.stringify(normalized, null, 2));

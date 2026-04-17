"use strict";

const path = require("node:path");
const xifty = require("..");

const fixture = path.resolve(__dirname, "../fixtures/happy.jpg");
const result = xifty.extract(fixture, { view: "normalized" });

const fields = Object.fromEntries(
  result.normalized.fields.map((field) => [field.field, field.value.value]),
);

const asset = {
  sourcePath: fixture,
  format: result.input.detected_format,
  capturedAt: fields.captured_at ?? null,
  cameraMake: fields["device.make"] ?? null,
  cameraModel: fields["device.model"] ?? null,
  width: fields["dimensions.width"] ?? null,
  height: fields["dimensions.height"] ?? null,
  software: fields.software ?? null,
};

console.log(JSON.stringify(asset, null, 2));

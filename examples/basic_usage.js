"use strict";

const path = require("node:path");
const xifty = require("..");

const fixture = path.resolve(__dirname, "../fixtures/happy.jpg");

console.log("XIFty package:", xifty.packageVersion());
console.log("XIFty core:", xifty.version());
console.log(JSON.stringify(xifty.extract(fixture, { view: "normalized" }), null, 2));

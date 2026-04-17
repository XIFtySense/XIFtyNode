"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "xifty-node-linux-smoke-"));

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const packResult = spawnSync("npm", ["pack", "--json"], {
  cwd: root,
  encoding: "utf8",
  stdio: ["inherit", "pipe", "inherit"],
});

if (packResult.status !== 0) {
  process.exit(packResult.status ?? 1);
}

const tarball = JSON.parse(packResult.stdout)[0].filename;
const tarballPath = path.join(root, tarball);
const fixturePath = path.join(root, "fixtures", "happy.jpg");

run("docker", [
  "run",
  "--rm",
  "--platform",
  "linux/amd64",
  "-v",
  `${tempRoot}:/work`,
  "-v",
  `${tarballPath}:/tmp/package.tgz:ro`,
  "-v",
  `${fixturePath}:/tmp/happy.jpg:ro`,
  "public.ecr.aws/sam/build-nodejs22.x:1.136.0",
  "bash",
  "-lc",
  [
    "set -euo pipefail",
    "cd /work",
    "npm init -y >/dev/null 2>&1",
    "npm install /tmp/package.tgz >/dev/null 2>&1",
    "node -e 'const x = require(\"@xifty/xifty\"); const out = x.extract(\"/tmp/happy.jpg\", { view: \"normalized\" }); if (out.input.detected_format !== \"jpeg\") { throw new Error(\"unexpected detected format\"); } console.log(JSON.stringify({ packageVersion: x.packageVersion(), detected: out.input.detected_format }));'",
  ].join(" && "),
]);

fs.rmSync(tarballPath, { force: true });
fs.rmSync(tempRoot, { recursive: true, force: true });

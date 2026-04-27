# AWS Lambda

`@xifty/xifty` is the recommended XIFty runtime for AWS Lambda. The
published package ships prebuilt native binaries for Lambda's standard
runtimes, so you do not need to compile from source in CI.

## Runtime targets

The published package currently bundles prebuilds for:

- `linux-x64` (Lambda `nodejs22.x`, most CI runners, general Linux servers)
- `macos-arm64` (Apple Silicon local development)

Each prebuild is exercised by smoke tests at publish time — if the
package made it to the registry, both prebuilds are known to load and
extract metadata from real fixtures.

## Quick start

The fastest path is to install the package directly into your Lambda
deployment (zip-style) or a Lambda Layer.

### Option 1 — Direct install in your function

```bash
npm install @xifty/xifty
```

Your handler:

```js
const xifty = require("@xifty/xifty");

exports.handler = async (event) => {
  const result = xifty.extract(event.path, { view: "normalized" });
  const fields = Object.fromEntries(
    result.normalized.fields.map((f) => [f.field, f.value.value])
  );
  return {
    statusCode: 200,
    body: JSON.stringify(fields),
  };
};
```

### Option 2 — Lambda Layer

Use `tools/build-node-lambda-layer.sh` from the [XIFty core
repo](https://github.com/XIFtySense/XIFty) to assemble a layer
containing only the `linux-x64` prebuild — keeps the layer slim and
under the 50 MB unzipped limit.

```bash
./tools/build-node-lambda-layer.sh ./layer-build ./xifty-lambda-layer.zip
```

Then upload the resulting zip as a Lambda Layer through the AWS
console, CDK, SAM, or Terraform.

## SAM example

A working SAM example is checked into the core repo:
[`examples/aws-sam-node`](https://github.com/XIFtySense/XIFty/tree/main/examples/aws-sam-node).
It demonstrates:

- A Lambda function consuming `@xifty/xifty`
- A SAM template wiring the function to an API Gateway
- Local invocation via `sam local invoke` against a real fixture
- Layer assembly + validation via the workflow used by the core repo's
  CI

See also the broader [Lambda adoption
guide](https://github.com/XIFtySense/XIFty/blob/main/docs/adoption/AWS_LAMBDA_NODE.md)
in the core repo.

## Performance notes

- The native library reads the input file once. Multi-view extracts
  (e.g. `view: "full"`) do not re-parse.
- For multi-GB inputs, only metadata atoms are read — the media payload
  is skipped. Cold-start memory should sit well under 256 MB even for
  drone MP4s.
- Cold-start cost dominates first-call latency. Subsequent invocations
  on a warm container reuse the loaded native module.

## Troubleshooting

- **"node-gyp-build failed to find prebuild"** on `arm64` Linux —
  `linux-arm64` is not currently a published prebuild target. Use a
  `linux-x64` Lambda runtime, or open an issue requesting `arm64`
  support.
- **"undefined symbol"** at load time — usually means the wrong glibc
  version. Lambda's Amazon Linux 2023 runtimes are tested; older
  Lambda runtimes (`nodejs16.x`, `nodejs18.x`) are end-of-life and
  unsupported.
- **Layer size limits** — keep only the platform you need. The prebuilds
  directory accepts surgical pruning before zipping.

# XIFty for Node.js

`@xifty/xifty` is the official Node.js package for XIFty.

It gives Node applications a typed, native bridge into XIFty’s metadata engine
so you can inspect files and extract metadata without shelling out to external
tools.

## Install

```bash
npm install @xifty/xifty
```

## What It Does

XIFty is built around four views of metadata:

- `raw`: direct extracted metadata values
- `interpreted`: decoded values with namespace meaning
- `normalized`: stable cross-format fields for application use
- `report`: issues and conflicts surfaced honestly

This package exposes the same model directly in Node.

## Quick Example

```js
const xifty = require("@xifty/xifty");

const result = xifty.extract("photo.jpg", { view: "normalized" });

console.log(result.input.detected_format);
console.log(result.normalized.fields);
```

## API

### `xifty.version(): string`

Returns the XIFty core version reported by the native library.

### `xifty.packageVersion(): string`

Returns the npm package version.

### `xifty.probe(path: string): XiftyEnvelope`

Detects the input format and returns a lightweight envelope describing the file.

Example:

```js
const probe = xifty.probe("image.jpg");
console.log(probe.input);
```

### `xifty.extract(path: string, options?): XiftyEnvelope`

Extracts metadata for the input file.

Supported `view` values:

- `"full"`
- `"raw"`
- `"interpreted"`
- `"normalized"`
- `"report"`

Example:

```js
const normalized = xifty.extract("image.jpg", { view: "normalized" });
const report = xifty.extract("image.jpg", { view: "report" });
```

## Output Shape

Every call returns a JSON-like envelope with the same top-level structure:

```js
{
  schema_version,
  input,
  raw,
  interpreted,
  normalized,
  report
}
```

That shape is intentionally close to the core CLI and C ABI so behavior stays
predictable across the XIFty ecosystem.

## TypeScript

The public wrapper is written in TypeScript and ships declaration files.

Example:

```ts
import { extract } from "@xifty/xifty";

const result = extract("image.jpg", { view: "normalized" });
```

## Supported Platforms

Current published-package target:

- `macos-arm64`

Release validation also confirms the native build on:

- `linux-x64`

Not supported right now:

- `macos-x64`
- `windows-*`
- other Linux architectures

If you install the package on an unsupported platform, it fails with a clear
native-build error instead of silently pretending support.

## Design Notes

- native seam: `xifty-ffi`
- Node bridge: `node-addon-api`
- package loader: `node-gyp-build`
- public surface: TypeScript + generated `.d.ts`

Those are implementation details, but they matter for reliability: this package
is a thin wrapper over the same XIFty core used elsewhere, not a separate
reimplementation.

## Local Development

```bash
npm install
npm test
npm run coverage
node examples/basic_usage.js
```

## Maintainer Notes

GitHub Actions no longer publish this package. The current release path is
local maintainer publish from an authenticated npm CLI session.

Maintainer builds no longer assume a sibling `../XIFty` checkout. The build
scripts resolve XIFty core in this order:

1. `XIFTY_CORE_DIR` if you explicitly point at a local checkout
2. a cached checkout of `https://github.com/XIFtySense/XIFty.git` at `main`

You can override the cached source with:

- `XIFTY_CORE_REPO`
- `XIFTY_CORE_REF`
- `XIFTY_CORE_CACHE_DIR`

Useful commands:

```bash
npm run core:prepare
npm run verify:package
npm run build:prebuilds
npm run publish:local
```

The local publish path ships the prebuilds present in `prebuilds/` at publish
time. Do not assume CI-validated platforms are automatically bundled into a
local release.

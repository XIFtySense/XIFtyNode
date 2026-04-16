# XIFtyNode

Node binding for XIFty.

This package is currently incubating against the XIFty core repository through
the stable `xifty-ffi` C ABI. The long-term npm package target is:

- `@xiftysense/xifty-node`

## Current Development Model

For now, local development expects a sibling checkout of the XIFty core repo:

- `../XIFty`

You can override that location with `XIFTY_CORE_DIR`.

## Local Development

```bash
npm install
npm test
node examples/basic_usage.js
```

If your core checkout is somewhere else:

```bash
XIFTY_CORE_DIR=/path/to/XIFty npm install
```

## Architecture

- native layer: `node-addon-api`
- core seam: `xifty-ffi`
- exchange format: JSON strings returned by the ABI and parsed in JavaScript

## Status

This repo is intended to become public-facing package infrastructure, but the
core XIFty engine is still private today. Until the core distribution story is
finalized, this package builds against a local XIFty checkout rather than a
published core binary artifact.


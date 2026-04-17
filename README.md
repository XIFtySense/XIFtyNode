# XIFtyNode

Node.js binding for XIFty.

Install:

```bash
npm install xifty
```

The package is built on top of the stable `xifty-ffi` C ABI and is intended to
be the canonical npm package for XIFty.

## Package Model

- published package: ships bundled native prebuilds for the supported runtime
  matrix
- repo development: can build from source against a sibling `../XIFty` checkout
- fallback override: set `XIFTY_CORE_DIR` if your core checkout lives elsewhere

The published package no longer expects consumers to have a local XIFty core
checkout.

## Supported Platforms

The current supported package matrix is intentionally narrow:

- `macos-arm64`
- `linux-x64`

Out of scope for this package today:

- `macos-x64`
- `windows-*`
- other Linux architectures

## Local Development

```bash
npm install
npm test
node examples/basic_usage.js
```

If your core checkout is somewhere else, point the source build scripts at it:

```bash
XIFTY_CORE_DIR=/path/to/XIFty npm install
```

To regenerate native prebuilds locally:

```bash
XIFTY_CORE_DIR=/path/to/XIFty npm run build:prebuilds
```

## Architecture

- native layer: `node-addon-api`
- core seam: `xifty-ffi`
- distribution model: bundled `prebuildify` binaries loaded via `node-gyp-build`
- exchange format: JSON strings returned by the ABI and parsed in JavaScript

## Release Model

- `CI` validates the package against the public XIFty core repo
- `publish.yml` builds platform prebuilds and publishes to npm from GitHub
  Actions
- release matrix: `macos-arm64`, `linux-x64`
- preferred auth: npm trusted publishing from GitHub Actions
- fallback auth: `NPM_TOKEN` GitHub Actions secret backed by a granular
  read/write token with `Bypass two-factor authentication` enabled
- the actual public publish should happen from the release workflow after it has
  merged the platform prebuild artifacts, not from a single maintainer machine

## Maintainer Setup

Before the release workflow can publish automatically:

1. Configure npm trusted publishing for `XIFtySense/XIFtyNode`
   for npm package `xifty`
2. Point it at workflow filename `publish.yml`
3. If trusted publishing cannot be configured yet, create a granular npm access
   token with `Read and write` package permission and `Bypass two-factor
   authentication` enabled, then store it as repo secret `NPM_TOKEN`
4. After trusted publishing is working, prefer that path and retire the token
   fallback

Do not rely on a one-off local maintainer publish unless you have assembled the
full multi-platform `prebuilds/` set first. The intended shipping path is the
GitHub release workflow.

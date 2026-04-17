# XIFtyNode

Node.js binding for XIFty.

Install:

```bash
npm install xifty
```

The package is built on top of the stable `xifty-ffi` C ABI and is intended to
be the canonical npm package for XIFty.

## Package Model

- published package: ships bundled native prebuilds for supported platforms
- repo development: can build from source against a sibling `../XIFty` checkout
- fallback override: set `XIFTY_CORE_DIR` if your core checkout lives elsewhere

The published package no longer expects consumers to have a local XIFty core
checkout.

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
- npm publishing is intended to use trusted publishing from GitHub Actions
  rather than long-lived npm tokens

## Maintainer Setup

Before the release workflow can publish automatically:

1. Configure npm trusted publishing for `XIFtySense/XIFtyNode`
   for npm package `xifty`
2. Point it at workflow filename `publish.yml`
3. After trusted publishing works, set package publishing access on npm to
   `Require two-factor authentication and disallow tokens`

If npm requires the package to exist before trusted publishing can be configured,
do one initial maintainer publish manually with:

```bash
npm publish --access public
```

Then switch subsequent releases to GitHub Actions trusted publishing.

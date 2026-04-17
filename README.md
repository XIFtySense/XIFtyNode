# XIFtyNode

Node.js binding for XIFty.

Install:

```bash
npm install xifty
```

The package is built on top of the stable `xifty-ffi` C ABI and is intended to
be the canonical npm package for XIFty.

## Package Model

- published package: ships whatever prebuilds are assembled into the local
  package before publish
- repo development: can build from source against a sibling `../XIFty` checkout
- fallback override: set `XIFTY_CORE_DIR` if your core checkout lives elsewhere
- public wrapper: TypeScript source compiled to CommonJS + `.d.ts`

The published package no longer expects consumers to have a local XIFty core
checkout.

## Current Package Support

The current local publish path is intentionally narrow:

- `macos-arm64`

CI validation also confirms the native build on:

- `linux-x64`

Out of scope for the published package today:

- `macos-x64`
- `windows-*`
- other Linux architectures

## Local Development

```bash
npm install
npm test
npm run coverage
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

To validate the exact package contents locally:

```bash
npm run verify:package
```

To publish from your local machine with your authenticated npm CLI:

```bash
XIFTY_CORE_DIR=/path/to/XIFty npm run publish:local
```

That local publish flow currently ships the prebuilds present in `prebuilds/` at
publish time. On a newer Mac, that means the local release path is currently
`macos-arm64` unless you explicitly assemble additional platform prebuilds
before publishing.

## Architecture

- native layer: `node-addon-api`
- core seam: `xifty-ffi`
- distribution model: bundled `prebuildify` binaries loaded via `node-gyp-build`
- exchange format: JSON strings returned by the ABI and parsed in JavaScript
- public wrapper: TypeScript source with generated declaration files

## Release Model

- `CI` validates the package against the public XIFty core repo
- `publish.yml` is now release validation only
- GitHub Actions no longer publishes to npm
- the current publish path is local maintainer publish via an authenticated npm
  CLI session
- release validation matrix: `macos-arm64`, `linux-x64`

## Maintainer Setup

Before publishing locally:

1. Ensure your npm CLI session is authenticated
2. Build the local prebuild set you intend to ship
3. Run `npm run verify:package`
4. Run `npm run publish:local`

Do not assume CI-validated platforms are automatically included in a local npm
publish. The local publish path ships only the prebuilds assembled in your
working tree.

# Local development

This document is for working on `@xifty/xifty` itself — building from
source, running tests, and iterating on the native bridge. Releasing
new versions is covered in [RELEASING.md](../RELEASING.md).

## Setup

```bash
git clone git@github.com:XIFtySense/XIFtyNode.git
cd XIFtyNode
npm install
```

`npm install` will trigger a source build of the native addon if no
prebuild matches your platform. On supported platforms (Apple Silicon
macOS, Linux x64) the bundled prebuild is used and no Rust toolchain is
required.

## Building from source

To build the native addon explicitly (e.g. after changing the XIFty
core or `xifty-ffi`):

```bash
npm run build:debug          # debug profile, fast iteration
npm run build                # release profile + TS compile
npm run build:prebuilds      # produces ./prebuilds/<platform>/...
```

By default the build resolves the XIFty core in this order:

1. `XIFTY_CORE_DIR` if set — use a local checkout
2. Cached clone of `https://github.com/XIFtySense/XIFty.git` at `main`

Override via:

| Variable | Effect |
|---|---|
| `XIFTY_CORE_DIR` | Point at a local checkout of the core repo |
| `XIFTY_CORE_REPO` | Override the upstream repo URL |
| `XIFTY_CORE_REF` | Pin to a specific tag/branch/SHA |
| `XIFTY_CORE_CACHE_DIR` | Where the cached clone lives |
| `XIFTY_CARGO_PROFILE` | `debug` or `release` (default `release`) |
| `XIFTY_FORCE_BUILD` | `1` to skip prebuild lookup and always source-build |

## Tests

```bash
npm test                     # node --test test/*.test.js
npm run coverage             # via c8
```

The test suite covers:

- Native addon loading
- Round-trip of `extract` and `probe` against checked-in fixtures
- View selection (`raw`, `interpreted`, `normalized`, `report`, `full`)
- Error handling (missing files, invalid view names, malformed inputs)

## Examples

```bash
node examples/basic_usage.js
node examples/gallery_ingest.js
```

The `basic_usage.js` example extracts metadata from a JPEG fixture and
prints the normalized fields. `gallery_ingest.js` walks a directory and
builds a metadata index — closer to a real ingestion pipeline.

## Useful commands during development

```bash
npm run core:prepare         # ensure XIFty core is fetched + cached
npm run verify:package       # sanity-check `npm pack` contents
npm run verify:tarball       # pack + smoke the tarball end-to-end
npm run verify:linux-x64     # smoke just the linux-x64 prebuild
```

`verify:tarball` is the highest-confidence check before publishing —
it tests what consumers actually install, not what's on disk.

## Releasing

See [RELEASING.md](../RELEASING.md). Short version: bump version, push
tag, run `npm run publish:local` from a machine that has Docker and a
bypass-2fa npm token in `~/.npmrc`.

## Code layout

- `src/index.ts` — the public TypeScript surface
- `src/addon.cc` — the C++ Node addon glue (uses `node-addon-api`)
- `binding.gyp` — native build config
- `scripts/` — install hook, build helpers, smoke tests
- `test/` — unit and integration tests
- `examples/` — runnable usage examples

The native bridge intentionally stays thin: all metadata logic lives in
the [XIFty core](https://github.com/XIFtySense/XIFty) Rust workspace,
and this package is just a typed Node entry point onto `xifty-ffi`.

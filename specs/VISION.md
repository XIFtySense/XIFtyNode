# VISION — XIFtyNode (`@xifty/xifty`)

## Purpose

`@xifty/xifty` is the official Node.js package for XIFty. It gives Node
applications a typed, native bridge (N-API via `node-addon-api`) into
XIFty's metadata engine so they can inspect files and extract metadata
without shelling out to external tools.

The package exposes XIFty's four views of metadata — `raw`, `interpreted`,
`normalized`, and `report` — directly to JavaScript/TypeScript consumers
with stable, documented TypeScript types.

## Principles

1. **Typed surface first.** Every public API has precise TypeScript types.
   Types are the contract — implementation changes must not break them
   silently.
2. **Prebuilt binaries are the happy path.** Installing the package on
   a supported platform MUST NOT require a compiler, Python, or
   `node-gyp`. Prebuilds cover the matrix; source builds are fallback only.
3. **Source builds are opt-in.** Native compilation runs only when the
   user sets `XIFTY_BUILD_FROM_SOURCE=1`. Never default to source builds,
   never run `node-gyp` silently during `npm install`.
4. **Packed-package parity.** What a user installs from npm MUST behave
   identically to what tests in this repo exercise. Smoke tests run
   against the packed tarball, not just the working tree.
5. **Honest reporting.** The `report` view surfaces conflicts and
   extraction issues rather than hiding them. The Node wrapper preserves
   this — it does not silently drop fields or normalize away problems.
6. **No hidden shelling out.** The whole point is a native binding. The
   package MUST NOT exec external binaries at runtime.
7. **Release discipline.** Versions bump only through explicit release
   tasks. Prebuild artifacts and the published tarball are produced by
   the release pipeline, not ad-hoc from a developer machine.

## Non-Goals

- **Not a CLI.** This package is a library. A separate CLI package may
  exist elsewhere; this repo does not ship one.
- **Not a re-implementation of XIFty core.** Metadata logic lives in the
  native engine. The Node package is a thin, typed bridge.
- **Not a Deno/Bun package.** Node 20+ only. Cross-runtime support is
  out of scope for now.
- **Not ESM-first.** The package ships as CommonJS (`main`: `dist/index.js`)
  with type declarations. ESM compatibility comes from Node's CJS interop.
- **No bundled binaries for unsupported platforms.** If the prebuild
  matrix does not cover a platform, users get a clear error and the
  opt-in source-build path — not a silent broken install.
- **No telemetry, no network calls.** Extraction runs locally against
  the file the caller passes in.

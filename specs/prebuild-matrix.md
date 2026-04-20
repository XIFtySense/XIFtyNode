# Spec — Prebuild Matrix

## Scope

This spec scopes the native-addon prebuild pipeline for `@xifty/xifty`:
how platform-specific binaries are produced, laid out on disk, published
with the npm tarball, and selected at install time. It does NOT scope
the release-pipeline orchestration that drives these builds on a tagged
commit (see [`release-pipeline.md`](./release-pipeline.md)) or the
public TypeScript surface the binding is bound to
(see [`typescript-surface.md`](./typescript-surface.md)).

## Anchors

- **SRS**: [`SRS.md`](./SRS.md) section 2 (addon packaging), section 5
  (Platform Matrix), section 6 (Release Guardrails).
- **VISION**: [`VISION.md`](./VISION.md) principle 2 ("Prebuilt binaries
  are the happy path") and principle 3 ("Source builds are opt-in").
- **Code**:
  - `binding.gyp` — node-gyp target definition.
  - `scripts/prebuild.js` — local single-host prebuild (`build:prebuilds:local`).
  - `scripts/prebuild-linux-x64.js` — Linux x64 dockerized prebuild
    (`build:prebuilds:linux-x64`).
  - `scripts/prebuild-release.js` — full release matrix entry point
    (`build:prebuilds`).
  - `scripts/smoke-linux-x64.js` — linux-x64 packed-tarball smoke
    (`verify:linux-x64`).
  - `scripts/install.js` — install-time binding resolution; routes to
    prebuild-first, source-build-on-opt-in.
  - `scripts/build-addon.js` — source-build path invoked when
    `XIFTY_BUILD_FROM_SOURCE=1`.
  - `prebuilds/<platform>-<arch>/` — prebuildify layout consumed by
    `node-gyp-build` at runtime.

## Platform Matrix

Per SRS section 5, the minimum target matrix is:

- Linux x64 (glibc)
- Linux arm64 (glibc)
- macOS x64
- macOS arm64
- Windows x64

Current release coverage (per `src/index.ts` install-error guidance) is
macOS arm64 and Linux x64; the remaining platforms are tracked as
roadmap gaps, not silent failures — the install error names each
unsupported target explicitly. Any change to the matrix MUST update both
`src/index.ts`'s unsupported-platform error message and this spec in
the same PR.

## Acceptance Criteria

A change under this spec is acceptable when:

1. **Matrix parity.** Every platform claimed by `src/index.ts` as
   "supported" has a corresponding `prebuilds/<platform>-<arch>/` entry
   produced by the release matrix script.
2. **No silent source-build fallback.** `scripts/install.js` MUST NOT
   invoke `node-gyp` unless `XIFTY_BUILD_FROM_SOURCE=1` is set in the
   environment; a missing prebuild on an unsupported platform MUST
   produce a clear error naming the unsupported target (the message
   currently in `src/index.ts`).
4. **Install-time resolution is prebuild-first.** `node-gyp-build`
   resolves against `prebuilds/` before any compiler is touched.
5. **Consumer-facing error text stays accurate.** If the matrix
   changes, the unsupported-platform message in `src/index.ts`
   (the string beginning "@xifty/xifty does not ship a native build…")
   MUST be updated in the same change.

## Additional Validation Gates

In addition to the three base gates in `.loswf/config.yaml`
(`typecheck`, `test`, `verify-package`):

- `npm run verify:linux-x64` — runs `scripts/smoke-linux-x64.js`
  against the packed tarball for Linux x64. MUST pass for any PR that
  touches the prebuild pipeline or `binding.gyp`.
- `npm run verify:tarball` — runs `scripts/smoke-packed-package.js`,
  the cross-platform packed-tarball smoke. MUST pass for any prebuild
  change.

A future `prebuild-smoke` gate covering the full matrix is a follow-up
item; wiring it into `.loswf/config.yaml` is out of scope for this
spec.

## Out of Scope

- Release tagging, version bumps, and `npm publish` orchestration
  (see [`release-pipeline.md`](./release-pipeline.md)).
- The TypeScript public API shape (see
  [`typescript-surface.md`](./typescript-surface.md)).
- Cross-runtime support (Deno, Bun, browser) — explicitly ruled out by
  VISION non-goals.
- Adding platforms beyond the SRS section 5 matrix.

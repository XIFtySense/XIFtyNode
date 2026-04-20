# Spec — Release Pipeline

## Scope

This spec scopes the release plumbing for `@xifty/xifty`: how a tagged
commit becomes a published npm tarball with prebuild artifacts attached,
and the guardrails that keep that pipeline honest. It does NOT scope
the matrix of platforms being built (see
[`prebuild-matrix.md`](./prebuild-matrix.md)) or the TypeScript public
surface (see [`typescript-surface.md`](./typescript-surface.md)).

## Anchors

- **SRS**: [`SRS.md`](./SRS.md) section 2 (release plumbing), section 6
  (Release Guardrails).
- **VISION**: [`VISION.md`](./VISION.md) principle 7
  ("Release discipline") and principle 4 ("Packed-package parity").
- **Code**:
  - `package.json` `scripts.publish:local` (line 51) — the full
    release chain. The script is not a single command; it is an
    ordered pipeline:
    1. `npm run build:prebuilds` → `node scripts/prebuild-release.js`
       produces every platform prebuild for the release matrix.
    2. `npm run verify:package` → `node scripts/verify-package.js`
       validates the `package.json` `files` manifest and the packed
       tarball contents.
    3. `npm run verify:tarball` → `node scripts/smoke-packed-package.js`
       runs a cross-platform packed-tarball smoke.
    4. `npm run verify:linux-x64` → `node scripts/smoke-linux-x64.js`
       runs the Linux x64 packed-tarball smoke.
    5. `npm publish --access public` actually publishes the tarball.
  - `scripts/prebuild-release.js` — prebuild matrix driver.
  - `scripts/verify-package.js` — tarball / `files` manifest check.
  - `scripts/smoke-packed-package.js` — cross-platform packed smoke.
  - `scripts/smoke-linux-x64.js` — linux-x64 packed smoke.
  - `package.json` `scripts.prepack` (line 57) — runs `build:ts` so
    the `dist/` in the published tarball is always freshly compiled.
- **Guardrails** (`.loswf/config.yaml` lines 46-51):
  - Never push directly to `main`; all changes go through a PR.
  - Never use `--no-verify` on git commits.
  - Do not bump `package.json` `version` without an explicit release
    task.

## Acceptance Criteria

A change under this spec is acceptable when:

1. **Tagged-commit parity.** The git commit that produces the prebuild
   artifacts MUST be the same commit whose `package.json` `version` is
   tagged and whose tarball is published. The `publish:local` chain
   runs prebuilds and publish on a single working tree — no recipe may
   split them across commits.
2. **All pre-publish gates run.** Any change to `publish:local` MUST
   preserve the ordered chain `build:prebuilds` →
   `verify:package` → `verify:tarball` → `verify:linux-x64` →
   `npm publish`. Removing or reordering steps is a breaking change to
   this spec.
3. **No hook bypass.** Commits made by the release task MUST NOT use
   `--no-verify`. The repo guardrail is absolute; no release recipe may
   add a bypass.
4. **No incidental version bumps.** `package.json` `version` changes
   ONLY in a commit whose sole purpose is a release. A feature, fix, or
   docs PR MUST NOT modify `version`.
5. **Prepack invariant.** `prepack` MUST continue to run `build:ts` so
   `dist/` in the published tarball matches `src/` at the tagged
   commit.
6. **Files manifest integrity.** `scripts/verify-package.js` MUST pass;
   the published tarball contains exactly the `files` entries declared
   in `package.json` (`binding.gyp`, `dist/**`, `prebuilds/**`,
   `scripts/**`, `src/**`, `README.md`, `LICENSE`) and nothing else.

## Additional Validation Gates

In addition to the three base gates in `.loswf/config.yaml`
(`typecheck`, `test`, `verify-package`):

- `npm run verify:tarball` — packed-tarball smoke (`smoke-packed-package.js`).
- `npm run verify:linux-x64` — Linux x64 packed-tarball smoke.

Both SHOULD run for any PR that touches the release chain, `binding.gyp`,
or files entering the published tarball.

## Out of Scope

- The per-platform build matrix itself — scoped by
  [`prebuild-matrix.md`](./prebuild-matrix.md).
- The TypeScript public API — scoped by
  [`typescript-surface.md`](./typescript-surface.md).
- CI workflow automation: `.loswf/config.yaml` sets `ci_check: false`
  because workflow runs are currently flaky. Re-enabling CI as a gate
  is a separate follow-up.
- A fully remote release pipeline (GitHub Actions driven release).
  `publish:local` is the current source of truth; moving to a
  workflow-driven release is a future change.

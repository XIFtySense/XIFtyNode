# SRS — XIFtyNode (`@xifty/xifty`)

## 1. Purpose

This document is the living Software Requirements Specification for the
`@xifty/xifty` Node.js package. It captures the contract between the
published npm package and its consumers: the TypeScript surface, the
native binding behavior, the prebuild/source-build matrix, and the
release pipeline.

Detailed requirements for each capability live under `specs/` as
individual spec files (one per factory unit of work). This file is the
index and the home for cross-cutting validation configuration.

## 2. Scope

In scope:

- The public JavaScript/TypeScript API exposed by `require("@xifty/xifty")`.
- Native addon packaging: `binding.gyp`, `prebuildify` output layout,
  and the install-time resolution order (prebuild first, source-build
  only when opted in).
- Release plumbing: version bumps, tag conventions, npm publish, and
  prebuild artifact attachment.
- Smoke tests that run against the packed tarball (`npm pack` output).

Out of scope (see VISION non-goals):

- A separate CLI surface.
- Deno / Bun / browser targets.
- Re-implementing XIFty core extraction logic in JavaScript.

## 3. Specs Index

Scoped capability specs live alongside this document:

- [`prebuild-matrix.md`](./prebuild-matrix.md) — native-addon prebuild
  pipeline, platform matrix, and install-time binding resolution
  (VISION principles 2 & 3; SRS sections 2 and 5).
- [`release-pipeline.md`](./release-pipeline.md) — version/tag/publish
  plumbing, prebuild-artifact parity, and release guardrails
  (VISION principle 7; SRS section 6).
- [`typescript-surface.md`](./typescript-surface.md) — the public
  JavaScript/TypeScript API contract, module shape, and typecheck
  gate (VISION principle 1; SRS section 2).

The current roadmap order is tracked in the `factory:roadmap` issue on
GitHub. Drafts under `specs/drafts/` are curator proposals awaiting
triage.

## 4. Validation Configuration

Every spec inherits the repo-wide validation gates defined in
`.loswf/config.yaml` under `validate:`:

| Gate            | Command                          | Purpose                                                 |
| --------------- | -------------------------------- | ------------------------------------------------------- |
| typecheck       | `tsc -p tsconfig.json --noEmit`  | Public TypeScript surface stays well-typed.             |
| test            | `npm test`                       | Node test runner exercises the binding + JS layer.      |
| verify-package  | `npm run verify:package`         | Packed tarball smoke test — parity with published pkg.  |

Rules:

- All three gates MUST pass before a PR merges.
- CI workflow runs are currently flaky and are NOT used as a gate
  (`ci_check: false` in `.loswf/config.yaml`).
- Individual specs MAY add additional validation commands (for example,
  a prebuild matrix spec may add a `prebuild-smoke` gate), but they
  MUST NOT remove or weaken the three base gates.
- New source files under `src/` MUST ship with tests under `test/`.
  This is enforced as a repo guardrail, not just convention.

## 5. Platform Matrix

The prebuild matrix (canonical list lives in the prebuild spec once
filed) targets, at minimum:

- Linux x64 (glibc)
- Linux arm64 (glibc)
- macOS x64
- macOS arm64
- Windows x64

Platforms outside the matrix fall through to the opt-in source build
(`XIFTY_BUILD_FROM_SOURCE=1`). There is no silent source-build fallback.

## 6. Release Guardrails

- Version bumps happen only via an explicit release task — never as a
  side effect of another change.
- `--no-verify` on commits is prohibited (repo guardrail).
- Pushes go through a branch + PR; no direct pushes to `main`.
- The published tarball and the prebuild artifacts MUST come from the
  same tagged commit.

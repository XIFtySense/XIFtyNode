# Spec — TypeScript Public Surface

## Scope

This spec scopes the public JavaScript/TypeScript API that `@xifty/xifty`
exposes to consumers of `require("@xifty/xifty")`: the exported types,
exported functions, module shape, and the typechecking gate that guards
them. It does NOT scope the native binding's internal C++ surface, the
prebuild matrix (see [`prebuild-matrix.md`](./prebuild-matrix.md)), or
the release pipeline (see [`release-pipeline.md`](./release-pipeline.md)).

## Anchors

- **SRS**: [`SRS.md`](./SRS.md) section 2 (public JS/TS API) and
  section 4 (Validation Configuration, `typecheck` gate).
- **VISION**: [`VISION.md`](./VISION.md) principle 1
  ("Typed surface first") and the "Not ESM-first" non-goal
  (CommonJS shipping shape).
- **Code**:
  - `src/index.ts` — single source of truth for the exported API
    (types `ViewName`, `ExtractOptions`, `InputSummary`, `Provenance`,
    `TypedValue`, `NormalizedField`, `ReportIssue`, `ReportConflict`,
    `XiftyEnvelope`; functions `packageVersion`, `version`, `probe`,
    `extract`; default export).
  - `tsconfig.json` — compiler settings that produce `dist/`.
  - `dist/index.d.ts` — the declaration file consumers actually see
    (published as `types` in `package.json`).
  - `package.json` `exports` block (lines 8-14) — the module shape
    contract: `types` → `./dist/index.d.ts`, `require` and `default` →
    `./dist/index.js`. No `import` conditional: this package is CJS.
  - `package.json` `main` (line 6) and `types` (line 7) — legacy
    resolution fallbacks; MUST stay in sync with `exports`.

## Acceptance Criteria

A change under this spec is acceptable when:

1. **Every public symbol is typed.** Every `export` from `src/index.ts`
   (types, interfaces, functions, default export) has a precise type
   declaration; no `any` on public signatures.
2. **`tsc -p tsconfig.json --noEmit` passes.** This is the first
   `validate` gate in `.loswf/config.yaml` (line 36) and is the
   binding contract for the type surface.
3. **`dist/index.d.ts` is the published surface.** The declarations
   emitted into `dist/index.d.ts` match the exports from `src/index.ts`;
   consumers MUST NOT need to reach into implementation files for
   types.
4. **CommonJS-only module shape.** `package.json` `exports` stays
   CJS-only (`require` + `default` pointing at `./dist/index.js`).
   Adding an `import` conditional or shipping ESM output is a breaking
   change to this spec and requires an explicit release task.
5. **`main`, `types`, and `exports` agree.** If the emitted filenames
   change, all three MUST be updated in the same PR.
6. **Breaking type changes require a release task.** Renaming,
   removing, or narrowing an exported type is a breaking change and
   MUST be paired with an explicit version bump via the release
   pipeline (see [`release-pipeline.md`](./release-pipeline.md)) — not
   slipped into an unrelated PR.
7. **Envelope views stay stable.** The `ViewName` union
   (`full | raw | interpreted | normalized | report`) matches the four
   views named in VISION ("raw", "interpreted", "normalized",
   "report") plus the default `full` envelope. Adding a view is an
   additive change; removing or renaming one is breaking.

## Additional Validation Gates

No additional gates beyond the three in `.loswf/config.yaml`. The
`typecheck` gate is the core guard for this spec; `test` exercises the
runtime shape; `verify-package` confirms `dist/index.d.ts` ships in the
tarball.

## Out of Scope

- **Modifying current implementation.** This spec describes the
  contract the surface must satisfy; it is not a demand to refactor
  `src/index.ts` in the PR that introduces this spec. Existing code is
  presumed compliant unless a specific follow-up issue says otherwise.
- The native binding's C++ surface (`binding.gyp` / `src/*.cc`).
- Prebuild matrix behavior and install-time resolution
  (see [`prebuild-matrix.md`](./prebuild-matrix.md)).
- Release orchestration (see [`release-pipeline.md`](./release-pipeline.md)).
- ESM support and cross-runtime targets (Deno/Bun/browser) — explicit
  VISION non-goals.

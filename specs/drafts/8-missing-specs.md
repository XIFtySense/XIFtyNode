<!-- loswf:plan -->
# Plan #8: File the missing `specs/` capability specs (prebuild-matrix, release-pipeline, typescript-surface)

## Problem
`specs/SRS.md` section 3 (lines 33-38) promises "Individual specs will be filed under `specs/` as they are scoped out," but `specs/` currently contains only `SRS.md`, `VISION.md`, and an empty `drafts/.gitkeep`. VISION's three core capability areas — the prebuild matrix (VISION principle 2; SRS section 5), the TypeScript public surface (VISION principle 1; SRS section 2), and the release pipeline (VISION principle 7; SRS section 6) — have no scoped spec files. Without them, factory agents have no per-capability acceptance criteria beyond the three base gates (`typecheck`, `test`, `verify-package`) defined in `.loswf/config.yaml` lines 34-40, and the `factory:roadmap` issue (#4) has nothing concrete to link to.

## Approach
This is a docs-only issue (label `factory:type:docs`). Draft three new spec files under `specs/` — one per in-scope capability — each following a consistent template: Scope, SRS/VISION anchors, Acceptance Criteria, Additional Validation Gates (if any), and Out-of-Scope. Each spec cites concrete file/line references in the repo (`package.json`, `scripts/*.js`, `src/index.ts`, `binding.gyp`, `.loswf/config.yaml`) so downstream builders have unambiguous targets. Update `specs/SRS.md` section 3 to list the new specs inline. Add a follow-up checklist to the `factory:roadmap` issue (#4) linking the three new specs. No code changes.

## Files to touch
- `specs/SRS.md` — replace the placeholder prose in section 3 (lines 33-38) with an actual index of the new specs; keep the drafts-directory note.

## New files
- `specs/prebuild-matrix.md` — scopes the platform prebuild pipeline (SRS section 5, VISION principle 2). Anchors: `scripts/prebuild.js`, `scripts/prebuild-linux-x64.js`, `scripts/prebuild-release.js`, `scripts/smoke-linux-x64.js`, `prebuilds/` layout, `binding.gyp`, `scripts/install.js`. Declares acceptance criteria for matrix coverage (linux x64/arm64 glibc, macOS x64/arm64, win x64) and proposes an optional `prebuild-smoke` validation gate.
- `specs/release-pipeline.md` — scopes versioning, tagging, publish, and artifact attachment (SRS section 6, VISION principle 7). Anchors: `scripts/prebuild-release.js`, `scripts/verify-package.js`, `scripts/smoke-packed-package.js`, `package.json` `publish:local` script, repo guardrails (`.loswf/config.yaml` lines 46-51). Criteria include tagged-commit parity between prebuild artifacts and published tarball, prohibition on hook-bypass commits, no accidental version bumps.
- `specs/typescript-surface.md` — scopes the public TS API contract (SRS section 2, VISION principle 1). Anchors: `src/index.ts`, `dist/index.d.ts`, `package.json` `exports` block (lines 8-14), `tsconfig.json`. Criteria include: all public functions typed, `tsc --noEmit` passes, CommonJS-only module shape preserved, breaking type changes require a release task.

## Step-by-step
1. Create `specs/prebuild-matrix.md` with the template above, referencing the concrete scripts and `binding.gyp`. Verifiable: file exists, cites `SRS.md` section 5 and `VISION.md` principle 2 by name, lists the five-platform matrix, declares 3 or more acceptance criteria.
2. Create `specs/release-pipeline.md`. Verifiable: file exists, cites `SRS.md` section 6 and `VISION.md` principle 7, references `publish:local` in `package.json`, lists tagged-commit/prebuild-parity criterion.
3. Create `specs/typescript-surface.md`. Verifiable: file exists, cites `SRS.md` section 2 and `VISION.md` principle 1, references `src/index.ts` and `dist/index.d.ts`, lists the `tsc --noEmit` gate and the CJS-only constraint.
4. Edit `specs/SRS.md` section 3 to list the three new specs with relative links; preserve the `specs/drafts/` triage note. Verifiable: grep for the three spec filenames in `specs/SRS.md` returns three hits.
5. Append a checklist to the `factory:roadmap` issue (#4) body (via `gh issue edit 4 --body-file ...` or a comment) linking the three new specs. Verifiable: `gh issue view 4` shows the three links.

## Tests
- Docs-only change; the three base gates still run but are no-ops for Markdown.
- Ad-hoc verification: `ls specs/*.md` lists five files (SRS, VISION, three new specs). `rg -l "VISION principle|SRS section" specs/` hits each new spec.
- No new `src/` files, so the "every src file has a test" guardrail does not trigger.

## Validation
- `tsc -p tsconfig.json --noEmit` (from `.loswf/config.yaml` validate[0]) — must still pass; no code touched.
- `npm test` (validate[1]) — must still pass.
- `npm run verify:package` (validate[2]) — must still pass; `specs/` is not in `package.json` `files`, so the tarball is unchanged.

## Risks
- Scope creep into typescript-surface spec. The current `src/index.ts` may already diverge from what the spec would demand; the spec must describe what should be true without being read as a demand to change code in this PR. Mitigation: explicit "Out of Scope: modifying current implementation" clause in that spec.
- Roadmap update permission. Editing issue #4 body requires write access; if the bot token lacks it, fall back to a comment on #4 instead.
- Duplication with SRS. The new specs must not restate SRS content verbatim; they must add per-capability acceptance criteria. Mitigation: each spec explicitly links to SRS sections rather than copying them.
- Additional validation gates. The prebuild-matrix spec may propose a `prebuild-smoke` gate but wiring it into `.loswf/config.yaml` is out of scope for this docs issue — call it out as a follow-up.


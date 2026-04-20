<!-- loswf:plan -->
# Plan #11: Add a reliable macos-arm64 leg to the CI workflow

## Problem
`.github/workflows/ci.yml` runs a single `test` job pinned to `ubuntu-latest` (lines 18-19), so every push to `main` and every PR only exercises `linux-x64`. The package's supported prebuild targets include `darwin-arm64`, but that target is only validated by `.github/workflows/publish.yml` (the `Release Validate` workflow), which is `workflow_dispatch`-only (line 4). A regression in the macOS binding surface or the macOS Rust/N-API build will not be caught until someone manually dispatches a release validation. `.loswf/config.yaml` has `ci_check: false` (line 43) because CI has been flaky, so adding a macOS leg that is itself flaky would make the situation worse rather than better.

## Approach
Convert the existing single-runner `test` job in `ci.yml` into a matrix job whose two legs (`linux-x64` on `ubuntu-latest`, `macos-arm64` on `macos-14`) mirror the exact step sequence that already works in `publish.yml`'s `prebuild` matrix (lines 17-73). That workflow's macos-14 leg has been green for releases (last successful release was 0.1.7, commit 2c9b035), so cloning its recipe — same checkout layout, same `dtolnay/rust-toolchain@stable`, same `Swatinem/rust-cache@v2` workspace pointer, same Node 24 setup with npm cache, same `XIFTY_CORE_DIR` env — is the lowest-risk way to introduce the leg. Pin the runner images to concrete versions (`ubuntu-24.04`, `macos-14`) to avoid `*-latest` drift, set `fail-fast: false` so a flake on one OS doesn't mask a real failure on the other, and add a `timeout-minutes` cap so a hung Rust build fails fast. Prebuilds are gitignored (`.gitignore` line 5), so the issue's alternative suggestion of loading a committed darwin-arm64 prebuild is not available — the macOS leg must compile from source, same as the Linux leg already does.

## Files to touch
- `.github/workflows/ci.yml` — convert the single `test` job into a matrix spanning `linux-x64` / `macos-arm64`; pin runner images; add `fail-fast: false` and `timeout-minutes`.

## New files
- None.

## Step-by-step
1. In `.github/workflows/ci.yml`, replace `runs-on: ubuntu-latest` (line 19) with a `strategy.matrix.include` block containing two entries: `{ name: linux-x64, runs_on: ubuntu-24.04 }` and `{ name: macos-arm64, runs_on: macos-14 }`. Set `strategy.fail-fast: false`. Set the job name to include `${{ matrix.name }}` so both legs appear distinctly in the Checks UI. Outcome: `gh workflow view CI` (or the raw YAML) shows two jobs per trigger.
2. Set `runs-on: ${{ matrix.runs_on }}` and add `timeout-minutes: 25` on the `test` job (publish.yml uses 20 for prebuilds; CI adds tests + tarball smoke + example, so 25 is a conservative cap). Outcome: a hung build is killed instead of hanging the whole CI.
3. Keep every existing step in place — checkout binding repo, checkout `XIFtySense/XIFty` core repo, Rust toolchain, `Swatinem/rust-cache@v2` with `XIFty -> target`, Node 24 with npm cache, `npm ci --ignore-scripts`, `npm run build` with `XIFTY_CORE_DIR`, `npm test`, `npm run verify:tarball`, `npm run example`. No step ordering changes. Outcome: diff is scoped strictly to the job header + matrix; every existing step is byte-identical.
4. Confirm the matrix does not inadvertently double-cache: `Swatinem/rust-cache@v2` keys off `runs_on` and job name, so the two legs get separate caches automatically. No `key:` override needed. Outcome: both legs cache independently, neither evicts the other.
5. Run the factory validate gates locally to confirm the YAML change hasn't affected the package surface (these gates don't exercise CI itself, but must still be green per SRS section 4). Outcome: `tsc -p tsconfig.json --noEmit`, `npm test`, `npm run verify:package` all pass.
6. After the PR is open, a workflow run will fire on the PR itself. Confirm both matrix legs go green on that PR before merge. Outcome: `gh pr checks <num>` shows `CI / test (linux-x64)` and `CI / test (macos-arm64)` both succeeded. If the macOS leg fails for a non-regression reason (runner-image issue, transient network), debug rather than removing the leg — the whole point is reliability.

## Tests
- The change is to CI workflow YAML only; there is no source code under `src/` being modified, so no new test files under `test/` are required (the "new source files need tests" guardrail does not apply to workflow YAML).
- The workflow itself is its own test: the PR run must show both legs green. Capture a screenshot or `gh run view` output in the PR description as evidence for the reviewer.
- No changes to the existing `test/*.test.js` suite.

## Validation
Per `.loswf/config.yaml` `validate[]` (lines 34-40), the builder must run all three gates before declaring done:
- `tsc -p tsconfig.json --noEmit`
- `npm test`
- `npm run verify:package`

Note: `ci_check: false` is set in config, so the reviewer MUST NOT gate merge on the CI workflow run itself — but for this issue, the CI run IS the artifact being changed, so the PR reviewer should visually confirm both matrix legs went green on the PR before approving. This is a one-off exception for the workflow-change PR, not a policy change.

## Risks
- The `macos-14` runner compiles the XIFty Rust core from source for the first time on every cache miss; initial PR run may take 15+ minutes. Mitigation: `Swatinem/rust-cache@v2` is already wired in publish.yml's macOS leg and will reuse across CI runs once primed. The 25-minute `timeout-minutes` is sized for a cold cache.
- `macos-14` is an Apple Silicon runner; some homebrew-installed tools present on `macos-latest` may be absent. Mitigation: the publish.yml macOS leg uses the same image and currently succeeds, so the toolchain surface is already known-sufficient.
- Adding a second required leg doubles the probability of a transient runner flake blocking a PR. Mitigation: `ci_check: false` means the factory does not block on CI; human reviewers can use "Re-run failed jobs" for genuine transients. If the macOS leg proves persistently flaky in practice, a follow-up issue can add `continue-on-error: true` scoped to that leg — but do NOT pre-emptively mask failures in this PR, since masking would defeat the reliability goal stated in the issue.
- Pinning to `ubuntu-24.04` changes the image from the previous `ubuntu-latest`. Runner images rarely break things, but if this PR's Linux leg fails for an image-pin reason, revert only that pin to `ubuntu-latest` and open a follow-up; do not revert the macOS leg.
- Prebuilds are gitignored (`.gitignore` line 5), so the issue's fallback suggestion of "load a committed darwin-arm64 prebuild" is not viable without a separate spec to commit prebuilds — out of scope for this chore.


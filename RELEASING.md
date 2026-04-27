# Releasing `@xifty/xifty`

Maintainer guide for cutting a Node-binding release. Assumes the XIFty Rust
core is already tagged at the version you want to ship.

## TL;DR

```bash
# in XIFtyNode/
npm version <patch|minor|major>          # bumps package.json + lockfile
git push --follow-tags
XIFTY_CORE_REF=v0.1.X npm run publish:local
```

If `npm publish` errors with `EOTP` or `403`, see [Publish-time auth](#publish-time-auth).

---

## Pre-flight checks

Run these once per machine. They are the source of every "it worked last
release, why doesn't it work now" surprise.

### 1. npm CLI is authenticated

```bash
npm whoami
# expect: xifty
```

If it returns `401`, run `npm login --auth-type=web` and complete the
browser flow (passkey or whatever 2FA you have enrolled).

### 2. Package publishing-access mode

Visit **https://www.npmjs.com/package/@xifty/xifty/access** and confirm the
*Publishing access* radio is set to:

> 🔘 **Require two-factor authentication or a granular access token with
> bypass 2fa enabled**

If it is set to *"Require two-factor authentication and disallow tokens"*,
**every publish from the CLI will be rejected** with
`403 Two-factor authentication is required to publish this package but an
automation token was specified` — no token of any type bypasses that
setting. Switching the radio requires confirming with your enrolled
passkey, so it must be done in the browser; the CLI itself cannot change
the setting without an OTP code that npm only issues to authenticator-app
2FA, not to passkeys.

### 3. Have a granular access token with **Bypass 2FA** enabled

Generate at **https://www.npmjs.com/settings/~/tokens** → *Generate New
Token* → *Granular Access Token*:

| Field | Value |
|---|---|
| Token name | e.g. `xifty-publish-2026-04` |
| Expiration | 7–90 days |
| Packages and scopes | *Only select packages* → `@xifty/xifty` → **Read and write** |
| **Bypass 2FA** | **✅ checked** |

The *Bypass 2FA* checkbox is what makes the token usable from the CLI.
Without it, even a fully-scoped token will get `EOTP`. The published
"Publish" / "Read-only" *Classic Token* radios are no longer offered to
new accounts; granular tokens are the only path.

Write the token to `~/.npmrc`:

```bash
printf '//registry.npmjs.org/:_authToken=%s\n' 'npm_…' > ~/.npmrc
npm whoami        # expect: xifty
```

### 4. Docker is running (for the Linux-x64 prebuild)

```bash
docker info | grep "Server Version"
```

The release pipeline cross-compiles `linux-x64` inside an Amazon Linux 2023
container. Without Docker the publish bundle will not include the Lambda /
Linux prebuild.

---

## Cut the release

### Step 1 — make sure XIFty core is tagged

XIFty core releases live at https://github.com/XIFtySense/XIFty/releases.
A given Node release is pinned to one core tag via `XIFTY_CORE_REF` at
build time. Don't ship a Node release against an unreleased core SHA — it
makes the binding harder to reproduce later.

### Step 2 — bump the binding version

In an XIFtyNode checkout:

```bash
npm version patch                      # 0.1.7 → 0.1.8
# or: npm version minor / npm version major
```

`npm version` updates `package.json`, `package-lock.json`, commits with
the default message (`v0.1.8`), and creates an annotated tag. The
historical commit subject in this repo is **`Release Node package
0.1.8`** — if you want to match that, use:

```bash
npm version patch -m "Release Node package %s"
```

### Step 3 — push commit and tag

```bash
git push --follow-tags
```

### Step 4 — build prebuilds, verify, publish

```bash
XIFTY_CORE_REF=v0.1.8 npm run publish:local
```

Substitute the actual core tag. `publish:local` runs:

1. `build:prebuilds` — compiles `xifty-ffi` for `darwin-arm64` natively and
   for `linux-x64` in Docker; writes `prebuilds/<platform>/@xifty+xifty.node`.
2. `verify:package` — sanity-checks `npm pack` contents and file list.
3. `verify:tarball` — packs the tarball, smokes it against the local
   fixtures, asserts both prebuilds load.
4. `verify:linux-x64` — extra Linux-x64 smoke against the cross-compiled
   prebuild (run in Docker).
5. `npm publish --access public` — uploads the verified tarball to the
   registry.

Expected duration on an M-series Mac with warm caches: **3–6 minutes**
(the Docker linux-x64 step dominates). Cold cache: 10–15 min.

### Step 5 — verify the publish landed

```bash
npm view @xifty/xifty version          # expect: <new version>
npm view @xifty/xifty time.<new version>
```

A test install in a scratch directory is also worth doing once per minor:

```bash
mkdir /tmp/xifty-install-check && cd $_
npm init -y && npm install @xifty/xifty
node -e 'console.log(require("@xifty/xifty").version())'
```

---

## Publish-time auth

A publish failure almost always traces back to one of these. The error
codes are deterministic — match the code, apply the fix.

| Error | Cause | Fix |
|---|---|---|
| `npm error code EOTP` `This operation requires a one-time password from your authenticator.` | Either the token doesn't have *Bypass 2FA* set, OR the package's *Publishing access* mode is `mfa=publish` (disallow tokens). | Generate a new granular token with *Bypass 2FA* checked, AND ensure the package access setting is `Require 2FA or granular access token with bypass 2fa enabled`. Both must be true. |
| `npm error code E403` `Two-factor authentication is required to publish this package but an automation token was specified.` | Token *is* a bypass-2fa automation token (good), but the package access setting is still `mfa=publish` (disallow tokens). | Flip the package's Publishing access radio to the upper option. |
| `npm error code E401 Unauthorized` | `~/.npmrc` token is invalid, expired, or pointing at the wrong registry. | `npm whoami` to confirm. Regenerate token if needed. |
| `npm error code EPUBLISHCONFLICT` | The version is already published. | Bump the version (npm versions are immutable; you cannot republish). |

### Why npm UI flows can't fix `mfa=publish` from the CLI

Changing the package's Publishing-access mode requires the registry to
verify your second factor. Passkeys (security keys) cannot produce a TOTP
code that the CLI's `--otp=<code>` flag accepts — the npm CLI only takes
6-digit TOTPs from authenticator apps. So if your only enrolled second
factor is a passkey, you **cannot** flip the package setting from the
shell; you must do it in the browser where the passkey can sign the
WebAuthn challenge.

If you want CLI-only release flows in the future, enroll an authenticator
app (1Password, Authy, Google Authenticator) as an *additional* second
factor on the npm account. The passkey stays as your primary login factor.

---

## Token hygiene

- After publishing, **revoke the token** at
  https://www.npmjs.com/settings/~/tokens unless you actively need it for
  the next release window.
- Never commit tokens to either repo. The `~/.npmrc` workflow keeps them
  per-machine.
- Bypass-2fa tokens are powerful — they can publish arbitrary versions
  with no human in the loop. Treat them like a deploy key.

---

## Coordination with XIFty core

The Node binding is downstream of `xifty-ffi`. To produce a Node release
that ships a particular core release:

1. Land the change in XIFtySense/XIFty `main`.
2. Bump the workspace version in `Cargo.toml`, commit `Release core
   0.1.X`, tag `v0.1.X`, push tag, create a GitHub Release. The
   `runtime-artifacts.yml` workflow uploads `linux-x64` and `macos-arm64`
   tarballs to the release.
3. In XIFtyNode, follow the steps above with
   `XIFTY_CORE_REF=v0.1.X`. The version numbers do not have to match
   between core and binding (e.g. core `0.1.6` shipped as binding
   `0.1.8`); pick the binding's next-patch number.

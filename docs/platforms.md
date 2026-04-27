# Supported platforms

`@xifty/xifty` ships prebuilt native binaries. If you install on a
listed target, the package works without any local toolchain. On an
unsupported target, the install script fails fast with a clear error
rather than silently pretending to work.

## Currently shipped

| Platform | Prebuild | Notes |
|---|---|---|
| `darwin` / `arm64` | ✅ | Apple Silicon — local development |
| `linux` / `x64` | ✅ | AWS Lambda `nodejs22.x`, most CI runners, general Linux servers |

`linux-x64` is the priority Linux target because it covers the largest
production surface (Lambda, common CI, general server distros).

## Not currently shipped

| Platform | Why |
|---|---|
| `darwin` / `x64` | Intel Mac volume has dropped sharply; cross-build complexity not yet justified. |
| `linux` / `arm64` | Graviton Lambda is a real target — open an issue if you need this. |
| `windows` / `*` | No published prebuild yet. Source builds work but require a working `node-gyp` toolchain. |
| Other Linux architectures | Source builds may work via `XIFTY_FORCE_BUILD=1` but are unsupported. |

## Source build (advanced)

If you have a working `node-gyp` toolchain (Python 3, a C++ compiler,
and a recent Rust toolchain), you can request a source build:

```bash
XIFTY_FORCE_BUILD=1 npm install @xifty/xifty
```

The install script will fetch the XIFty core source, compile
`xifty-ffi`, and link the Node addon. Set `XIFTY_CORE_REF=v0.1.7` (or
another tag) to pin to a specific core version; otherwise `main` is
used.

## Engine requirements

- **Node.js**: 20 or newer. Older runtimes are not supported because
  `node-addon-api` v8 dropped them.

## Adding platform support

If you need a platform we don't currently ship:

1. **Open an issue** describing your target (OS, arch, Node version,
   deployment context) so we can prioritise.
2. **Try a source build** with `XIFTY_FORCE_BUILD=1` — most modern
   platforms compile cleanly, you'll just need the toolchain locally.
3. **Submit a CI matrix patch** — adding a prebuild target is mostly
   matrix-config plumbing in the binding repo's CI.

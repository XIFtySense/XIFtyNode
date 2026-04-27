# API reference

`@xifty/xifty` is a thin native bridge over the XIFty core. The public
surface is small — three functions and a single envelope shape — so you
can learn it once and apply it across every supported format.

## Functions

### `version(): string`

Returns the XIFty core version reported by the native library.

```js
xifty.version();           // "0.1.7"
```

### `packageVersion(): string`

Returns the npm package version.

```js
xifty.packageVersion();    // "0.1.9"
```

### `probe(path: string): XiftyEnvelope`

Detects the input format and returns a lightweight envelope describing
the file. No metadata extraction is performed — useful for quickly
filtering or routing files before doing the heavier `extract` work.

```js
const probe = xifty.probe("photo.jpg");
probe.input.detected_format;     // "jpeg"
probe.input.size;                // 4_182_733
probe.report.issues;             // []
```

### `extract(path: string, options?): XiftyEnvelope`

Extracts metadata from the input file.

```js
const result = xifty.extract("clip.mp4", { view: "normalized" });
```

Options:

| Key | Type | Default | Meaning |
|---|---|---|---|
| `view` | `"full" \| "raw" \| "interpreted" \| "normalized" \| "report"` | `"full"` | Which view to populate. Other views in the envelope are still present but empty. |

Numeric view selection is also supported for low-level consumers, but
named views are the intended public API.

## Views

XIFty's design centres on four views over the same underlying metadata.
Pick the one that fits your use case:

| View | Use when |
|---|---|
| `raw` | You need the bytes-level values exactly as the source format encoded them. Provenance-sensitive work, debugging, parser correctness checks. |
| `interpreted` | You want decoded namespaces (EXIF tags, XMP properties, iTunes atoms) with their meaning attached, but in their original namespace. |
| `normalized` | You want stable cross-format keys (`device.make`, `captured_at`, `location`, …) for product code. **Most apps want this.** |
| `report` | You want to know about parser warnings, namespace conflicts (EXIF vs. XMP disagreement), or unsupported structure. Always populated. |

## Envelope shape

Every call returns the same top-level shape:

```ts
{
  schema_version: "0.1.0",
  input: {
    detected_format: string;     // "jpeg", "mp4", "ogg", etc.
    container: string;           // top-level container kind
    size: number;                // bytes
  },
  raw: { ... } | null,
  interpreted: { ... } | null,
  normalized: {
    fields: Array<{
      field: string;             // "device.make", "captured_at", …
      value: { kind: string; value: any };
      sources: Array<Provenance>;
      notes: string[];
    }>;
  } | null,
  report: {
    conflicts: Array<{
      field: string;
      message: string;
      sources: Array<{ namespace, value, ... }>;
    }>;
    issues: Array<{
      severity: "info" | "warning" | "error";
      code: string;
      message: string;
      offset: number | null;
      context: string | null;
    }>;
  }
}
```

Views you didn't ask for are returned as `null`, except `report` which
is always populated (an empty `{ conflicts: [], issues: [] }` is a
positive signal — XIFty saw the file cleanly).

## Working with the normalized view

The normalized view is a list of fields, not a key/value object. To
turn it into a flat object:

```js
const result = xifty.extract("photo.jpg", { view: "normalized" });

const fields = Object.fromEntries(
  result.normalized.fields.map((f) => [f.field, f.value.value])
);

fields["device.make"];
fields["captured_at"];
fields["location"];   // { latitude, longitude, altitude? } when present
```

Each field carries `sources` (provenance — which container, namespace,
byte offsets the value came from) and `notes` (e.g. "selected EXIF
Make over XMP tiff:Make"). If you need that detail, iterate `fields`
directly instead of flattening.

## TypeScript

Type definitions are bundled. The named import works the same way:

```ts
import { extract, probe } from "@xifty/xifty";

const result = extract("image.jpg", { view: "normalized" });
```

Use the `XiftyEnvelope` type for explicit return-type annotations.

## Error handling

Errors surface as thrown `Error` instances with descriptive messages.
The two main classes:

- **I/O errors** — file not found, permission denied, etc.
- **Parse errors** — XIFty couldn't recognise the input as a supported
  container (e.g. truncated file, wrong magic bytes).

For partial-parse situations (file is recognized but some structure is
malformed), XIFty *does not throw* — it surfaces issues in
`result.report.issues` so you can inspect what was readable. This is by
design; throwing on every minor issue would force callers to wrap every
extraction in try/catch.

## Memory & performance

- The native library reads the file once and reuses the buffer across
  all four views. There is no per-view re-parse cost.
- For large files (multi-GB drone MP4, RAW), only the metadata atoms
  are read — the media `mdat` payload is skipped.
- `probe` is much cheaper than `extract`. If you only need to know
  "what kind of file is this?" use `probe`.

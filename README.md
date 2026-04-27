# XIFty for Node.js

Read metadata from images, video, and audio — locally, without shelling
out, with stable normalized fields you can ship to product code.

```bash
npm install @xifty/xifty
```

```js
const xifty = require("@xifty/xifty");
const result = xifty.extract("photo.jpg", { view: "normalized" });

const fields = Object.fromEntries(
  result.normalized.fields.map((f) => [f.field, f.value.value]),
);

fields["device.make"];      // "Apple"
fields["device.model"];     // "iPhone 15 Pro"
fields["captured_at"];      // "2026-04-21T14:33:08-04:00"
fields["location"];         // { latitude: 40.7922, longitude: -73.9584 }
```

## What you get

XIFty extracts metadata from a wide range of media containers and
surfaces it in four views — `raw`, `interpreted`, `normalized`, and
`report` — so you can use clean stable fields in product code without
losing access to the underlying values when provenance matters.

### Formats supported today

| Container | Decoders |
|---|---|
| **JPEG / TIFF / DNG** | EXIF · XMP · ICC · IPTC |
| **PNG / WebP** | EXIF · XMP · ICC · IPTC |
| **HEIF / HEIC** | EXIF · XMP · ICC · IPTC · item-based dimensions |
| **MP4 / MOV** | QuickTime · iTunes · ICC · XMP · Apple/Sony vendor metadata · **DJI drone telemetry** |
| **M4A / M4B / M4P** | iTunes `ilst` (title, artist, album, year, genre, track number, cover art …) |
| **FLAC** | Native stream info · Vorbis comments · embedded picture |
| **OGG (Vorbis / Opus)** | Page parsing · ident headers · Vorbis comments |
| **AIFF / AIFC** | Stream info from `COMM` chunk |

### Normalized fields

The `normalized` view gives you cross-format stable keys so you don't
have to know whether a given file was JPEG-EXIF or DJI-`udta` or
Vorbis-comment:

- `device.make`, `device.model`, `device.serial_number`
- `captured_at`, `created_at`, `modified_at`
- `location` (latitude, longitude, altitude)
- `dimensions.width`, `dimensions.height`, `orientation`
- `exposure.iso`, `exposure.aperture`, `exposure.shutter_speed`, `exposure.focal_length_mm`
- `lens.make`, `lens.model`
- `duration`, `video.framerate`, `video.bitrate`, `codec.video`, `codec.audio`
- `audio.channels`, `audio.sample_rate`, `audio.bit_depth`
- `drone.flight.{pitch,yaw,roll}_deg`, `drone.gimbal.{pitch,yaw,roll}_deg`, `drone.speed.{x,y,z}_mps`
- `author`, `copyright`, `headline`, `description`, `keywords`
- `color.space`, `color.profile.name`, `color.profile.class`

When fields disagree across sources (e.g. EXIF vs. XMP), the `report`
view tells you the conflict explicitly rather than silently picking
one.

## Try it

```js
const { extract, probe } = require("@xifty/xifty");

// Lightweight format detection — no full extraction
probe("clip.mp4").input.detected_format;   // "mp4"

// Drone telemetry from a DJI MP4 — same API, same shape
const dji = extract("DJI_0003.MP4", { view: "normalized" });
const fields = Object.fromEntries(
  dji.normalized.fields.map((f) => [f.field, f.value.value])
);
fields["drone.gimbal.pitch_deg"];   // -31.2
fields["drone.flight.yaw_deg"];     // 175.5
fields["device.serial_number"];     // "53HQN4T0M5B7JW"
```

## Common use cases

- Photo / video library ingestion (EXIF, XMP, GPS, capture time)
- Drone footage indexing (DJI flight + gimbal telemetry, GPS, model)
- AWS Lambda media-pipeline upload handlers
- Media-asset deduplication and search
- Audio library tagging (Vorbis comments across FLAC, OGG, Opus)
- Compliance audits (provenance via `raw` + `report` views)

## More documentation

- **[API reference](./docs/api.md)** — every method, every option, every output field
- **[AWS Lambda](./docs/aws-lambda.md)** — runtime targets, SAM example, layer assembly
- **[Supported platforms](./docs/platforms.md)** — what ships, what doesn't, why
- **[Local development](./docs/development.md)** — building from source, running tests
- **[Releasing](./RELEASING.md)** — maintainer guide for cutting a new version

## License

MIT. Built on the open-source [XIFty core](https://github.com/XIFtySense/XIFty).

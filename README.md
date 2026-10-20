# @eliasthompson/obs-layout-generator

Generate scene layout metrics for multi-participant OBS canvases. Describe each participant's content and the generator returns pixel rectangles for their main content, camera, aux content, info panel, and name tag, arranged in balanced rows on the canvas.

## Install

```sh
npm install @eliasthompson/obs-layout-generator
```

The package ships as ESM with bundled type declarations and has no runtime dependencies. Versions up to 1.1.0 were published unscoped as `obs-layout-generator`.

## Usage

```ts
import { generateLayout } from '@eliasthompson/obs-layout-generator';

const layouts = generateLayout([{ contentMain: { aspectRatio: '16:9' }, hasName: true }], {
  canvasMarginBottom: 120,
  canvasPadding: 30,
  canvasGap: 30,
});
// [
//   {
//     camera: { x: 1645, y: 488, width: 245, height: 443, hasBorder: true },
//     contentMain: { x: 30, y: 30, width: 1600, height: 900, hasBorder: true },
//     name: { x: 1645, y: 783, width: 245, height: 148, hasBorder: false },
//   },
// ]
```

Pass one `LayoutConfig` per participant and an optional `LayoutOptions` for the canvas. You get back one `LayoutMetric` per participant, in input order. A `LayoutConfig` describes each region of the participant: `camera`, `contentMain`, `contentAux`, and `info` each take a region config or `null`, and `hasName` adds a name tag. Any region or field you leave out takes its value from `LAYOUT_CONFIG_DEFAULT` or `LAYOUT_OPTIONS_DEFAULT`, so `{}` is a participant with 16:9 main content and a camera. Set a region to `null` to turn it off, or to `{}` to turn it on with that region's defaults. The one derived default is `layoutGap`, which is half of `canvasGap` when left out. Calling `generateLayout()` with no arguments lays out a single default participant on a default canvas.

When the canvas is fixed and only the participants change, as in a React component or a bot driving OBS, bind the options once with `createLayoutGenerator` and call the result with just the configs:

```ts
import { createLayoutGenerator } from '@eliasthompson/obs-layout-generator';

const generate = createLayoutGenerator({ canvasMarginBottom: 120, canvasPadding: 30, canvasGap: 30 });

generate([{ hasName: true }]); // same result as the example above
generate([{ hasName: true }], { canvasMarginBottom: 0 }); // per-call options override the bound ones
```

An `undefined` field in the per-call options keeps the bound value rather than resetting it to the default, so options built from partial settings can be passed as they are.

## How layouts are built

**Rows.** Participants are split into balanced rows: 1–2 participants use one row, 3–6 use two, 7–12 use three, and so on. Every row has the same height.

**Columns.** Each participant gets a main column and, when needed, a side column to its right.

- The **main column** holds the first region present, in this order: main content, camera, aux content, info. Its width comes from that region's aspect ratio (`contentMain.aspectRatio`, `camera.mainAspectRatio`, `contentAux.aspectRatio`, or `info.aspectRatio`; `'auto'` info fills the grid cell).
- The **side column** holds the remaining camera, aux content, and info, stacked with aux content at the top, info below it, and the camera at the bottom. If none remain, the side column and its gap are dropped.

```ts
// No main content: the camera takes the main column at its 16:9 mainAspectRatio
generateLayout([{ contentMain: null, hasName: true }], {
  canvasMarginBottom: 120,
  canvasPadding: 30,
  canvasGap: 30,
});
// [
//   {
//     camera: { x: 160, y: 30, width: 1600, height: 900, hasBorder: true },
//     name: { x: 160, y: 783, width: 1600, height: 148, hasBorder: false },
//   },
// ]
```

**Side column width.** The side column is whatever width remains in a grid cell after the widest content ratio (16:9) at full height. Canvases with more horizontal room get wider side columns. On a 16:9 canvas with no margins or padding nothing remains, so side regions are omitted. Add vertical margins, such as `canvasMarginBottom` for a lower bar, to make room.

**Spacing.** Margins reserve space outside the layout on each side, `canvasPadding` insets the layout from the margins on all four sides, `canvasGap` separates participants across a row and between rows, and `layoutGap` separates a participant's main and side columns. Padding does not set the gaps: leave `canvasGap` out and participants touch.

**Borders.** `regionBorder` reserves a border of that width around every region except the name, which sits inside its host region, and a green screen camera. Each returned region says whether it has one with `hasBorder`. The returned rectangles are the content inside the border, so the border box of a bordered region is its rectangle grown by `regionBorder` on every side. Aspect ratios apply to the content, gaps are measured between border boxes, and padding runs from the margins to the border boxes, so borders never overlap each other or leave the padded area.

**Attachment.** A side region can be attached to the main region with `isMainAttached`, and the info and camera can be attached to the side region above them with `isAboveAttached`. An attached region grows across the gap until its border box meets the neighbor's, and the two borders share the same pixels, so a 6px border between them is 6px wide rather than 12px. The attached region's far edge stays where it was, so no other region moves. Aspect ratios are kept: aux content or info attached to the main region grows taller as it grows wider, which can shorten the camera below it as described under camera height, and ratio info attached to the aux content above it moves up to meet it without changing size. Auto info and the camera grow to fill the gap they close. Attaching to a region that is not shown, or above the aux content, does nothing. Nothing is attached by default.

```ts
// The camera shares the main content's right border; with a 6px border it starts 6px right of the content
generateLayout([{ camera: { isMainAttached: true } }], {
  canvasMarginBottom: 120,
  canvasPadding: 30,
  canvasGap: 30,
  regionBorder: 6,
});
// [
//   {
//     camera: { x: 1621, y: 494, width: 263, height: 431, hasBorder: true },
//     contentMain: { x: 36, y: 36, width: 1579, height: 888, hasBorder: true },
//   },
// ]
```

**Green screen.** A camera with `isGreenScreen` has no border and spreads over the space around it, so a keyed-out person stands in the scene rather than in a frame. Its region is laid out as usual, then each edge expands: an edge facing another region of the same participant, such as a side camera's left edge facing the main content or its top edge facing the stack above it, fills the layout gap up to that region's border box; an edge facing another participant or row fills half the canvas gap, so two green screen cameras facing each other meet without overlapping; and an edge facing nothing runs through the padding to the margin, stopping where elements in the margin, such as a lower bar, begin. A side camera's top edge expands by the layout gap even when nothing is above it. Attachments on a green screen camera, and attachments of side regions to a green screen main camera, are ignored, since the camera fills those gaps itself. The name tag still sits along the bottom of the camera.

```ts
generateLayout([{ camera: { isGreenScreen: true } }], {
  canvasMarginBottom: 120,
  canvasPadding: 30,
  canvasGap: 30,
  regionBorder: 6,
});
// [
//   {
//     camera: { x: 1621, y: 473, width: 299, height: 488, hasBorder: false },
//     contentMain: { x: 36, y: 36, width: 1579, height: 888, hasBorder: true },
//   },
// ]
```

**Camera height.** In the side column, every participant's camera is the same height: half the row, reduced if needed to leave room for the tallest side aux content in the layout, measured at each aux content's own width. A camera attached to the region above it is taller than that by the gap it closes.

**Name tag.** The name sits along the bottom of the camera, or the main content if there is no camera big enough to hold it, or the aux content if there is neither. It is as wide as its host and a third as tall, capped at a third of a full-height side camera so a name on a main-column camera stays the same size as one beside content, and at least `nameHeightMin` tall when the host allows. If none of those is shown, the name is omitted.

**Space that runs out.** A region whose width or height rounds to 0 is omitted rather than returned with a zero or negative size. If every region in a participant's side column is omitted this way, the side column is dropped too and the layout is sized again without it.

## API

### `LayoutConfig`

| Option        | Type                              | Default                 | Description                              |
| ------------- | --------------------------------- | ----------------------- | ---------------------------------------- |
| `camera`      | `CameraLayoutConfig \| null`      | `{}`                    | Show a camera, or none with `null`.      |
| `contentMain` | `ContentMainLayoutConfig \| null` | `{ aspectRatio: 16:9 }` | Show main content, or none with `null`.  |
| `contentAux`  | `ContentAuxLayoutConfig \| null`  | `null`                  | Show aux content, or none with `null`.   |
| `info`        | `InfoLayoutConfig \| null`        | `null`                  | Show an info panel, or none with `null`. |
| `hasName`     | `boolean`                         | `false`                 | Show a name tag.                         |

Each region config is optional on every field, so `{}` shows the region with its defaults.

| Region config             | Field             | Type                    | Default | Description                                                                 |
| ------------------------- | ----------------- | ----------------------- | ------- | --------------------------------------------------------------------------- |
| `CameraLayoutConfig`      | `mainAspectRatio` | `AspectRatio`           | `16:9`  | Camera ratio when it takes the main column. Has no effect on a side camera. |
|                           | `isMainAttached`  | `boolean`               | `false` | Attach a side camera to the main region.                                    |
|                           | `isAboveAttached` | `boolean`               | `false` | Attach a side camera to the side region above it.                           |
|                           | `isGreenScreen`   | `boolean`               | `false` | Drop the border and spread over the surrounding space.                      |
| `ContentMainLayoutConfig` | `aspectRatio`     | `ContentAspectRatio`    | `16:9`  | Main content ratio.                                                         |
| `ContentAuxLayoutConfig`  | `aspectRatio`     | `ContentAspectRatio`    | `4:3`   | Aux content ratio.                                                          |
|                           | `isMainAttached`  | `boolean`               | `false` | Attach side aux content to the main region.                                 |
| `InfoLayoutConfig`        | `aspectRatio`     | `'auto' \| AspectRatio` | `auto`  | Info ratio, filling the available space with `'auto'`.                      |
|                           | `isMainAttached`  | `boolean`               | `false` | Attach side info to the main region.                                        |
|                           | `isAboveAttached` | `boolean`               | `false` | Attach side info to the side aux content above it.                          |

`ContentAspectRatio` is one of the ratios in `CONTENT_ASPECT_RATIOS`; `AspectRatio` is any `'width:height'` string. Leaving a region or field out, or setting it to `undefined`, uses its default; only `null` turns a region off. The region defaults are exported as `CAMERA_LAYOUT_CONFIG_DEFAULT`, `CONTENT_MAIN_LAYOUT_CONFIG_DEFAULT`, `CONTENT_AUX_LAYOUT_CONFIG_DEFAULT`, and `INFO_LAYOUT_CONFIG_DEFAULT`. A ratio that is not positive on both sides, such as `'0:9'`, is invalid and treated like `null`; an invalid `camera.mainAspectRatio` keeps the camera out of the main column.

### `LayoutOptions`

| Option               | Type     | Default             | Description                                                   |
| -------------------- | -------- | ------------------- | ------------------------------------------------------------- |
| `canvasWidth`        | `number` | `1920`              | Canvas width in pixels.                                       |
| `canvasHeight`       | `number` | `1080`              | Canvas height in pixels.                                      |
| `canvasMarginTop`    | `number` | `0`                 | Space reserved above the layout.                              |
| `canvasMarginBottom` | `number` | `0`                 | Space reserved below the layout, for example for a lower bar. |
| `canvasMarginLeft`   | `number` | `0`                 | Space reserved left of the layout.                            |
| `canvasMarginRight`  | `number` | `0`                 | Space reserved right of the layout.                           |
| `canvasPadding`      | `number` | `0`                 | Space between the margins and the layout, on all four sides.  |
| `canvasGap`          | `number` | `0`                 | Space between participants, across a row and between rows.    |
| `layoutGap`          | `number` | half of `canvasGap` | Space between a participant's main and side columns.          |
| `regionBorder`       | `number` | `0`                 | Border width reserved around every region but the name.       |
| `nameHeightMin`      | `number` | `0`                 | Smallest name tag height, within what its host allows.        |

### `LayoutMetric`

Each participant's result has optional `camera`, `contentMain`, `contentAux`, `info`, and `name` regions. Each is a `LayoutRegion` of rounded pixel values, `{ x, y, width, height, hasBorder }`. `hasBorder` is `true` for a region drawn with `regionBorder` around it, whose rectangle is measured inside that border, and `false` for the name and a green screen camera, so a renderer can frame regions without consulting the config. Regions that were not requested or did not fit are absent.

### Migrating from 1.x

Version 2 nests each region's settings under the region's name, matching the shape of `LayoutMetric`, and adds `hasBorder` to every returned region. Region names and the layout model are otherwise unchanged.

| 1.x                             | 2.x                                           |
| ------------------------------- | --------------------------------------------- |
| `hasCamera: false`              | `camera: null`                                |
| `cameraMainAspectRatio: '4:3'`  | `camera: { mainAspectRatio: '4:3' }`          |
| `contentMainAspectRatio: '4:3'` | `contentMain: { aspectRatio: '4:3' }`         |
| `contentMainAspectRatio: null`  | `contentMain: null`                           |
| `contentAuxAspectRatio: '4:3'`  | `contentAux: { aspectRatio: '4:3' }`          |
| `infoAspectRatio: 'auto'`       | `info: { aspectRatio: 'auto' }` or `info: {}` |
| `hasName: true`                 | `hasName: true`                               |

### Exports

- **Layout:** `generateLayout` and `createLayoutGenerator`, `mergeLayoutConfigs` to apply one `LayoutConfig` over another region by region, the `LayoutConfig`, `CameraLayoutConfig`, `ContentMainLayoutConfig`, `ContentAuxLayoutConfig`, `InfoLayoutConfig`, `LayoutOptions`, `LayoutMetric`, and `LayoutRegion` types, and the `LAYOUT_CONFIG_DEFAULT`, `CAMERA_LAYOUT_CONFIG_DEFAULT`, `CONTENT_MAIN_LAYOUT_CONFIG_DEFAULT`, `CONTENT_AUX_LAYOUT_CONFIG_DEFAULT`, `INFO_LAYOUT_CONFIG_DEFAULT`, and `LAYOUT_OPTIONS_DEFAULT` constants.
- **Aspect ratios:** `CONTENT_ASPECT_RATIOS` (frozen), `numericContentAspectRatios`, `widestNumericContentAspectRatio`, the `ContentAspectRatio` and `AspectRatio` types, and `transformAspectRatio` to turn `'16:9'` into `1.777…`.
- **Building blocks**, in the order `generateLayout` uses them:
  - `distributeLayouts`: split layout configs into rows.
  - `calculateCanvasGrid`: layout area, content area, gaps, grid cells, and side column width.
  - `resolveLayoutConfig`: pick the main column region and what stays in the side column, with widths and attachments.
  - `calculateRowHeight`: the tallest row height at which every row fits.
  - `calculateCameraHeights`: the shared side camera height and the largest name height.
  - `calculateSideRegionHeights`: side column stacking.
  - `findCollapsedSideIndexes`: side columns left with nothing to show.
  - `calculateLayoutRegions`: region positions for one participant.
  - `expandGreenScreenCamera`: green screen camera expansion toward what each edge faces.
  - `placeName`: name placement.
  - `roundLayoutMetric` and `roundLayoutRegion`: rounding to whole pixels.
  - The `LayoutMainRegion`, `LayoutNeighbor`, `LayoutNeighbors`, and `LayoutAlignment` types. `transformAspectRatio` returns `0` for invalid ratios.

## Development

The published package runs on Node 20 or later. Developing it needs Node 22.18 or later, which the build tool requires, and CI runs the checks below on Node 22 and 24.

```sh
npm install
npm run typecheck
npm run lint
npm run format:check
npm run test:coverage
npm run build
```

`npm run dev` rebuilds on change, `npm run test:watch` reruns tests on change, and `npm run lint:fix` and `npm run format` apply fixes. See [AGENTS.md](AGENTS.md) for project conventions.

### Releasing

```sh
npm version <major|minor|patch> -m "chore: release v%s"
git push --follow-tags
```

Pushing the tag runs the publish workflow, which checks that the tag matches the package version, runs every check, stages the version on npm through trusted publishing, and creates the GitHub release. The version is not installable until a maintainer approves it with two-factor authentication, on the package's Staged Packages tab on npmjs.com or with `npm stage approve`. Nothing is published from a laptop.

## License

[MIT](LICENSE) © Elias Thompson

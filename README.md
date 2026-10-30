# @eliasthompson/obs-layout-generator

Generate scene layout metrics for multi-participant OBS canvases. Describe each participant's content and the generator returns pixel rectangles for their main content, camera, aux content, info panel, and name tag, arranged in balanced rows on a landscape canvas or in columns on a portrait one.

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
//     camera: { x: 1645, y: 603, width: 245, height: 327, hasBorder: true },
//     contentMain: { x: 30, y: 30, width: 1600, height: 900, hasBorder: true },
//     name: { x: 1645, y: 821, width: 245, height: 109, hasBorder: false },
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
//     name: { x: 160, y: 630, width: 1600, height: 300, hasBorder: false },
//   },
// ]
```

**Side column width.** The side column is whatever width remains in a grid cell after the widest content ratio (16:9) at full height, or `layoutSideMin` when that is more. Canvases with more horizontal room get wider side columns. On a 16:9 canvas with no margins or padding nothing remains, so side regions are omitted. Add vertical margins, such as `canvasMarginBottom` for a lower bar, to make room, or set `layoutSideMin` to reserve a side column of at least that width, which narrows the main columns to fit it. A value around three times the name height you need keeps a camera there readable.

**Spacing.** Margins reserve space outside the layout on each side, `canvasPadding` insets the layout from the margins on all four sides, `canvasGap` separates participants across a row and between rows, and `layoutGap` separates a participant's main and side columns. Padding does not set the gaps: leave `canvasGap` out and participants touch.

**Borders.** `regionBorder` reserves a border of that width around every region except the name, which sits inside its host region, and a green screen camera. Each returned region says whether it has one with `hasBorder`. The returned rectangles are the content inside the border, so the border box of a bordered region is its rectangle grown by `regionBorder` on every side. Aspect ratios apply to the content, gaps are measured between border boxes, and padding runs from the margins to the border boxes, so borders never overlap each other or leave the padded area.

**Attachment.** A side region can be attached to the main region with `isMainAttached`, and to the side region before it with `isPreviousAttached`. Side regions come in a fixed order, aux content, then info, then the camera, so in landscape the region before one is the one above it in the side column, and aux content, which comes first, has none. An attached region grows across the gap until its border box meets the neighbor's, and the two borders share the same pixels, so a 6px border between them is 6px wide rather than 12px. The attached region's far edge stays where it was, so no other region moves. Aspect ratios are kept: aux content or info attached to the main region grows taller as it grows wider, which can shorten the camera below it as described under camera height, and ratio info attached to the aux content above it moves up to meet it without changing size. Auto info and the camera grow to fill the gap they close. Attaching to a region that is not shown, or before the aux content, does nothing. Nothing is attached by default. In portrait, where the side regions form a row beneath the main region, `isMainAttached` reaches up, to the main region or to an info row between them, and `isPreviousAttached` reaches left to the region before it in the same row.

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
//     camera: { x: 1621, y: 573, width: 263, height: 351, hasBorder: true },
//     contentMain: { x: 36, y: 36, width: 1579, height: 888, hasBorder: true },
//   },
// ]
```

**Green screen.** A camera with `isGreenScreen` has no border and spreads over the space around it, so a keyed-out person stands in the scene rather than in a frame. Its region is laid out as usual, then each edge expands: an edge facing another region of the same participant, such as a side camera's left edge facing the main content or its top edge facing the stack above it, fills the layout gap up to that region's border box; an edge facing another participant or row fills half the canvas gap, so two green screen cameras facing each other meet without overlapping; and an edge facing nothing runs through the padding, reaching the margin, where elements in the margin such as a lower bar begin, when the camera is at the edge of the layout, and stopping short of it when a short row or column leaves room between them. A side camera's top edge expands by the layout gap even when nothing is above it, unless the camera reaches within a layout gap of the row top, where it expands as the row's top edge would. Attachments on a green screen camera, and attachments of side regions to a green screen main camera, are ignored, since the camera fills those gaps itself. The name tag still sits along the bottom of the camera.

```ts
generateLayout([{ camera: { isGreenScreen: true } }], {
  canvasMarginBottom: 120,
  canvasPadding: 30,
  canvasGap: 30,
  regionBorder: 6,
});
// [
//   {
//     camera: { x: 1621, y: 580, width: 299, height: 380, hasBorder: false },
//     contentMain: { x: 36, y: 36, width: 1579, height: 888, hasBorder: true },
//   },
// ]
```

**Camera height.** In the side column, every participant's camera is the same height: `cameraAspectRatioDefault` at the narrowest side camera's width, 3:4 on a landscape canvas by default, and no taller than the row. Side aux content and ratio info stacked above it, measured at their own widths, shorten it to leave room for the tallest stack in the layout, but never past `cameraAspectRatioMax` (16:9 by default) at the widest side camera's width. Aux content and ratio info show at their ratios or not at all: when the room above the camera at that ratio cannot hold both, the info is omitted, and when it cannot hold the aux content either, the aux content is omitted too, leaving the info if it fits alone. The same holds without a camera, against the whole row. `'auto'` info does not shorten the camera; it fills what the camera leaves. A camera is never narrower than `cameraAspectRatioMin` (9:16 by default): when the side column is narrower than that at the shared height, every camera is shortened until the narrowest one is at that ratio. A camera the row leaves wider than the maximum, beside a short row, is narrowed to it at the right edge of the side column. A camera attached to the region above it is taller than that by the gap it closes, unless reaching the region above would make it narrower than the minimum, in which case it stays unattached at the shared height.

**Name tag.** The name sits along the bottom of the camera, or the main content if there is no camera big enough to hold it, or the aux content if there is neither. A side camera is big enough when a third of it is at least `nameHeightMin`; a main-column camera always is. With `namePosition: 'top'` it runs along the top of its host instead, which keeps it clear of an overlay that rises from the bottom of the canvas. It is as wide as its host and a third as tall, capped at `nameHeightMax`, and at least `nameHeightMin` tall when the host allows. Set `nameHeightMax` to the height your name text needs, so a name on a main-column camera stays the same size as one beside content. If none of those is shown, the name is omitted.

**Space that runs out.** A region whose width or height rounds to 0 is omitted rather than returned with a zero or negative size. If every region in a participant's side column is omitted this way, the side column is dropped too and the layout is sized again without it.

**Portrait canvases.** When the content area is taller than wide, the layout turns; set `orientation` to `'portrait'` or `'landscape'` to choose instead, for example when overlays leave a portrait canvas a near-square content area. Participants are split into columns, the first columns taking any extra participants and filling top to bottom. Every number of columns is tried, and the one that gives the widest columns wins, fewer columns on a tie: two participants stack in one column where the canvas is tall enough for both, and sit side by side where it is not. Every column has the same width and every cell the same height, set by the fullest column, and the columns are centered in the content area. Each participant's main region is as wide as the column at its own ratio, and a **side row** beneath it holds the remaining regions left to right: aux content, then ratio info, then the camera at the right end. A main camera at the `'auto'` ratio with nothing beside it grows taller to fill its cell, down to `cameraAspectRatioMin`. Each column stacks its participants a canvas gap apart and is centered vertically, so a participant shorter than its cell leaves the room at the ends of the column rather than between participants.

- A side camera is never narrower than `cameraAspectRatioMin` (9:16) nor wider than `cameraAspectRatioMax` (16:9 by default).
- A camera alone in its row fills it, as wide as the column and as tall as the row allows, within those limits.
- `'auto'` info has no ratio to size it by in a row, so it fills what a row of other regions leaves: the camera takes `cameraAspectRatioDefault`, 4:3 on a portrait canvas by default, at the row's height, and the info the rest of the row's width between it and any aux content. When that leaves the info no width, the info is omitted and the camera is sized as without it. Without a camera, aux content, or ratio info beside it, `'auto'` info is omitted.
- When any row holds aux content or ratio info, every side row shares one content height: the smallest of each such row's leftover under its main region, its main region's height, and the height at which its regions fill the column at their ratios with the camera at the minimum ratio. The camera then takes the rest of its row's width, and a lone camera in another row is no taller than that. A camera that height leaves wider than the maximum is narrowed to it, and a lone one is centered beneath its main region.
- Ratio info wider than `cameraAspectRatioMax`, such as a timer strip, beside aux content or a side camera, can take an **info row** of its own between the main region and the side row instead: as wide as the column at its ratio and no taller than the cell leaves, with the aux content and the camera in the side row beneath it, sized as they would be without the info in a cell that starts below the info row. A camera alone beneath an info row fills its row as any lone camera does. Squarer info always stays in the side row, since across the column it would be taller than a camera row and shrink the main region to make room. Both arrangements are worked out for the whole canvas, each with its own columns, and the info rows split when that makes the smallest region in the layout, main regions included, larger, comparing the next smallest on a tie.
- The column width is the even split, narrowed until every main region, with its info row when split, leaves its side row at least `layoutSideMin` tall, and tall enough for its camera at the maximum ratio, so the option that reserves a side column in landscape reserves a side row here. A tall main region with an info row is narrowed further than without one, so the main region, the info, and a lone camera stay the width of the column.
- Attachments carry over: a side region attached to the main region reaches up across the gap to share the bottom border of the main region, or of the info row when there is one, and `isPreviousAttached` attaches a side region to the one left of it in its row, so info alone in its row has nothing before it. A green screen camera expands the same way, toward the region above a side camera or the rows below a main camera.
- The name is placed as in landscape.

```ts
// A 1080×1920 canvas with a top and bottom overlay as margins: the main content on top, the camera filling the rest
generateLayout([{ hasName: true }], {
  canvasWidth: 1080,
  canvasHeight: 1920,
  canvasMarginTop: 144,
  canvasMarginBottom: 432,
  canvasPadding: 24,
  canvasGap: 24,
  layoutGap: 18,
  regionBorder: 6,
});
// [
//   {
//     camera: { x: 30, y: 778, width: 1020, height: 680, hasBorder: true },
//     contentMain: { x: 30, y: 174, width: 1020, height: 574, hasBorder: true },
//     name: { x: 30, y: 1231, width: 1020, height: 227, hasBorder: false },
//   },
// ]
```

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

| Region config             | Field                | Type                    | Default | Description                                                                                                                                          |
| ------------------------- | -------------------- | ----------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CameraLayoutConfig`      | `mainAspectRatio`    | `'auto' \| AspectRatio` | `auto`  | Camera ratio when it takes the main column: with `'auto'`, the widest camera ratio, growing to fill a portrait cell. Has no effect on a side camera. |
|                           | `isMainAttached`     | `boolean`               | `false` | Attach a side camera to the main region.                                                                                                             |
|                           | `isPreviousAttached` | `boolean`               | `false` | Attach a side camera to the side region before it.                                                                                                   |
|                           | `isGreenScreen`      | `boolean`               | `false` | Drop the border and spread over the surrounding space.                                                                                               |
| `ContentMainLayoutConfig` | `aspectRatio`        | `ContentAspectRatio`    | `16:9`  | Main content ratio.                                                                                                                                  |
| `ContentAuxLayoutConfig`  | `aspectRatio`        | `ContentAspectRatio`    | `4:3`   | Aux content ratio.                                                                                                                                   |
|                           | `isMainAttached`     | `boolean`               | `false` | Attach side aux content to the main region.                                                                                                          |
|                           | `isPreviousAttached` | `boolean`               | `false` | Attach side aux content to the side region before it, which there is none of while aux content comes first.                                          |
| `InfoLayoutConfig`        | `aspectRatio`        | `'auto' \| AspectRatio` | `auto`  | Info ratio, filling the available space with `'auto'`.                                                                                               |
|                           | `isMainAttached`     | `boolean`               | `false` | Attach side info to the main region.                                                                                                                 |
|                           | `isPreviousAttached` | `boolean`               | `false` | Attach side info to the side aux content before it.                                                                                                  |

`ContentAspectRatio` is one of the ratios in `CONTENT_ASPECT_RATIOS`; `AspectRatio` is any `'width:height'` string. Leaving a region or field out, or setting it to `undefined`, uses its default; only `null` turns a region off. The region defaults are exported as `CAMERA_LAYOUT_CONFIG_DEFAULT`, `CONTENT_MAIN_LAYOUT_CONFIG_DEFAULT`, `CONTENT_AUX_LAYOUT_CONFIG_DEFAULT`, and `INFO_LAYOUT_CONFIG_DEFAULT`. A ratio that is not positive on both sides, such as `'0:9'`, is invalid and treated like `null`; an invalid `camera.mainAspectRatio` keeps the camera out of the main column.

### `LayoutOptions`

| Option                     | Type                 | Default                         | Description                                                                                  |
| -------------------------- | -------------------- | ------------------------------- | -------------------------------------------------------------------------------------------- |
| `canvasWidth`              | `number`             | `1920`                          | Canvas width in pixels.                                                                      |
| `canvasHeight`             | `number`             | `1080`                          | Canvas height in pixels.                                                                     |
| `orientation`              | `LayoutOrientation`  | `'auto'`                        | `'landscape'` rows, `'portrait'` columns, or `'auto'` to choose by the content area's shape. |
| `canvasMarginTop`          | `number`             | `0`                             | Space reserved above the layout.                                                             |
| `canvasMarginBottom`       | `number`             | `0`                             | Space reserved below the layout, for example for a lower bar.                                |
| `canvasMarginLeft`         | `number`             | `0`                             | Space reserved left of the layout.                                                           |
| `canvasMarginRight`        | `number`             | `0`                             | Space reserved right of the layout.                                                          |
| `canvasPadding`            | `number`             | `0`                             | Space between the margins and the layout, on all four sides.                                 |
| `canvasGap`                | `number`             | `0`                             | Space between participants, across a row and between rows.                                   |
| `layoutGap`                | `number`             | half of `canvasGap`             | Space between a participant's main and side regions.                                         |
| `layoutSideMin`            | `number`             | `0`                             | Smallest side column width, or side row height in portrait.                                  |
| `regionBorder`             | `number`             | `0`                             | Border width reserved around every region but the name.                                      |
| `cameraAspectRatioMin`     | `AspectRatio`        | `9:16`                          | Narrowest side camera shape.                                                                 |
| `cameraAspectRatioMax`     | `AspectRatio`        | `16:9`                          | Widest side camera shape.                                                                    |
| `cameraAspectRatioDefault` | `AspectRatio`        | `3:4` landscape, `4:3` portrait | Side camera shape where nothing pushes it, held within the minimum and maximum.              |
| `nameHeightMin`            | `number`             | `0`                             | Smallest name tag height, within what its host allows.                                       |
| `nameHeightMax`            | `number`             | `Infinity`                      | Largest name tag height, below a third of its host.                                          |
| `namePosition`             | `LayoutNamePosition` | `'bottom'`                      | Edge of its host the name tag runs along, `'bottom'` or `'top'`.                             |

A camera ratio that is not positive on both sides falls back to its default. The orientation defaults for `cameraAspectRatioDefault` are exported as `CAMERA_ASPECT_RATIO_DEFAULTS`.

### `LayoutMetric`

Each participant's result has optional `camera`, `contentMain`, `contentAux`, `info`, and `name` regions. Each is a `LayoutRegion` of whole pixels, `{ x, y, width, height, hasBorder }`, rounded at its edges so regions that meet, such as attached regions sharing a border, still meet. `hasBorder` is `true` for a region drawn with `regionBorder` around it, whose rectangle is measured inside that border, and `false` for the name and a green screen camera, so a renderer can frame regions without consulting the config. Regions that were not requested or did not fit are absent.

### Migrating from 3.x

Version 4 sizes side cameras by a default ratio rather than by half the row, and the name tag by an option rather than by the camera.

- A landscape side camera is `cameraAspectRatioDefault` (3:4) rather than half the row, and side aux content and ratio info shorten it only down to `cameraAspectRatioMax` (16:9), which now applies in landscape too. Ratio info shortens it as aux content does, and only participants with a side camera shorten it. Aux content and ratio info that do not fit at their ratios are omitted, info first, rather than squeezed to the room left. Beside a row too short for the side column at 16:9, the camera narrows to 16:9 at the column's right edge rather than flattening, and a green screen camera that fills the row expands at its top as the row does. Set `cameraAspectRatioDefault` to choose another shape.
- `'auto'` info shows in portrait beside a side camera at `cameraAspectRatioDefault` (4:3), rather than being omitted.
- `isAboveAttached` is now `isPreviousAttached`, on the camera and info as before and on aux content, where it has nothing before it to attach to yet.
- In portrait, ratio info wider than `cameraAspectRatioMax` beside aux content or a camera takes an info row of its own when that leaves the smallest region larger, as described under portrait canvases. `calculateColumnWidth`, `calculateSideRowSizes`, and `calculateSideRowHeight` take `isInfoRowSplit`, `calculateSideRowHeight` also takes `cameraNumericAspectRatioMax`, and `SideRowSizes` has `infoRowHeight`.
- The name tag is no longer capped by a third of a full side camera. Set `nameHeightMax` to cap it; without it, the name is a third of its host. A side camera hosts the name when a third of it is at least `nameHeightMin`.
- `calculateCameraHeights` no longer returns `hasCameraNameRoom` or `nameHeightMax`, `calculateSideRowHeight` no longer returns `nameHeightMax`, and `placeName` no longer takes `hasCameraNameRoom`. `calculateSideRegionHeights` omits aux content and info that do not fit rather than capping their heights, `calculateCameraHeights` also takes `cameraNumericAspectRatioMax` and `regionBorder`, and `calculateLayoutRegions` takes `cameraNumericAspectRatioMax`. The building blocks that size cameras take `cameraNumericAspectRatioDefault`, which `calculateCanvasGrid` returns with `nameHeightMax`.

### Migrating from 2.x

Landscape layouts keep their shape. Version 3 adds portrait canvases and moves the side camera's minimum ratio into the options.

- `CAMERA_ASPECT_RATIO_MIN` and `cameraNumericAspectRatioMin` are gone: set `cameraAspectRatioMin` in `LayoutOptions`, whose default is in `LAYOUT_OPTIONS_DEFAULT`.
- `camera.mainAspectRatio` defaults to `'auto'`, which in landscape is `cameraAspectRatioMax`, 16:9 as before.
- Regions are rounded at their edges rather than by position and size, so some coordinates and sizes move by a pixel.
- A green screen camera's edges that face nothing run through the padding only, so in a row or column shorter than the content area it no longer spreads to the margins.
- `calculateCanvasGrid` also returns the resolved camera ratio limits, `nameHeightMin`, and `namePosition`, so `generateLandscapeLayout` and `generatePortraitLayout` take only the configs and the grid, and the building blocks that limit the camera take the ratios in their context.

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

- **Layout:** `generateLayout` and `createLayoutGenerator`, `mergeLayoutConfigs` to apply one `LayoutConfig` over another region by region, the `LayoutConfig`, `CameraLayoutConfig`, `ContentMainLayoutConfig`, `ContentAuxLayoutConfig`, `InfoLayoutConfig`, `LayoutOptions`, `LayoutOrientation`, `LayoutNamePosition`, `LayoutMetric`, and `LayoutRegion` types, and the `LAYOUT_CONFIG_DEFAULT`, `CAMERA_LAYOUT_CONFIG_DEFAULT`, `CONTENT_MAIN_LAYOUT_CONFIG_DEFAULT`, `CONTENT_AUX_LAYOUT_CONFIG_DEFAULT`, `INFO_LAYOUT_CONFIG_DEFAULT`, `LAYOUT_OPTIONS_DEFAULT`, and `CAMERA_ASPECT_RATIO_DEFAULTS` constants.
- **Aspect ratios:** `CONTENT_ASPECT_RATIOS` (frozen), `numericContentAspectRatios`, `widestNumericContentAspectRatio`, the `ContentAspectRatio` and `AspectRatio` types, and `transformAspectRatio` to turn `'16:9'` into `1.777…`.
- **Building blocks**, in the order `generateLayout` uses them:
  - `calculateCanvasGrid`: layout area, content area, gaps, grid cells, side column width, and orientation, with the camera ratio limits and default and the name settings both orientations share.
  - `generateLandscapeLayout` and `generatePortraitLayout`: the two orientations, which `generateLayout` picks between.
  - `distributeLayouts`: split layout configs into balanced rows, or into a given number of them, which portrait reads as columns.
  - `resolveLayoutConfig`: pick the main column region and what stays in the side column, with widths and attachments.
  - Landscape: `calculateRowHeight`, the tallest row height at which every row fits; `calculateCameraHeights`, the shared side camera height; `calculateSideRegionHeights`, side column stacking; `findCollapsedSideIndexes`, side columns left with nothing to show; and `calculateLayoutRegions`, region positions for one participant.
  - Portrait: `calculateColumnWidth`, the cell height and the widest column width at which every main region, and any info row, fits above its side row; `calculateSideRowHeight`, the shared side row content height; `calculateSideRowSizes`, side row sizing, with `hasSideRow`, `isSideRowShared`, `measureSideRow`, `fitSideRowHeight`, and the info row's `canSplitInfoRow` and `splitInfoRow`; and `calculatePortraitLayoutRegions`, region positions for one participant.
  - `expandGreenScreenCamera`: green screen camera expansion toward what each edge faces, with `outerNeighbor`.
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

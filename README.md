# obs-layout-generator

Generate scene layout metrics for multi-participant OBS canvases. Describe each participant's content and the generator returns pixel rectangles for their main content, camera, aux content, info panel, and name tag, arranged in balanced rows on the canvas.

## Install

```sh
npm install obs-layout-generator
```

The package ships as ESM with bundled type declarations and has no runtime dependencies.

## Usage

```ts
import { generateLayout } from 'obs-layout-generator';

const layouts = generateLayout([{ contentMainAspectRatio: '16:9', hasName: true }], {
  canvasMarginBottom: 120,
  canvasPadding: 30,
  canvasGap: 30,
});
// [
//   {
//     camera: { x: 1645, y: 488, width: 245, height: 443 },
//     contentMain: { x: 30, y: 30, width: 1600, height: 900 },
//     name: { x: 1645, y: 783, width: 245, height: 148 },
//   },
// ]
```

Pass one `LayoutConfig` per participant and an optional `LayoutOptions` for the canvas. You get back one `LayoutMetric` per participant, in input order. Any field you leave out takes its value from `LAYOUT_CONFIG_DEFAULT` or `LAYOUT_OPTIONS_DEFAULT`, so `{}` is a participant with 16:9 main content and a camera. The one derived default is `layoutGap`, which is half of `canvasGap` when left out. Set a ratio field to `null` to turn that region off. Calling `generateLayout()` with no arguments lays out a single default participant on a default canvas.

When the canvas is fixed and only the participants change, as in a React component or a bot driving OBS, bind the options once with `createLayoutGenerator` and call the result with just the configs:

```ts
import { createLayoutGenerator } from 'obs-layout-generator';

const generate = createLayoutGenerator({ canvasMarginBottom: 120, canvasPadding: 30, canvasGap: 30 });

generate([{ hasName: true }]); // same result as the example above
generate([{ hasName: true }], { canvasMarginBottom: 0 }); // per-call options override the bound ones
```

An `undefined` field in the per-call options keeps the bound value rather than resetting it to the default, so options built from partial settings can be passed as they are.

## How layouts are built

**Rows.** Participants are split into balanced rows: 1–2 participants use one row, 3–6 use two, 7–12 use three, and so on. Every row has the same height.

**Columns.** Each participant gets a main column and, when needed, a side column to its right.

- The **main column** holds the first region present, in this order: main content, camera, aux content, info. Its width comes from that region's aspect ratio (`contentMainAspectRatio`, `cameraMainAspectRatio`, `contentAuxAspectRatio`, or `infoAspectRatio`; `'auto'` info fills the grid cell).
- The **side column** holds the remaining camera, aux content, and info, stacked with aux content at the top, info below it, and the camera at the bottom. If none remain, the side column and its gap are dropped.

```ts
// No main content: the camera takes the main column at its 16:9 cameraMainAspectRatio
generateLayout([{ contentMainAspectRatio: null, hasName: true }], {
  canvasMarginBottom: 120,
  canvasPadding: 30,
  canvasGap: 30,
});
// [{ camera: { x: 160, y: 30, width: 1600, height: 900 }, name: { x: 160, y: 783, width: 1600, height: 148 } }]
```

**Side column width.** The side column is whatever width remains in a grid cell after the widest content ratio (16:9) at full height. Canvases with more horizontal room get wider side columns. On a 16:9 canvas with no margins or padding nothing remains, so side regions are omitted. Add vertical margins, such as `canvasMarginBottom` for a lower bar, to make room.

**Spacing.** Margins reserve space outside the layout on each side, `canvasPadding` insets the layout from the margins on all four sides, `canvasGap` separates participants across a row and between rows, and `layoutGap` separates a participant's main and side columns. Padding does not set the gaps: leave `canvasGap` out and participants touch.

**Borders.** `regionBorder` reserves a border of that width around every region except the name, which sits inside its host region. The returned rectangles are the content inside the border, so the border box of a region is its rectangle grown by `regionBorder` on every side. Aspect ratios apply to the content, gaps are measured between border boxes, and padding runs from the margins to the border boxes, so borders never overlap each other or leave the padded area.

**Camera height.** In the side column, every participant's camera is the same height: half the row, reduced if needed to leave room for the tallest side aux content in the layout.

**Name tag.** The name sits along the bottom of the camera, or the main content if there is no camera big enough to hold it, or the aux content if there is neither. If none of those is shown, the name is omitted.

**Space that runs out.** A region whose width or height rounds to 0 is omitted rather than returned with a zero or negative size. If every region in a participant's side column is omitted this way, the side column is dropped too and the layout is sized again without it.

## API

### `LayoutConfig`

| Option                   | Type                            | Default | Description                                                                                       |
| ------------------------ | ------------------------------- | ------- | ------------------------------------------------------------------------------------------------- |
| `cameraMainAspectRatio`  | `AspectRatio`                   | `16:9`  | Camera ratio when it takes the main column. Has no effect on a side camera.                       |
| `contentAuxAspectRatio`  | `ContentAspectRatio \| null`    | `null`  | Show aux content at this ratio, or none with `null`.                                              |
| `contentMainAspectRatio` | `ContentAspectRatio \| null`    | `16:9`  | Show main content at this ratio, or none with `null`.                                             |
| `hasCamera`              | `boolean`                       | `true`  | Show a camera.                                                                                    |
| `hasName`                | `boolean`                       | `false` | Show a name tag.                                                                                  |
| `infoAspectRatio`        | `'auto' \| AspectRatio \| null` | `null`  | Show an info panel at this ratio, filling the available space with `'auto'`, or none with `null`. |

`ContentAspectRatio` is one of the ratios in `CONTENT_ASPECT_RATIOS`; `AspectRatio` is any `'width:height'` string. Leaving a field out, or setting it to `undefined`, uses its default; only `null` turns a region off. A ratio that is not positive on both sides, such as `'0:9'`, is invalid and treated like `null`; an invalid `cameraMainAspectRatio` keeps the camera out of the main column.

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

### `LayoutMetric`

Each participant's result has optional `camera`, `contentMain`, `contentAux`, `info`, and `name` regions. Each is a `LayoutRegion` of rounded pixel values, `{ x, y, width, height }`, measured inside any `regionBorder`. Regions that were not requested or did not fit are absent.

### Exports

- **Layout:** `generateLayout` and `createLayoutGenerator`, the `LayoutConfig`, `LayoutOptions`, `LayoutMetric`, and `LayoutRegion` types, and the `LAYOUT_CONFIG_DEFAULT` and `LAYOUT_OPTIONS_DEFAULT` constants.
- **Aspect ratios:** `CONTENT_ASPECT_RATIOS` (frozen), `numericContentAspectRatios`, `widestNumericContentAspectRatio`, the `ContentAspectRatio` and `AspectRatio` types, and `transformAspectRatio` to turn `'16:9'` into `1.777…`.
- **Building blocks**, in the order `generateLayout` uses them:
  - `distributeLayouts`: split layout configs into rows.
  - `calculateCanvasGrid`: content area, gaps, grid cells, and side column width.
  - `resolveLayoutConfig`: pick the main column region and what stays in the side column.
  - `calculateRowHeight`: the tallest row height at which every row fits.
  - `calculateCameraHeights`: the shared side camera height and the name height.
  - `calculateSideRegionHeights`: side column stacking.
  - `findCollapsedSideIndexes`: side columns left with nothing to show.
  - `calculateLayoutRegions`: region positions for one participant.
  - `placeName`: name placement.
  - `roundLayoutMetric` and `roundLayoutRegion`: rounding to whole pixels.
  - The `LayoutMainRegion` and `LayoutAlignment` types. `transformAspectRatio` returns `0` for invalid ratios.

## Development

```sh
npm install
npm run typecheck
npm run lint
npm run format:check
npm run test:coverage
npm run build
```

`npm run dev` rebuilds on change, `npm run test:watch` reruns tests on change, and `npm run lint:fix` and `npm run format` apply fixes. See [AGENTS.md](AGENTS.md) for project conventions.

## License

[MIT](LICENSE) © Elias Thompson

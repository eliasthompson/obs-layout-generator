import { describe, expect, it } from 'vitest';

import type { LayoutConfig } from '@/constants/layoutConfig';
import type { LayoutOptions } from '@/constants/layoutOptions';
import type { LayoutMetric, LayoutRegion } from '@/types/LayoutMetric';

import { CONTENT_ASPECT_RATIOS } from '@/constants/contentAspectRatios';
import { generateLayout } from '@/lib/generateLayout';

const barOptions: LayoutOptions = { canvasGap: 30, canvasMarginBottom: 120, canvasPadding: 30 };
const borderedBarOptions: LayoutOptions = { ...barOptions, regionBorder: 6 };
const borderedContentMain: LayoutRegion = { x: 36, y: 36, width: 1579, height: 888, hasBorder: true };
// A 1080×1920 canvas with the Twitch safe area as margins: the content area is 1020×1284 at (30, 174)
const portraitOptions: LayoutOptions = {
  canvasWidth: 1080,
  canvasHeight: 1920,
  canvasMarginTop: 144,
  canvasMarginBottom: 432,
  canvasPadding: 24,
  canvasGap: 24,
  layoutGap: 18,
  regionBorder: 6,
};
const portraitContentMain: LayoutRegion = { x: 30, y: 174, width: 1020, height: 574, hasBorder: true };

describe('generateLayout', () => {
  it('returns no layout metrics for no layout configs', () => {
    expect(generateLayout([])).toEqual([]);
  });

  it('lays out one default layout config on the default canvas', () => {
    expect(generateLayout()).toEqual([{ contentMain: { x: 0, y: 0, width: 1920, height: 1080, hasBorder: true } }]);
  });

  it('lays out a single participant with a lower bar', () => {
    expect(generateLayout([{ hasName: true }], barOptions)).toEqual([
      {
        camera: { x: 1645, y: 494, width: 245, height: 436, hasBorder: true },
        contentMain: { x: 30, y: 30, width: 1600, height: 900, hasBorder: true },
        name: { x: 1645, y: 785, width: 245, height: 145, hasBorder: false },
      },
    ]);
  });

  it('keeps ordinary layouts unchanged', () => {
    const ratios = ['16:9', '4:3', '1:1', '16:15', '3:2'] as const;
    const variants: LayoutConfig[] = [
      {},
      { camera: null },
      { contentAux: { aspectRatio: '4:3' } },
      { info: { aspectRatio: 'auto' } },
      { info: { aspectRatio: '16:9' } },
      { hasName: false },
      { camera: null, hasName: true },
    ];
    const optionSets: LayoutOptions[] = [
      { canvasGap: 30, canvasMarginBottom: 120, canvasPadding: 30 },
      { canvasGap: 30, canvasPadding: 30 },
      { canvasGap: 20, canvasMarginBottom: 100, canvasMarginTop: 40, canvasPadding: 20 },
      { canvasGap: 30, canvasMarginBottom: 120, canvasMarginLeft: 50, canvasMarginRight: 50, canvasPadding: 30 },
      { canvasGap: 40, canvasMarginBottom: 120, canvasPadding: 10, layoutGap: 10 },
      { canvasGap: 30, canvasMarginBottom: 120, canvasPadding: 30, regionBorder: 6 },
      { canvasGap: 30, canvasMarginBottom: 120, canvasPadding: 30, layoutSideMin: 300 },
      { ...portraitOptions, layoutSideMin: 108, nameHeightMin: 36 },
    ];
    const layouts = optionSets.flatMap((layoutOptions) =>
      Array.from({ length: 9 }, (_, index) => {
        const total = index + 1;
        const layoutConfigs = Array.from({ length: total }, (_, layoutConfigIndex): LayoutConfig => ({
          contentMain: { aspectRatio: ratios[layoutConfigIndex % ratios.length] },
          hasName: true,
          ...variants[(layoutConfigIndex + total) % variants.length],
        }));

        return { layoutOptions, total, layoutMetrics: generateLayout(layoutConfigs, layoutOptions) };
      }),
    );

    expect(layouts).toMatchSnapshot();
  });

  it('offsets the layout by the top and left margins', () => {
    const [layoutMetric] = generateLayout([{}], { canvasMarginLeft: 400, canvasMarginTop: 300, canvasPadding: 30 });

    expect(layoutMetric.contentMain?.x).toBeGreaterThanOrEqual(430);
    expect(layoutMetric.contentMain?.y).toBeGreaterThanOrEqual(330);
  });

  it('omits side regions and moves the name to the main content without side room', () => {
    expect(generateLayout([{ hasName: true }])).toEqual([
      {
        contentMain: { x: 0, y: 0, width: 1920, height: 1080, hasBorder: true },
        name: { x: 0, y: 900, width: 1920, height: 180, hasBorder: false },
      },
    ]);
  });

  it('puts the camera in the main column without main content', () => {
    expect(generateLayout([{ contentMain: null, hasName: true }], barOptions)).toEqual([
      {
        camera: { x: 160, y: 30, width: 1600, height: 900, hasBorder: true },
        name: { x: 160, y: 783, width: 1600, height: 148, hasBorder: false },
      },
    ]);
  });

  it('puts aux content in the main column with the name on it', () => {
    expect(
      generateLayout(
        [{ camera: null, contentAux: { aspectRatio: '4:3' }, contentMain: null, hasName: true }],
        barOptions,
      ),
    ).toEqual([
      {
        contentAux: { x: 360, y: 30, width: 1200, height: 900, hasBorder: true },
        name: { x: 360, y: 783, width: 1200, height: 148, hasBorder: false },
      },
    ]);
  });

  it('fills the grid cell with auto info in the main column without a name', () => {
    expect(generateLayout([{ camera: null, contentMain: null, hasName: true, info: {} }], barOptions)).toEqual([
      { info: { x: 30, y: 30, width: 1860, height: 900, hasBorder: true } },
    ]);
  });

  it('returns an empty layout metric for a layout config without regions', () => {
    expect(generateLayout([{ camera: null, contentMain: null }], barOptions)).toEqual([{}]);
  });

  it('stacks side aux content, side info, and the side camera', () => {
    expect(generateLayout([{ contentAux: { aspectRatio: '4:3' }, info: { aspectRatio: 'auto' } }], barOptions)).toEqual(
      [
        {
          camera: { x: 1645, y: 494, width: 245, height: 436, hasBorder: true },
          contentMain: { x: 30, y: 30, width: 1600, height: 900, hasBorder: true },
          contentAux: { x: 1645, y: 30, width: 245, height: 184, hasBorder: true },
          info: { x: 1645, y: 229, width: 245, height: 251, hasBorder: true },
        },
      ],
    );
  });

  it('starts side info at the top of the row without side aux content', () => {
    const [layoutMetric] = generateLayout([{ info: { aspectRatio: '16:9' } }], barOptions);

    expect(layoutMetric.info).toEqual({ x: 1645, y: 30, width: 245, height: 138, hasBorder: true });
  });

  it('moves the name to the main content when the camera is too short for it', () => {
    const [layoutMetric] = generateLayout([{ contentAux: { aspectRatio: '3:2' }, hasName: true }], {
      canvasGap: 30,
      canvasMarginTop: 420,
      canvasPadding: 30,
    });

    expect(layoutMetric.camera?.height).toBeLessThan(98);
    expect(layoutMetric.name).toEqual({ x: 30, y: 953, width: 1067, height: 98, hasBorder: false });
  });

  it('reserves only the gaps each row has when fitting rows to the content width', () => {
    const layoutMetrics = generateLayout(
      [
        { contentMain: { aspectRatio: '10:9' }, hasName: true },
        { contentMain: { aspectRatio: '16:15' }, hasName: true },
        { contentMain: { aspectRatio: '3:2' }, hasName: true },
        { contentMain: { aspectRatio: '4:6' }, hasName: true },
        { contentMain: { aspectRatio: '16:9' }, hasName: true },
        { contentMain: { aspectRatio: '8:7' }, hasName: true },
        { camera: null, contentMain: { aspectRatio: '8:7' }, hasName: true },
        { camera: null, contentMain: { aspectRatio: '4:3' }, hasName: true },
        { camera: null, contentMain: { aspectRatio: '16:9' }, hasName: true },
        { contentMain: { aspectRatio: '3:2' }, hasName: true },
      ],
      { canvasGap: 10, canvasMarginLeft: 400, canvasMarginRight: 400, canvasPadding: 10 },
    );

    expect(layoutMetrics[0].contentMain).toEqual({ x: 436, y: 179, width: 260, height: 234, hasBorder: true });
  });

  it('drops a side column whose regions all collapsed', () => {
    const layoutMetrics = generateLayout([{ contentAux: { aspectRatio: '1:1' } }, { hasName: true }], {
      canvasGap: 30,
      canvasMarginTop: 420,
      canvasPadding: 30,
    });

    expect(layoutMetrics[1]).toEqual({
      contentMain: { x: 1179, y: 550, width: 711, height: 400, hasBorder: true },
      name: { x: 1179, y: 886, width: 711, height: 64, hasBorder: false },
    });
  });

  it('reserves a side column of layoutSideMin and narrows the main column to fit it', () => {
    expect(generateLayout([{ hasName: true }], { layoutSideMin: 120 })).toEqual([
      {
        camera: { x: 1800, y: 833, width: 120, height: 213, hasBorder: true },
        contentMain: { x: 0, y: 34, width: 1800, height: 1013, hasBorder: true },
        name: { x: 1800, y: 975, width: 120, height: 71, hasBorder: false },
      },
    ]);
  });

  it('raises the name to nameHeightMin within its host', () => {
    expect(generateLayout([{ hasName: true }], { ...barOptions, nameHeightMin: 200 })).toEqual([
      {
        camera: { x: 1645, y: 494, width: 245, height: 436, hasBorder: true },
        contentMain: { x: 30, y: 30, width: 1600, height: 900, hasBorder: true },
        name: { x: 1645, y: 730, width: 245, height: 200, hasBorder: false },
      },
    ]);
  });

  it('reserves a region border around every region but the name', () => {
    expect(generateLayout([{ hasName: true }], borderedBarOptions)).toEqual([
      {
        camera: { x: 1642, y: 494, width: 242, height: 431, hasBorder: true },
        contentMain: borderedContentMain,
        name: { x: 1642, y: 781, width: 242, height: 144, hasBorder: false },
      },
    ]);
  });

  it('attaches a side camera to the main region across a shared border', () => {
    expect(generateLayout([{ camera: { isMainAttached: true } }], borderedBarOptions)).toEqual([
      {
        camera: { x: 1621, y: 494, width: 263, height: 431, hasBorder: true },
        contentMain: borderedContentMain,
      },
    ]);
  });

  it('grows attached side aux content by its ratio and shortens the camera to make room', () => {
    expect(
      generateLayout([{ contentAux: { aspectRatio: '3:2', isMainAttached: true } }], {
        canvasGap: 30,
        canvasMarginTop: 420,
        canvasPadding: 30,
      }),
    ).toEqual([
      {
        camera: { x: 1112, y: 994, width: 778, height: 56, hasBorder: true },
        contentMain: { x: 30, y: 450, width: 1067, height: 600, hasBorder: true },
        contentAux: { x: 1097, y: 450, width: 793, height: 529, hasBorder: true },
      },
    ]);
  });

  it('leaves a side camera unattached when reaching the side info above it would make it narrower than 9:16', () => {
    expect(
      generateLayout([{ camera: { isAboveAttached: true }, info: { aspectRatio: '16:9' } }], borderedBarOptions),
    ).toEqual([
      {
        camera: { x: 1642, y: 494, width: 242, height: 431, hasBorder: true },
        contentMain: borderedContentMain,
        info: { x: 1642, y: 36, width: 242, height: 136, hasBorder: true },
      },
    ]);
  });

  it('reaches an attached side camera up to the side aux content above it across a shared border', () => {
    const [layoutMetric] = generateLayout(
      [{ camera: { isAboveAttached: true }, contentAux: { aspectRatio: '16:9' } }],
      {
        ...borderedBarOptions,
        canvasMarginTop: 300,
      },
    );

    expect(layoutMetric.contentAux).toEqual({ x: 1108, y: 336, width: 776, height: 436, hasBorder: true });
    expect(layoutMetric.camera).toEqual({ x: 1108, y: 778, width: 776, height: 146, hasBorder: true });
  });

  it('moves attached ratio side info up to the side aux content above it without changing its size', () => {
    const [layoutMetric] = generateLayout(
      [{ contentAux: { aspectRatio: '4:3' }, info: { aspectRatio: '16:9', isAboveAttached: true } }],
      borderedBarOptions,
    );

    expect(layoutMetric.contentAux).toEqual({ x: 1642, y: 36, width: 242, height: 182, hasBorder: true });
    expect(layoutMetric.info).toEqual({ x: 1642, y: 224, width: 242, height: 136, hasBorder: true });
  });

  it('grows attached auto side info up to the side aux content above it', () => {
    const [layoutMetric] = generateLayout(
      [{ contentAux: { aspectRatio: '4:3' }, info: { isAboveAttached: true } }],
      borderedBarOptions,
    );

    expect(layoutMetric.info).toEqual({ x: 1642, y: 224, width: 242, height: 243, hasBorder: true });
  });

  it('expands a green screen side camera over its border, the layout gaps, and the padding to the margins', () => {
    expect(generateLayout([{ camera: { isGreenScreen: true }, hasName: true }], borderedBarOptions)).toEqual([
      {
        camera: { x: 1621, y: 473, width: 299, height: 488, hasBorder: false },
        contentMain: borderedContentMain,
        name: { x: 1621, y: 817, width: 299, height: 144, hasBorder: false },
      },
    ]);
  });

  it('expands a green screen side camera halfway toward the next participant and the next row', () => {
    const layoutMetrics = generateLayout([{ camera: { isGreenScreen: true } }, {}, {}], barOptions);

    expect(layoutMetrics[0].camera).toEqual({ x: 803, y: 240, width: 157, height: 240, hasBorder: false });
    expect(layoutMetrics[1].contentMain?.x).toBe(975);
    expect(layoutMetrics[2].contentMain?.y).toBe(495);
  });

  it('expands a green screen main camera to the margins and over the layout gap to its side column', () => {
    expect(
      generateLayout(
        [{ camera: { isGreenScreen: true }, contentMain: null, info: { aspectRatio: '16:9' } }],
        barOptions,
      ),
    ).toEqual([
      {
        camera: { x: 0, y: 0, width: 1645, height: 960, hasBorder: false },
        info: { x: 1645, y: 30, width: 245, height: 138, hasBorder: true },
      },
    ]);
  });

  it('expands a green screen main camera halfway toward the previous participant', () => {
    const layoutMetrics = generateLayout([{}, { camera: { isGreenScreen: true }, contentMain: null }], barOptions);

    expect(layoutMetrics[1].camera).toEqual({ x: 1031, y: 0, width: 889, height: 960, hasBorder: false });
  });

  it('expands a green screen main camera halfway toward the previous row', () => {
    const layoutMetrics = generateLayout([{}, {}, { camera: { isGreenScreen: true }, contentMain: null }], barOptions);

    expect(layoutMetrics[2].camera).toEqual({ x: 0, y: 480, width: 1920, height: 480, hasBorder: false });
  });

  it('lays out a portrait canvas with the main region on top and a lone camera filling the row beneath', () => {
    expect(generateLayout([{ hasName: true }], portraitOptions)).toEqual([
      {
        camera: { x: 30, y: 778, width: 1020, height: 680, hasBorder: true },
        contentMain: portraitContentMain,
        name: { x: 30, y: 1249, width: 1020, height: 209, hasBorder: false },
      },
    ]);
  });

  it('shares the side row between aux content and a camera at least 9:16 wide in portrait', () => {
    expect(generateLayout([{ contentAux: {}, hasName: true }], portraitOptions)).toEqual([
      {
        camera: { x: 756, y: 857, width: 294, height: 522, hasBorder: true },
        contentMain: { ...portraitContentMain, y: 253 },
        contentAux: { x: 30, y: 857, width: 696, height: 522, hasBorder: true },
        name: { x: 756, y: 1205, width: 294, height: 174, hasBorder: false },
      },
    ]);
  });

  it('puts ratio info between the aux content and the camera in the side row, and omits auto info', () => {
    const [layoutMetric] = generateLayout([{ contentAux: {}, info: { aspectRatio: '16:9' } }], portraitOptions);

    expect(layoutMetric).toEqual({
      camera: { x: 903, y: 987, width: 147, height: 261, hasBorder: true },
      contentMain: { ...portraitContentMain, y: 383 },
      contentAux: { x: 30, y: 987, width: 348, height: 261, hasBorder: true },
      info: { x: 408, y: 987, width: 465, height: 261, hasBorder: true },
    });
    expect(generateLayout([{ hasName: true, info: {} }], portraitOptions)).toEqual(
      generateLayout([{ hasName: true }], portraitOptions),
    );
  });

  it('stacks two participants in one column and moves the name off a camera too short for it', () => {
    expect(generateLayout([{ hasName: true }, { hasName: true }], portraitOptions)).toEqual([
      {
        camera: { x: 30, y: 778, width: 1020, height: 20, hasBorder: true },
        contentMain: portraitContentMain,
        name: { x: 30, y: 649, width: 1020, height: 99, hasBorder: false },
      },
      {
        camera: { x: 30, y: 1438, width: 1020, height: 20, hasBorder: true },
        contentMain: { x: 30, y: 834, width: 1020, height: 574, hasBorder: true },
        name: { x: 30, y: 1309, width: 1020, height: 99, hasBorder: false },
      },
    ]);
  });

  it('reserves layoutSideMin beneath each main region in portrait and raises the name to nameHeightMin', () => {
    expect(
      generateLayout([{ hasName: true }, { hasName: true }], {
        ...portraitOptions,
        layoutSideMin: 108,
        nameHeightMin: 36,
      }),
    ).toEqual([
      {
        camera: { x: 108, y: 690, width: 864, height: 108, hasBorder: true },
        contentMain: { x: 108, y: 174, width: 864, height: 486, hasBorder: true },
        name: { x: 108, y: 762, width: 864, height: 36, hasBorder: false },
      },
      {
        camera: { x: 108, y: 1350, width: 864, height: 108, hasBorder: true },
        contentMain: { x: 108, y: 834, width: 864, height: 486, hasBorder: true },
        name: { x: 108, y: 1422, width: 864, height: 36, hasBorder: false },
      },
    ]);
  });

  it('splits three participants into a column of two and a centered column of one in portrait', () => {
    const layoutMetrics = generateLayout([{}, {}, {}], portraitOptions);

    expect(layoutMetrics[0]).toEqual({
      camera: { x: 30, y: 481, width: 492, height: 317, hasBorder: true },
      contentMain: { x: 30, y: 174, width: 492, height: 277, hasBorder: true },
    });
    expect(layoutMetrics[1].contentMain).toEqual({ x: 30, y: 834, width: 492, height: 277, hasBorder: true });
    expect(layoutMetrics[2]).toEqual({
      camera: { x: 558, y: 811, width: 492, height: 317, hasBorder: true },
      contentMain: { x: 558, y: 504, width: 492, height: 277, hasBorder: true },
    });
  });

  it('reaches attached aux content up to the main region in portrait and shortens the camera to fit', () => {
    expect(generateLayout([{ contentAux: { isMainAttached: true } }], portraitOptions)).toEqual([
      {
        camera: { x: 766, y: 865, width: 284, height: 505, hasBorder: true },
        contentMain: { ...portraitContentMain, y: 261 },
        contentAux: { x: 30, y: 841, width: 706, height: 529, hasBorder: true },
      },
    ]);
  });

  it('attaches the camera to the aux content left of it across a shared border in portrait', () => {
    expect(generateLayout([{ camera: { isAboveAttached: true }, contentAux: {} }], portraitOptions)).toEqual([
      {
        camera: { x: 749, y: 850, width: 301, height: 535, hasBorder: true },
        contentMain: { ...portraitContentMain, y: 247 },
        contentAux: { x: 30, y: 850, width: 713, height: 535, hasBorder: true },
      },
    ]);
  });

  it('expands a green screen side camera in portrait to the main region and the margins', () => {
    expect(generateLayout([{ camera: { isGreenScreen: true }, hasName: true }], portraitOptions)).toEqual([
      {
        camera: { x: 0, y: 754, width: 1080, height: 734, hasBorder: false },
        contentMain: portraitContentMain,
        name: { x: 0, y: 1279, width: 1080, height: 209, hasBorder: false },
      },
    ]);
  });

  it('expands a green screen main camera in portrait over the layout gap to its side row', () => {
    expect(
      generateLayout([{ camera: { isGreenScreen: true }, contentAux: {}, contentMain: null }], portraitOptions),
    ).toEqual([
      {
        camera: { x: 0, y: 144, width: 1080, height: 681, hasBorder: false },
        contentAux: { x: 30, y: 831, width: 765, height: 574, hasBorder: true },
      },
    ]);
  });

  it('omits the name when there is no room for it', () => {
    expect(generateLayout([{ hasName: true }], { canvasGap: 60, canvasHeight: 140, canvasPadding: 60 })).toEqual([
      { contentMain: { x: 942, y: 60, width: 36, height: 20, hasBorder: true } },
    ]);
  });

  it('omits the main column when the row has no height', () => {
    expect(generateLayout([{}], { canvasGap: 60, canvasHeight: 120, canvasPadding: 60 })).toEqual([{}]);
  });

  it('keeps every region on the canvas without overlaps', () => {
    let seed = 42;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const pick = <Value>(values: readonly Value[]) => values[Math.floor(random() * values.length)];
    const overlaps = (a: LayoutRegion, b: LayoutRegion, tolerance: number) =>
      Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > tolerance &&
      Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > tolerance;
    const regionKeys = ['camera', 'contentMain', 'contentAux', 'info'] as const;
    const isAttached = ({ camera, contentAux, info }: LayoutConfig) =>
      [
        camera?.isMainAttached,
        camera?.isAboveAttached,
        contentAux?.isMainAttached,
        info?.isMainAttached,
        info?.isAboveAttached,
      ].some(Boolean);

    for (let iteration = 0; iteration < 2000; iteration += 1) {
      const [canvasWidth, canvasHeight] = pick([
        [1920, 1080],
        [1280, 720],
        [2560, 1080],
        [1080, 1080],
        [1080, 1920],
      ] as const);
      const layoutOptions = {
        canvasGap: pick([0, 10, 30, 60]),
        canvasHeight,
        canvasMarginBottom: pick([0, 0, 120, 300]),
        canvasMarginLeft: pick([0, 0, 100, 400]),
        canvasMarginRight: pick([0, 0, 100]),
        canvasMarginTop: pick([0, 0, 50, 200]),
        canvasPadding: pick([0, 10, 30, 60]),
        canvasWidth,
        layoutGap: pick([undefined, 0, 5, 40]),
        layoutSideMin: pick([0, 0, 60, 200]),
        regionBorder: pick([0, 0, 6, 20]),
      };
      // A bordered region's box grows by its border before the bounds and overlap checks; a borderless one is its own
      const boxOf = ({ x, y, width, height, hasBorder }: LayoutRegion): LayoutRegion =>
        hasBorder
          ? {
              x: x - layoutOptions.regionBorder,
              y: y - layoutOptions.regionBorder,
              width: width + layoutOptions.regionBorder * 2,
              height: height + layoutOptions.regionBorder * 2,
              hasBorder,
            }
          : { x, y, width, height, hasBorder };
      const boxesOf = (layoutMetric: LayoutMetric) =>
        regionKeys.flatMap((regionKey) => {
          const region = layoutMetric[regionKey];
          return region ? [boxOf(region)] : [];
        });
      const layoutConfigs = Array.from({ length: 1 + Math.floor(random() * 12) }, (): LayoutConfig => {
        const contentAuxAspectRatio = pick([null, null, ...CONTENT_ASPECT_RATIOS]);
        const contentMainAspectRatio = pick([null, undefined, ...CONTENT_ASPECT_RATIOS]);
        const infoAspectRatio = pick([null, null, 'auto', '16:9', '1:1'] as const);

        return {
          camera:
            random() < 0.7
              ? {
                  mainAspectRatio: pick([undefined, '16:9', '4:3', '9:16'] as const),
                  isMainAttached: random() < 0.3,
                  isAboveAttached: random() < 0.3,
                  isGreenScreen: random() < 0.3,
                }
              : null,
          contentAux: contentAuxAspectRatio
            ? { aspectRatio: contentAuxAspectRatio, isMainAttached: random() < 0.3 }
            : null,
          contentMain: contentMainAspectRatio ? { aspectRatio: contentMainAspectRatio } : contentMainAspectRatio,
          hasName: random() < 0.5,
          info: infoAspectRatio
            ? { aspectRatio: infoAspectRatio, isMainAttached: random() < 0.3, isAboveAttached: random() < 0.3 }
            : null,
        };
      });
      const layoutMetrics = generateLayout(layoutConfigs, layoutOptions);
      // Bordered boxes stay inside the padding; a green screen camera, and a name on it, may run to the margins
      const marginLeft = layoutOptions.canvasMarginLeft;
      const marginRight = canvasWidth - layoutOptions.canvasMarginRight;
      const marginTop = layoutOptions.canvasMarginTop;
      const marginBottom = canvasHeight - layoutOptions.canvasMarginBottom;
      const paddingLeft = marginLeft + layoutOptions.canvasPadding;
      const paddingRight = marginRight - layoutOptions.canvasPadding;
      const paddingTop = marginTop + layoutOptions.canvasPadding;
      const paddingBottom = marginBottom - layoutOptions.canvasPadding;
      const regionsOf = (layoutMetric: LayoutMetric) => [
        ...boxesOf(layoutMetric),
        ...(layoutMetric.name ? [layoutMetric.name] : []),
      ];

      expect(layoutMetrics).toHaveLength(layoutConfigs.length);

      layoutMetrics.forEach((layoutMetric, layoutMetricIndex) => {
        // A bordered camera is never narrower than 9:16, within rounding
        if (layoutMetric.camera?.hasBorder) {
          const { width, height } = layoutMetric.camera;

          expect(height).toBeLessThanOrEqual(width / (9 / 16) + 2);
        }

        // A name sits inside the camera, main content, or aux content that hosts it
        if (layoutMetric.name) {
          const { name } = layoutMetric;
          const hosts = [layoutMetric.camera, layoutMetric.contentMain, layoutMetric.contentAux];
          const isInside = (host: LayoutRegion) =>
            name.x >= host.x - 1 &&
            name.x + name.width <= host.x + host.width + 1 &&
            name.y >= host.y - 1 &&
            name.y + name.height <= host.y + host.height + 1;

          expect(hosts.some((host) => host && isInside(host))).toBe(true);
        }

        regionsOf(layoutMetric).forEach((region) => {
          const [left, right, top, bottom] = region.hasBorder
            ? [paddingLeft, paddingRight, paddingTop, paddingBottom]
            : [marginLeft, marginRight, marginTop, marginBottom];

          expect(region.width).toBeGreaterThan(0);
          expect(region.height).toBeGreaterThan(0);
          expect(region.x).toBeGreaterThanOrEqual(left - 1);
          expect(region.x + region.width).toBeLessThanOrEqual(right + 1);
          expect(region.y).toBeGreaterThanOrEqual(top - 1);
          expect(region.y + region.height).toBeLessThanOrEqual(bottom + 1);
        });

        // Attached regions of one participant share a border, so their boxes may overlap by that much
        const presentBoxes = boxesOf(layoutMetric);
        const tolerance = isAttached(layoutConfigs[layoutMetricIndex]) ? layoutOptions.regionBorder + 1 : 1;

        presentBoxes.forEach((box, boxIndex) => {
          presentBoxes.slice(boxIndex + 1).forEach((otherBox) => {
            expect(overlaps(box, otherBox, tolerance)).toBe(false);
          });
        });

        layoutMetrics.slice(layoutMetricIndex + 1).forEach((otherLayoutMetric) => {
          regionsOf(layoutMetric).forEach((region) => {
            regionsOf(otherLayoutMetric).forEach((otherRegion) => {
              expect(overlaps(region, otherRegion, 1)).toBe(false);
            });
          });
        });
      });
    }
  });
});

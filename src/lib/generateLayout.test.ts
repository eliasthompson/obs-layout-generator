import { describe, expect, it } from 'vitest';

import type { LayoutConfig } from '@/constants/layoutConfig';
import type { LayoutOptions } from '@/constants/layoutOptions';
import type { LayoutMetric, LayoutRegion } from '@/types/LayoutMetric';

import { CONTENT_ASPECT_RATIOS } from '@/constants/contentAspectRatios';
import { generateLayout } from '@/lib/generateLayout';

const barOptions: LayoutOptions = { canvasGap: 30, canvasMarginBottom: 120, canvasPadding: 30 };

describe('generateLayout', () => {
  it('returns no layout metrics for no layout configs', () => {
    expect(generateLayout([])).toEqual([]);
  });

  it('lays out one default layout config on the default canvas', () => {
    expect(generateLayout()).toEqual([{ contentMain: { x: 0, y: 0, width: 1920, height: 1080 } }]);
  });

  it('lays out a single participant with a lower bar', () => {
    expect(generateLayout([{ hasName: true }], barOptions)).toEqual([
      {
        camera: { x: 1645, y: 488, width: 245, height: 443 },
        contentMain: { x: 30, y: 30, width: 1600, height: 900 },
        name: { x: 1645, y: 783, width: 245, height: 148 },
      },
    ]);
  });

  it('keeps ordinary layouts unchanged', () => {
    const ratios = ['16:9', '4:3', '1:1', '16:15', '3:2'] as const;
    const variants: LayoutConfig[] = [
      {},
      { hasCamera: false },
      { contentAuxAspectRatio: '4:3' },
      { infoAspectRatio: 'auto' },
      { infoAspectRatio: '16:9' },
      { hasName: false },
      { hasCamera: false, hasName: true },
    ];
    const optionSets: LayoutOptions[] = [
      { canvasGap: 30, canvasMarginBottom: 120, canvasPadding: 30 },
      { canvasGap: 30, canvasPadding: 30 },
      { canvasGap: 20, canvasMarginBottom: 100, canvasMarginTop: 40, canvasPadding: 20 },
      { canvasGap: 30, canvasMarginBottom: 120, canvasMarginLeft: 50, canvasMarginRight: 50, canvasPadding: 30 },
      { canvasGap: 40, canvasMarginBottom: 120, canvasPadding: 10, layoutGap: 10 },
      { canvasGap: 30, canvasMarginBottom: 120, canvasPadding: 30, regionBorder: 6 },
    ];
    const layouts = optionSets.flatMap((layoutOptions) =>
      Array.from({ length: 9 }, (_, index) => {
        const total = index + 1;
        const layoutConfigs = Array.from({ length: total }, (_, layoutConfigIndex) => ({
          contentMainAspectRatio: ratios[layoutConfigIndex % ratios.length],
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
        contentMain: { x: 0, y: 0, width: 1920, height: 1080 },
        name: { x: 0, y: 900, width: 1920, height: 180 },
      },
    ]);
  });

  it('puts the camera in the main column without main content', () => {
    expect(generateLayout([{ contentMainAspectRatio: null, hasName: true }], barOptions)).toEqual([
      {
        camera: { x: 160, y: 30, width: 1600, height: 900 },
        name: { x: 160, y: 783, width: 1600, height: 148 },
      },
    ]);
  });

  it('puts aux content in the main column with the name on it', () => {
    expect(
      generateLayout(
        [{ contentAuxAspectRatio: '4:3', contentMainAspectRatio: null, hasCamera: false, hasName: true }],
        barOptions,
      ),
    ).toEqual([
      {
        contentAux: { x: 360, y: 30, width: 1200, height: 900 },
        name: { x: 360, y: 783, width: 1200, height: 148 },
      },
    ]);
  });

  it('fills the grid cell with auto info in the main column without a name', () => {
    expect(
      generateLayout(
        [{ contentMainAspectRatio: null, hasCamera: false, hasName: true, infoAspectRatio: 'auto' }],
        barOptions,
      ),
    ).toEqual([{ info: { x: 30, y: 30, width: 1860, height: 900 } }]);
  });

  it('returns an empty layout metric for a layout config without regions', () => {
    expect(generateLayout([{ contentMainAspectRatio: null, hasCamera: false }], barOptions)).toEqual([{}]);
  });

  it('stacks side aux content, side info, and the side camera', () => {
    expect(generateLayout([{ contentAuxAspectRatio: '4:3', infoAspectRatio: 'auto' }], barOptions)).toEqual([
      {
        camera: { x: 1645, y: 488, width: 245, height: 443 },
        contentMain: { x: 30, y: 30, width: 1600, height: 900 },
        contentAux: { x: 1645, y: 30, width: 245, height: 184 },
        info: { x: 1645, y: 229, width: 245, height: 244 },
      },
    ]);
  });

  it('starts side info at the top of the row without side aux content', () => {
    const [layoutMetric] = generateLayout([{ infoAspectRatio: '16:9' }], barOptions);

    expect(layoutMetric.info).toEqual({ x: 1645, y: 30, width: 245, height: 138 });
  });

  it('moves the name to the main content when the camera is too short for it', () => {
    const [layoutMetric] = generateLayout([{ contentAuxAspectRatio: '3:2', hasName: true }], {
      canvasGap: 30,
      canvasMarginTop: 420,
      canvasPadding: 30,
    });

    expect(layoutMetric.camera?.height).toBeLessThan(98);
    expect(layoutMetric.name).toEqual({ x: 30, y: 953, width: 1067, height: 98 });
  });

  it('reserves only the gaps each row has when fitting rows to the content width', () => {
    const layoutMetrics = generateLayout(
      [
        { contentMainAspectRatio: '10:9', hasName: true },
        { contentMainAspectRatio: '16:15', hasName: true },
        { contentMainAspectRatio: '3:2', hasName: true },
        { contentMainAspectRatio: '4:6', hasName: true },
        { contentMainAspectRatio: '16:9', hasName: true },
        { contentMainAspectRatio: '8:7', hasName: true },
        { contentMainAspectRatio: '8:7', hasCamera: false, hasName: true },
        { contentMainAspectRatio: '4:3', hasCamera: false, hasName: true },
        { contentMainAspectRatio: '16:9', hasCamera: false, hasName: true },
        { contentMainAspectRatio: '3:2', hasName: true },
      ],
      { canvasGap: 10, canvasHeight: 1920, canvasPadding: 10, canvasWidth: 1080 },
    );

    expect(layoutMetrics[0].contentMain).toEqual({ x: 35, y: 612, width: 251, height: 226 });
  });

  it('drops a side column whose regions all collapsed', () => {
    const layoutMetrics = generateLayout([{ contentAuxAspectRatio: '1:1' }, { hasName: true }], {
      canvasGap: 30,
      canvasMarginTop: 420,
      canvasPadding: 30,
    });

    expect(layoutMetrics[1]).toEqual({
      contentMain: { x: 1179, y: 550, width: 711, height: 400 },
      name: { x: 1179, y: 886, width: 711, height: 64 },
    });
  });

  it('raises the name to nameHeightMin within its host', () => {
    expect(generateLayout([{ hasName: true }], { ...barOptions, nameHeightMin: 200 })).toEqual([
      {
        camera: { x: 1645, y: 488, width: 245, height: 443 },
        contentMain: { x: 30, y: 30, width: 1600, height: 900 },
        name: { x: 1645, y: 730, width: 245, height: 200 },
      },
    ]);
  });

  it('reserves a region border around every region but the name', () => {
    expect(generateLayout([{ hasName: true }], { ...barOptions, regionBorder: 6 })).toEqual([
      {
        camera: { x: 1642, y: 494, width: 242, height: 431 },
        contentMain: { x: 36, y: 36, width: 1579, height: 888 },
        name: { x: 1642, y: 781, width: 242, height: 144 },
      },
    ]);
  });

  it('omits the name when there is no room for it', () => {
    expect(generateLayout([{ hasName: true }], { canvasGap: 60, canvasHeight: 140, canvasPadding: 60 })).toEqual([
      { contentMain: { x: 942, y: 60, width: 36, height: 20 } },
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
    const overlaps = (a: LayoutRegion, b: LayoutRegion) =>
      Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 &&
      Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1;
    const regionKeys = ['camera', 'contentMain', 'contentAux', 'info'] as const;

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
        regionBorder: pick([0, 0, 6, 20]),
      };
      // Every region but the name grows by its border before the bounds and overlap checks
      const bordered = ({ x, y, width, height }: LayoutRegion): LayoutRegion => ({
        x: x - layoutOptions.regionBorder,
        y: y - layoutOptions.regionBorder,
        width: width + layoutOptions.regionBorder * 2,
        height: height + layoutOptions.regionBorder * 2,
      });
      const borderedRegionsOf = (layoutMetric: LayoutMetric) =>
        regionKeys.flatMap((regionKey) => {
          const region = layoutMetric[regionKey];
          return region ? [bordered(region)] : [];
        });
      const layoutConfigs = Array.from({ length: 1 + Math.floor(random() * 12) }, (): LayoutConfig => ({
        cameraMainAspectRatio: pick([undefined, '16:9', '4:3', '9:16'] as const),
        contentAuxAspectRatio: pick([null, null, ...CONTENT_ASPECT_RATIOS]),
        contentMainAspectRatio: pick([null, undefined, ...CONTENT_ASPECT_RATIOS]),
        hasCamera: random() < 0.7,
        hasName: random() < 0.5,
        infoAspectRatio: pick([null, null, 'auto', '16:9', '1:1'] as const),
      }));
      const layoutMetrics = generateLayout(layoutConfigs, layoutOptions);
      const left = layoutOptions.canvasMarginLeft + layoutOptions.canvasPadding;
      const right = canvasWidth - layoutOptions.canvasMarginRight - layoutOptions.canvasPadding;
      const top = layoutOptions.canvasMarginTop + layoutOptions.canvasPadding;
      const bottom = canvasHeight - layoutOptions.canvasMarginBottom - layoutOptions.canvasPadding;
      const regionsOf = (layoutMetric: LayoutMetric) => [
        ...borderedRegionsOf(layoutMetric),
        ...(layoutMetric.name ? [layoutMetric.name] : []),
      ];

      expect(layoutMetrics).toHaveLength(layoutConfigs.length);

      layoutMetrics.forEach((layoutMetric, layoutMetricIndex) => {
        regionsOf(layoutMetric).forEach((region) => {
          expect(region.width).toBeGreaterThan(0);
          expect(region.height).toBeGreaterThan(0);
          expect(region.x).toBeGreaterThanOrEqual(left - 1);
          expect(region.x + region.width).toBeLessThanOrEqual(right + 1);
          expect(region.y).toBeGreaterThanOrEqual(top - 1);
          expect(region.y + region.height).toBeLessThanOrEqual(bottom + 1);
        });

        const presentRegions = borderedRegionsOf(layoutMetric);

        presentRegions.forEach((region, regionIndex) => {
          presentRegions.slice(regionIndex + 1).forEach((otherRegion) => {
            expect(overlaps(region, otherRegion)).toBe(false);
          });
        });

        layoutMetrics.slice(layoutMetricIndex + 1).forEach((otherLayoutMetric) => {
          regionsOf(layoutMetric).forEach((region) => {
            regionsOf(otherLayoutMetric).forEach((otherRegion) => {
              expect(overlaps(region, otherRegion)).toBe(false);
            });
          });
        });
      });
    }
  });
});

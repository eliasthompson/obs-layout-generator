import { describe, expect, it } from 'vitest';

import type { LayoutConfig } from '@/constants/layoutConfig';
import type { LayoutOptions } from '@/constants/layoutOptions';
import type { LayoutMetric, LayoutMetricItem } from '@/types/LayoutMetric';

import { CONTENT_ASPECT_RATIOS } from '@/constants/contentAspectRatios';
import { generateLayout } from '@/lib/generateLayout';

const barOptions: LayoutOptions = { canvasMarginBottom: 120, canvasPadding: 30 };

describe('generateLayout', () => {
  it('returns no layout metrics for no layout configs', () => {
    expect(generateLayout([])).toEqual([]);
  });

  it('lays out one default layout config on the default canvas', () => {
    expect(generateLayout()).toEqual([{ contentMain: { x: 0, y: 0, width: 1920, height: 1080 } }]);
  });

  it('keeps the original single participant layout', () => {
    expect(generateLayout([{ hasName: true }], barOptions)).toEqual([
      {
        camera: { x: 1432, y: 488, width: 458, height: 383 },
        contentMain: { x: 30, y: 90, width: 1387, height: 780 },
        name: { x: 1432, y: 743, width: 458, height: 128 },
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
      { canvasPadding: 30, canvasMarginBottom: 120 },
      { canvasPadding: 30 },
      { canvasPadding: 20, canvasMarginBottom: 100, canvasMarginTop: 40 },
      { canvasPadding: 30, canvasMarginBottom: 120, canvasMarginLeft: 50, canvasMarginRight: 50 },
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
    expect(layoutMetric.contentMain?.y).toBeGreaterThanOrEqual(390);
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
        camera: { x: 267, y: 90, width: 1387, height: 780 },
        name: { x: 267, y: 743, width: 1387, height: 128 },
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
        contentAux: { x: 440, y: 90, width: 1040, height: 780 },
        name: { x: 440, y: 743, width: 1040, height: 128 },
      },
    ]);
  });

  it('fills the grid cell with auto info in the main column without a name', () => {
    expect(
      generateLayout(
        [{ contentMainAspectRatio: null, hasCamera: false, hasName: true, infoAspectRatio: 'auto' }],
        barOptions,
      ),
    ).toEqual([{ info: { x: 30, y: 90, width: 1860, height: 780 } }]);
  });

  it('returns an empty layout metric for a layout config without regions', () => {
    expect(generateLayout([{ contentMainAspectRatio: null, hasCamera: false }], barOptions)).toEqual([{}]);
  });

  it('stacks side aux content, side info, and the side camera', () => {
    expect(generateLayout([{ contentAuxAspectRatio: '4:3', infoAspectRatio: 'auto' }], barOptions)).toEqual([
      {
        camera: { x: 1432, y: 488, width: 458, height: 383 },
        contentMain: { x: 30, y: 90, width: 1387, height: 780 },
        contentAux: { x: 1432, y: 90, width: 458, height: 344 },
        info: { x: 1432, y: 449, width: 458, height: 24 },
      },
    ]);
  });

  it('starts side info at the top of the row without side aux content', () => {
    const [layoutMetric] = generateLayout([{ infoAspectRatio: '16:9' }], barOptions);

    expect(layoutMetric.info).toEqual({ x: 1432, y: 90, width: 458, height: 258 });
  });

  it('moves the name to the main content when the camera is too short for it', () => {
    const [layoutMetric] = generateLayout([{ contentAuxAspectRatio: '3:2', hasName: true }], {
      canvasMarginTop: 300,
      canvasPadding: 30,
    });

    expect(layoutMetric.camera?.height).toBeLessThan(98);
    expect(layoutMetric.name).toEqual({ x: 30, y: 893, width: 1067, height: 98 });
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
      { canvasHeight: 1920, canvasPadding: 10, canvasWidth: 1080 },
    );

    expect(layoutMetrics[0].contentMain).toEqual({ x: 35, y: 612, width: 251, height: 226 });
  });

  it('drops a side column whose regions all collapsed', () => {
    const layoutMetrics = generateLayout([{ contentAuxAspectRatio: '1:1' }, { hasName: true }], {
      canvasMarginTop: 300,
      canvasPadding: 30,
    });

    expect(layoutMetrics[1]).toEqual({
      contentMain: { x: 1179, y: 490, width: 711, height: 400 },
      name: { x: 1179, y: 826, width: 711, height: 64 },
    });
  });

  it('omits the name when there is no room for it', () => {
    expect(generateLayout([{ hasName: true }], { canvasHeight: 380, canvasPadding: 60 })).toEqual([
      { contentMain: { x: 942, y: 180, width: 36, height: 20 } },
    ]);
  });

  it('omits the main column when the row has no height', () => {
    expect(generateLayout([{}], { canvasHeight: 360, canvasPadding: 60 })).toEqual([{}]);
  });

  it('keeps every region on the canvas without overlaps', () => {
    let seed = 42;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const pick = <Value>(values: readonly Value[]) => values[Math.floor(random() * values.length)];
    const overlaps = (a: LayoutMetricItem, b: LayoutMetricItem) =>
      Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 &&
      Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1;
    const regions = ['camera', 'contentMain', 'contentAux', 'info'] as const;

    for (let iteration = 0; iteration < 2000; iteration += 1) {
      const [canvasWidth, canvasHeight] = pick([
        [1920, 1080],
        [1280, 720],
        [2560, 1080],
        [1080, 1080],
        [1080, 1920],
      ] as const);
      const layoutOptions = {
        canvasHeight,
        canvasMarginBottom: pick([0, 0, 120, 300]),
        canvasMarginLeft: pick([0, 0, 100, 400]),
        canvasMarginRight: pick([0, 0, 100]),
        canvasMarginTop: pick([0, 0, 50, 200]),
        canvasPadding: pick([0, 10, 30, 60]),
        canvasWidth,
      };
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
      const top = layoutOptions.canvasMarginTop + layoutOptions.canvasPadding * 3;
      const bottom = canvasHeight - layoutOptions.canvasMarginBottom - layoutOptions.canvasPadding * 3;
      const items = (layoutMetric: LayoutMetric) => Object.values(layoutMetric) as LayoutMetricItem[];

      expect(layoutMetrics).toHaveLength(layoutConfigs.length);

      layoutMetrics.forEach((layoutMetric, layoutMetricIndex) => {
        items(layoutMetric).forEach((item) => {
          expect(item.width).toBeGreaterThan(0);
          expect(item.height).toBeGreaterThan(0);
          expect(item.x).toBeGreaterThanOrEqual(left - 1);
          expect(item.x + item.width).toBeLessThanOrEqual(right + 1);
          expect(item.y).toBeGreaterThanOrEqual(top - 1);
          expect(item.y + item.height).toBeLessThanOrEqual(bottom + 1);
        });

        const presentRegions = regions.flatMap((region) => layoutMetric[region] ?? []);

        presentRegions.forEach((item, itemIndex) => {
          presentRegions.slice(itemIndex + 1).forEach((otherItem) => {
            expect(overlaps(item, otherItem)).toBe(false);
          });
        });

        layoutMetrics.slice(layoutMetricIndex + 1).forEach((otherLayoutMetric) => {
          items(layoutMetric).forEach((item) => {
            items(otherLayoutMetric).forEach((otherItem) => {
              expect(overlaps(item, otherItem)).toBe(false);
            });
          });
        });
      });
    }
  });
});

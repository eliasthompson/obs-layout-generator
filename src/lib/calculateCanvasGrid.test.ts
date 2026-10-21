import { describe, expect, it } from 'vitest';

import {
  calculateCanvasGrid,
  numericContentAspectRatios,
  widestNumericContentAspectRatio,
} from '@/lib/calculateCanvasGrid';

describe('calculateCanvasGrid', () => {
  it('derives the numeric content ratios and the widest one', () => {
    expect(numericContentAspectRatios).toHaveLength(9);
    expect(widestNumericContentAspectRatio).toBe(16 / 9);
  });

  it('leaves no side room on the default canvas', () => {
    expect(calculateCanvasGrid({}, 1)).toEqual({
      canvasContentHeight: 1080,
      canvasContentWidth: 1920,
      canvasContentX: 0,
      canvasContentY: 0,
      canvasGap: 0,
      canvasGridUnitNumericAspectRatio: 16 / 9,
      canvasLayoutHeight: 1080,
      canvasLayoutWidth: 1920,
      canvasLayoutX: 0,
      canvasLayoutY: 0,
      hasSideRoom: false,
      isPortrait: false,
      layoutGap: 0,
      layoutSideMin: 0,
      layoutSideWidth: 0,
      regionBorder: 0,
    });
  });

  it('detects a portrait content area, but not a square one', () => {
    expect(calculateCanvasGrid({ canvasHeight: 1920, canvasWidth: 1080 }, 1).isPortrait).toBe(true);
    expect(calculateCanvasGrid({ canvasHeight: 1080, canvasWidth: 1080 }, 1).isPortrait).toBe(false);
    expect(calculateCanvasGrid({ canvasMarginLeft: 900 }, 1).isPortrait).toBe(true);
  });

  it('raises the side column to layoutSideMin when a cell has less left', () => {
    expect(calculateCanvasGrid({ layoutSideMin: 120 }, 1)).toMatchObject({
      hasSideRoom: true,
      layoutSideMin: 120,
      layoutSideWidth: 120,
    });
    expect(
      calculateCanvasGrid({ canvasGap: 30, canvasMarginBottom: 120, canvasPadding: 30, layoutSideMin: 120 }, 1)
        .layoutSideWidth,
    ).toBeCloseTo(1860 - (900 * 16) / 9 - 15);
  });

  it('gives the side column what a grid cell has left after the widest content ratio', () => {
    const canvasGrid = calculateCanvasGrid({ canvasGap: 30, canvasMarginBottom: 120, canvasPadding: 30 }, 1);

    expect(canvasGrid).toMatchObject({
      canvasContentHeight: 900,
      canvasContentWidth: 1860,
      canvasContentX: 30,
      canvasContentY: 30,
      canvasGap: 30,
      hasSideRoom: true,
      layoutGap: 15,
    });
    expect(canvasGrid.canvasGridUnitNumericAspectRatio).toBeCloseTo(1860 / 900);
    expect(canvasGrid.layoutSideWidth).toBeCloseTo(1860 - (900 * 16) / 9 - 15);
  });

  it('splits the content area into a grid sized for the layout config count', () => {
    const canvasGrid = calculateCanvasGrid({ canvasGap: 30, canvasMarginBottom: 120, canvasPadding: 30 }, 4);

    expect(canvasGrid.canvasGridUnitNumericAspectRatio).toBeCloseTo(915 / 435);
    expect(canvasGrid.layoutSideWidth).toBeCloseTo(915 - (435 * 16) / 9 - 15);
  });

  it('leaves the gaps at 0 when only padding is set', () => {
    expect(calculateCanvasGrid({ canvasPadding: 30 }, 1)).toMatchObject({
      canvasContentHeight: 1020,
      canvasContentWidth: 1860,
      canvasContentX: 30,
      canvasContentY: 30,
      canvasGap: 0,
      layoutGap: 0,
    });
  });

  it('halves the canvas gap for the layout gap unless one is given', () => {
    expect(calculateCanvasGrid({ canvasGap: 20 }, 1)).toMatchObject({ canvasGap: 20, layoutGap: 10 });
    expect(calculateCanvasGrid({ canvasGap: 20, layoutGap: 4 }, 1)).toMatchObject({ canvasGap: 20, layoutGap: 4 });
  });

  it('offsets the layout area by the margins and the content area by the margins and padding', () => {
    expect(
      calculateCanvasGrid(
        {
          canvasHeight: 720,
          canvasMarginBottom: 20,
          canvasMarginLeft: 100,
          canvasMarginRight: 40,
          canvasMarginTop: 50,
          canvasPadding: 10,
          canvasWidth: 1280,
        },
        1,
      ),
    ).toMatchObject({
      canvasContentHeight: 630,
      canvasContentWidth: 1120,
      canvasContentX: 110,
      canvasContentY: 60,
      canvasLayoutHeight: 650,
      canvasLayoutWidth: 1140,
      canvasLayoutX: 100,
      canvasLayoutY: 50,
    });
  });

  it('insets the content area by one region border and widens the gaps by two', () => {
    const canvasGrid = calculateCanvasGrid(
      { canvasGap: 30, canvasMarginBottom: 120, canvasPadding: 30, regionBorder: 6 },
      1,
    );

    expect(canvasGrid).toMatchObject({
      canvasContentHeight: 888,
      canvasContentWidth: 1848,
      canvasContentX: 36,
      canvasContentY: 36,
      canvasGap: 42,
      layoutGap: 27,
      regionBorder: 6,
    });
    expect(canvasGrid.layoutSideWidth).toBeCloseTo(1848 - (888 * 16) / 9 - 27);
    expect(calculateCanvasGrid({ canvasGap: 30, layoutGap: 10, regionBorder: 6 }, 1)).toMatchObject({
      canvasGap: 42,
      layoutGap: 22,
    });
  });

  it('never gives the side column a negative width', () => {
    expect(calculateCanvasGrid({ canvasMarginLeft: 400 }, 1)).toMatchObject({
      hasSideRoom: false,
      layoutSideWidth: 0,
    });
  });
});

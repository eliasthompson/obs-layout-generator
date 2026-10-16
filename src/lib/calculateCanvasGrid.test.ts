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
      hasSideRoom: false,
      layoutGap: 0,
      layoutSideWidth: 0,
    });
  });

  it('gives the side column what a grid cell has left after the widest content ratio', () => {
    const canvasGrid = calculateCanvasGrid({ canvasMarginBottom: 120, canvasPadding: 30 }, 1);

    expect(canvasGrid).toMatchObject({
      canvasContentHeight: 780,
      canvasContentWidth: 1860,
      canvasContentX: 30,
      canvasContentY: 90,
      canvasGap: 30,
      hasSideRoom: true,
      layoutGap: 15,
    });
    expect(canvasGrid.canvasGridUnitNumericAspectRatio).toBeCloseTo(1860 / 780);
    expect(canvasGrid.layoutSideWidth).toBeCloseTo(1860 - (780 * 16) / 9 - 15);
  });

  it('splits the content area into a grid sized for the layout config count', () => {
    const canvasGrid = calculateCanvasGrid({ canvasMarginBottom: 120, canvasPadding: 30 }, 4);

    expect(canvasGrid.canvasGridUnitNumericAspectRatio).toBeCloseTo(915 / 375);
    expect(canvasGrid.layoutSideWidth).toBeCloseTo(915 - (375 * 16) / 9 - 15);
  });

  it('offsets the content area by the margins and padding', () => {
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
      canvasContentHeight: 590,
      canvasContentWidth: 1120,
      canvasContentX: 110,
      canvasContentY: 80,
    });
  });

  it('never gives the side column a negative width', () => {
    expect(calculateCanvasGrid({ canvasMarginLeft: 400 }, 1)).toMatchObject({
      hasSideRoom: false,
      layoutSideWidth: 0,
    });
  });
});

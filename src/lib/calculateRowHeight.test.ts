import { describe, expect, it } from 'vitest';

import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

import { calculateRowHeight, type CalculateRowHeightContext } from '@/lib/calculateRowHeight';

const context: CalculateRowHeightContext = { canvasContentHeight: 500, canvasContentWidth: 1000, canvasGap: 10 };

const createResolvedLayoutConfig = (mainNumericAspectRatio: number, sideWidthTotal = 0): ResolvedLayoutConfig => ({
  hasName: false,
  hasSideCamera: false,
  hasSideInfo: false,
  isCameraAboveAttached: false,
  isCameraGreenScreen: false,
  isInfoAboveAttached: false,
  mainNumericAspectRatio,
  sideCameraWidth: 0,
  sideContentAuxWidth: 0,
  sideInfoWidth: 0,
  sideWidthTotal,
});

describe('calculateRowHeight', () => {
  it('uses the full content height when the row fits the width', () => {
    expect(calculateRowHeight([[createResolvedLayoutConfig(1)]], context)).toBe(500);
  });

  it('shrinks the row to fit the content width after side columns', () => {
    expect(calculateRowHeight([[createResolvedLayoutConfig(4, 100)]], context)).toBe(225);
  });

  it('shares the content height between rows and their gaps', () => {
    expect(calculateRowHeight([[createResolvedLayoutConfig(2)], [createResolvedLayoutConfig(1)]], context)).toBe(245);
  });

  it('reserves only the gaps each row has', () => {
    expect(
      calculateRowHeight([[createResolvedLayoutConfig(2), createResolvedLayoutConfig(2)]], {
        ...context,
        canvasContentHeight: 2000,
      }),
    ).toBe(247.5);
  });

  it('fits the row that runs out of width first', () => {
    expect(
      calculateRowHeight(
        [
          [createResolvedLayoutConfig(1), createResolvedLayoutConfig(1), createResolvedLayoutConfig(1)],
          [createResolvedLayoutConfig(2, 400)],
        ],
        { ...context, canvasContentHeight: 2000 },
      ),
    ).toBe(300);
  });

  it('ignores rows without a main column', () => {
    expect(calculateRowHeight([[createResolvedLayoutConfig(0)]], context)).toBe(500);
  });
});

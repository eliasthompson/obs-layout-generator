import { describe, expect, it } from 'vitest';

import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

import { calculateColumnWidth, type CalculateColumnWidthContext } from '@/lib/calculateColumnWidth';

const context: CalculateColumnWidthContext = {
  canvasContentHeight: 1284,
  canvasContentWidth: 1020,
  canvasGap: 36,
  layoutGap: 30,
  layoutSideMin: 0,
};

const createResolvedLayoutConfig = (resolvedLayoutConfig: Partial<ResolvedLayoutConfig>): ResolvedLayoutConfig => ({
  hasName: false,
  hasSideCamera: true,
  hasSideInfo: false,
  isCameraAboveAttached: false,
  isCameraGreenScreen: false,
  isCameraMainAttached: false,
  isContentAuxMainAttached: false,
  isInfoAboveAttached: false,
  isInfoMainAttached: false,
  mainNumericAspectRatio: 16 / 9,
  mainRegion: 'contentMain',
  sideCameraWidth: 0,
  sideContentAuxWidth: 0,
  sideInfoWidth: 0,
  sideWidthTotal: 0,
  ...resolvedLayoutConfig,
});

const participant = createResolvedLayoutConfig({});

describe('calculateColumnWidth', () => {
  it('gives one participant the whole content area', () => {
    expect(calculateColumnWidth([[participant]], context)).toEqual({ cellHeight: 1284, columnWidth: 1020 });
  });

  it('splits the content height between the cells of a column', () => {
    expect(calculateColumnWidth([[participant, participant]], context)).toEqual({ cellHeight: 624, columnWidth: 1020 });
  });

  it('narrows the column so each main region leaves layoutSideMin for its side row', () => {
    expect(calculateColumnWidth([[participant, participant]], { ...context, layoutSideMin: 108 })).toEqual({
      cellHeight: 624,
      columnWidth: 864,
    });
  });

  it('splits the content width between columns and sizes cells by the fullest column', () => {
    expect(calculateColumnWidth([[participant, participant], [participant]], context)).toEqual({
      cellHeight: 624,
      columnWidth: 492,
    });
  });

  it('lets a main region without a side row fill its cell', () => {
    const noSideRow = createResolvedLayoutConfig({ hasSideCamera: false, mainNumericAspectRatio: 1 });

    expect(calculateColumnWidth([[noSideRow, noSideRow]], context).columnWidth).toBe(624);
  });

  it('narrows the column for a tall main region with a side row', () => {
    expect(
      calculateColumnWidth([[createResolvedLayoutConfig({ mainNumericAspectRatio: 4 / 6 })]], context).columnWidth,
    ).toBeCloseTo((4 / 6) * (1284 - 30));
  });

  it('ignores participants without a main region', () => {
    expect(
      calculateColumnWidth(
        [[createResolvedLayoutConfig({ hasSideCamera: false, mainNumericAspectRatio: 0, mainRegion: undefined })]],
        context,
      ).columnWidth,
    ).toBe(1020);
  });
});

import { describe, expect, it } from 'vitest';

import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

import { calculateColumnWidth, type CalculateColumnWidthContext } from '@/lib/calculateColumnWidth';

const context: CalculateColumnWidthContext = {
  cameraNumericAspectRatioMax: 16 / 9,
  canvasContentHeight: 1284,
  canvasContentWidth: 1020,
  canvasGap: 36,
  layoutGap: 30,
  layoutSideMin: 0,
  regionBorder: 6,
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
const noSideRow = createResolvedLayoutConfig({ hasSideCamera: false });

describe('calculateColumnWidth', () => {
  it('gives one participant the whole content area', () => {
    expect(calculateColumnWidth([[participant]], context)).toEqual({ cellHeight: 1284, columnWidth: 1020 });
  });

  it('splits the content height between the cells of a column', () => {
    expect(calculateColumnWidth([[noSideRow, noSideRow]], context)).toEqual({ cellHeight: 624, columnWidth: 1020 });
  });

  it('narrows the column until a lone camera beneath each main region is no wider than the widest ratio', () => {
    // Main region and camera both 16:9 at width W share the room left after the gap: W * 9 / 16 * 2 = 624 - 30
    expect(calculateColumnWidth([[participant, participant]], context)).toEqual({ cellHeight: 624, columnWidth: 528 });
  });

  it('narrows the column until a shared side row fits the column with its camera at the widest ratio', () => {
    const withContentAux = createResolvedLayoutConfig({ sideContentAuxNumericAspectRatio: 4 / 3 });
    const ratioTotal = 4 / 3 + 16 / 9;

    // At width W the row is (W - 30) / ratioTotal tall, beneath a main region W * 9 / 16 tall
    expect(calculateColumnWidth([[withContentAux, withContentAux]], context).columnWidth).toBeCloseTo(
      (594 + 30 / ratioTotal) / (9 / 16 + 1 / ratioTotal),
    );
  });

  it('narrows the column so each main region leaves layoutSideMin for its side row', () => {
    const looseContext = { ...context, cameraNumericAspectRatioMax: 10, layoutSideMin: 108 };

    expect(calculateColumnWidth([[participant, participant]], looseContext)).toEqual({
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
    const squareNoSideRow = createResolvedLayoutConfig({ hasSideCamera: false, mainNumericAspectRatio: 1 });

    expect(calculateColumnWidth([[squareNoSideRow, squareNoSideRow]], context).columnWidth).toBe(624);
  });

  it('narrows the column for a tall main region and the camera beneath it', () => {
    expect(
      calculateColumnWidth([[createResolvedLayoutConfig({ mainNumericAspectRatio: 4 / 6 })]], context).columnWidth,
    ).toBeCloseTo((1284 - 30) / (6 / 4 + 9 / 16));
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

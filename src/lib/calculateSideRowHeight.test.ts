import { describe, expect, it } from 'vitest';

import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

import { calculateSideRowHeight, type CalculateSideRowHeightContext } from '@/lib/calculateSideRowHeight';

const context: CalculateSideRowHeightContext = {
  cameraNumericAspectRatioMax: 16 / 9,
  cameraNumericAspectRatioMin: 9 / 16,
  cellHeight: 1000,
  columnWidth: 1000,
  isInfoRowSplit: false,
  layoutGap: 20,
  regionBorder: 5,
};

const createResolvedLayoutConfig = (resolvedLayoutConfig: Partial<ResolvedLayoutConfig>): ResolvedLayoutConfig => ({
  hasName: false,
  hasSideCamera: true,
  hasSideInfo: false,
  isCameraPreviousAttached: false,
  isCameraGreenScreen: false,
  isCameraMainAttached: false,
  isContentAuxMainAttached: false,
  isInfoPreviousAttached: false,
  isInfoMainAttached: false,
  mainNumericAspectRatio: 16 / 9,
  mainRegion: 'contentMain',
  sideCameraWidth: 0,
  sideContentAuxWidth: 0,
  sideInfoWidth: 0,
  sideWidthTotal: 0,
  ...resolvedLayoutConfig,
});

const cameraOnly = createResolvedLayoutConfig({});
const withContentAux = createResolvedLayoutConfig({ sideContentAuxNumericAspectRatio: 4 / 3 });

describe('calculateSideRowHeight', () => {
  it('has no shared height without a shared row', () => {
    expect(calculateSideRowHeight([cameraOnly], context)).toEqual({ sharedHeight: Infinity });
  });

  it('uses the leftover under the main region when that is the smallest', () => {
    expect(calculateSideRowHeight([withContentAux], context).sharedHeight).toBe(417.5);
  });

  it('uses the height at which the row fills the column when that is the smallest', () => {
    expect(calculateSideRowHeight([withContentAux], { ...context, cellHeight: 3000 }).sharedHeight).toBeCloseTo(
      980 / (4 / 3 + 9 / 16),
    );
  });

  it('uses the main region height when that is the smallest', () => {
    expect(
      calculateSideRowHeight(
        [createResolvedLayoutConfig({ mainNumericAspectRatio: 4, sideContentAuxNumericAspectRatio: 1 })],
        {
          ...context,
          cellHeight: 3000,
        },
      ).sharedHeight,
    ).toBe(250);
  });

  it('measures the row beneath split info without the info, in what the info row leaves of the cell', () => {
    const withWideInfo = { ...withContentAux, hasSideInfo: true, sideInfoNumericAspectRatio: 5 };
    const splitContext = { ...context, isInfoRowSplit: true };

    expect(calculateSideRowHeight([withWideInfo], { ...context, cellHeight: 3000 }).sharedHeight).toBeCloseTo(
      960 / (4 / 3 + 5 + 9 / 16),
    );
    expect(calculateSideRowHeight([withWideInfo], { ...splitContext, cellHeight: 3000 }).sharedHeight).toBeCloseTo(
      980 / (4 / 3 + 9 / 16),
    );
    // The 200 px info row and its gap leave 197.5 px beneath it
    expect(calculateSideRowHeight([withWideInfo], splitContext).sharedHeight).toBe(197.5);
    // Beneath split info, a lone camera's row is not shared
    expect(
      calculateSideRowHeight([{ ...cameraOnly, hasSideInfo: true, sideInfoNumericAspectRatio: 5 }], splitContext),
    ).toEqual({ sharedHeight: Infinity });
  });

  it('takes the smallest shared height across participants, ignoring lone cameras', () => {
    expect(
      calculateSideRowHeight([cameraOnly, withContentAux, { ...withContentAux, mainNumericAspectRatio: 1 }], context)
        .sharedHeight,
    ).toBe(-20);
  });
});

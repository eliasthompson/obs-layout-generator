import { describe, expect, it } from 'vitest';

import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

import { calculateSideRowHeight, type CalculateSideRowHeightContext } from '@/lib/calculateSideRowHeight';

const context: CalculateSideRowHeightContext = {
  cameraNumericAspectRatioMin: 9 / 16,
  cellHeight: 1000,
  columnWidth: 1000,
  layoutGap: 20,
  regionBorder: 5,
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

const cameraOnly = createResolvedLayoutConfig({});
const withContentAux = createResolvedLayoutConfig({ sideContentAuxNumericAspectRatio: 4 / 3 });

describe('calculateSideRowHeight', () => {
  it('has no shared height without a shared row, with a third of half the cell as the name cap', () => {
    const sideRowHeight = calculateSideRowHeight([cameraOnly], context);

    expect(sideRowHeight.sharedHeight).toBe(Infinity);
    expect(sideRowHeight.nameHeightMax).toBeCloseTo(490 / 3);
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

  it('takes the smallest shared height across participants, ignoring lone cameras', () => {
    expect(
      calculateSideRowHeight([cameraOnly, withContentAux, { ...withContentAux, mainNumericAspectRatio: 1 }], context)
        .sharedHeight,
    ).toBe(-20);
  });

  it('caps the name by a 9:16 camera when the column is narrow', () => {
    expect(calculateSideRowHeight([cameraOnly], { ...context, columnWidth: 100 }).nameHeightMax).toBeCloseTo(
      100 / (9 / 16) / 3,
    );
  });

  it('never caps the name below zero when the cell is shorter than the gap', () => {
    expect(calculateSideRowHeight([cameraOnly], { ...context, cellHeight: 10 }).nameHeightMax).toBe(0);
  });
});

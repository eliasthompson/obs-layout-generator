import { describe, expect, it } from 'vitest';

import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

import {
  calculateSideRowSizes,
  type CalculateSideRowSizesContext,
  fitSideRowHeight,
  hasSideRow,
  isSideRowShared,
} from '@/lib/calculateSideRowSizes';

const context: CalculateSideRowSizesContext = {
  cellHeight: 1000,
  columnWidth: 1000,
  layoutGap: 20,
  regionBorder: 5,
  sharedHeight: Infinity,
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

const withContentAux = createResolvedLayoutConfig({ sideContentAuxNumericAspectRatio: 4 / 3 });
const withInfo = createResolvedLayoutConfig({ hasSideInfo: true, sideInfoNumericAspectRatio: 2 });
const noSideRow = {
  sideRowHeight: 0,
  contentAuxWidth: 0,
  contentAuxHeight: 0,
  infoWidth: 0,
  infoHeight: 0,
  cameraWidth: 0,
  cameraHeight: 0,
};

describe('hasSideRow and isSideRowShared', () => {
  it.each([
    ['a camera', createResolvedLayoutConfig({}), true, false],
    [
      'aux content',
      createResolvedLayoutConfig({ hasSideCamera: false, sideContentAuxNumericAspectRatio: 4 / 3 }),
      true,
      true,
    ],
    [
      'ratio info',
      createResolvedLayoutConfig({ hasSideCamera: false, hasSideInfo: true, sideInfoNumericAspectRatio: 2 }),
      true,
      true,
    ],
    ['auto info', createResolvedLayoutConfig({ hasSideCamera: false, hasSideInfo: true }), false, false],
    ['nothing', createResolvedLayoutConfig({ hasSideCamera: false }), false, false],
  ])('with %s', (_, resolvedLayoutConfig, expectedSideRow, expectedShared) => {
    expect(hasSideRow(resolvedLayoutConfig)).toBe(expectedSideRow);
    expect(isSideRowShared(resolvedLayoutConfig)).toBe(expectedShared);
  });
});

describe('fitSideRowHeight', () => {
  it('fits aux content at its ratio and the camera at the minimum ratio with a gap between', () => {
    expect(fitSideRowHeight(withContentAux, context)).toBeCloseTo(980 / (4 / 3 + 9 / 16));
  });

  it('counts the growth of aux content attached to the main region', () => {
    expect(fitSideRowHeight({ ...withContentAux, isContentAuxMainAttached: true }, context)).toBeCloseTo(
      (980 - (4 / 3) * 15) / (4 / 3 + 9 / 16),
    );
  });

  it('counts the growth of a camera attached to the main region', () => {
    expect(fitSideRowHeight({ ...withContentAux, isCameraMainAttached: true }, context)).toBeCloseTo(
      (980 - (9 / 16) * 15) / (4 / 3 + 9 / 16),
    );
  });

  it('puts info without aux content at the left end', () => {
    expect(fitSideRowHeight(withInfo, context)).toBeCloseTo(980 / (2 + 9 / 16));
  });

  it('counts the growth of info attached to the main region', () => {
    expect(fitSideRowHeight({ ...withInfo, isInfoMainAttached: true }, context)).toBeCloseTo(950 / (2 + 9 / 16));
  });

  it('separates aux content, info, and the camera by gaps', () => {
    expect(
      fitSideRowHeight({ ...withContentAux, hasSideInfo: true, sideInfoNumericAspectRatio: 2 }, context),
    ).toBeCloseTo(960 / (4 / 3 + 2 + 9 / 16));
  });

  it('separates attached info and an attached camera by one shared border each', () => {
    expect(
      fitSideRowHeight(
        {
          ...withContentAux,
          hasSideInfo: true,
          isCameraAboveAttached: true,
          isInfoAboveAttached: true,
          sideInfoNumericAspectRatio: 2,
        },
        context,
      ),
    ).toBeCloseTo(990 / (4 / 3 + 2 + 9 / 16));
  });

  it('fits aux content alone without a camera', () => {
    expect(fitSideRowHeight({ ...withContentAux, hasSideCamera: false }, context)).toBeCloseTo(750);
  });
});

describe('calculateSideRowSizes', () => {
  it('sizes only the main region without a side row', () => {
    expect(calculateSideRowSizes(createResolvedLayoutConfig({ hasSideCamera: false }), context)).toEqual({
      mainHeight: 562.5,
      ...noSideRow,
      isCameraMainAttached: false,
    });
  });

  it('has no main height without a main region', () => {
    expect(
      calculateSideRowSizes(
        createResolvedLayoutConfig({ hasSideCamera: false, mainNumericAspectRatio: 0, mainRegion: undefined }),
        context,
      ).mainHeight,
    ).toBe(0);
  });

  it('fills the row with a lone camera', () => {
    expect(calculateSideRowSizes(createResolvedLayoutConfig({}), context)).toMatchObject({
      mainHeight: 562.5,
      sideRowHeight: 417.5,
      cameraWidth: 1000,
      cameraHeight: 417.5,
      isCameraMainAttached: false,
    });
  });

  it('reaches a lone camera up to the main region when attached, keeping the row height below its top', () => {
    expect(calculateSideRowSizes(createResolvedLayoutConfig({ isCameraMainAttached: true }), context)).toMatchObject({
      sideRowHeight: 417.5,
      cameraWidth: 1000,
      cameraHeight: 432.5,
      isCameraMainAttached: true,
    });
  });

  it('shortens a lone camera to 9:16 and leaves it unattached when reaching up would be too tall', () => {
    const sideRowSizes = calculateSideRowSizes(createResolvedLayoutConfig({ isCameraMainAttached: true }), {
      ...context,
      columnWidth: 200,
    });

    expect(sideRowSizes.cameraWidth).toBe(200);
    expect(sideRowSizes.cameraHeight).toBeCloseTo(200 / (9 / 16));
    expect(sideRowSizes.sideRowHeight).toBeCloseTo(200 / (9 / 16));
    expect(sideRowSizes.isCameraMainAttached).toBe(false);
  });

  it('limits a lone camera to the shared height when another row is shared', () => {
    expect(calculateSideRowSizes(createResolvedLayoutConfig({}), { ...context, sharedHeight: 300 })).toMatchObject({
      sideRowHeight: 300,
      cameraWidth: 1000,
      cameraHeight: 300,
    });
  });

  it('omits a lone camera whose row rounds to no height', () => {
    expect(calculateSideRowSizes(createResolvedLayoutConfig({}), { ...context, cellHeight: 582 })).toMatchObject({
      cameraWidth: 0,
      cameraHeight: 0,
    });
  });

  it('gives the camera the rest of a shared row beside aux content at the shared height', () => {
    expect(calculateSideRowSizes(withContentAux, { ...context, sharedHeight: 300 })).toEqual({
      mainHeight: 562.5,
      sideRowHeight: 300,
      contentAuxWidth: 400,
      contentAuxHeight: 300,
      infoWidth: 0,
      infoHeight: 0,
      cameraWidth: 580,
      cameraHeight: 300,
      isCameraMainAttached: false,
    });
  });

  it('grows attached regions by the gap less the border and separates attached ones by one border', () => {
    const sideRowSizes = calculateSideRowSizes(
      {
        ...withContentAux,
        hasSideInfo: true,
        isCameraAboveAttached: true,
        isCameraMainAttached: true,
        isContentAuxMainAttached: true,
        isInfoAboveAttached: true,
        isInfoMainAttached: true,
        sideInfoNumericAspectRatio: 2,
      },
      { ...context, sharedHeight: 200 },
    );

    expect(sideRowSizes.contentAuxHeight).toBe(215);
    expect(sideRowSizes.contentAuxWidth).toBeCloseTo((4 / 3) * 215);
    expect(sideRowSizes.infoHeight).toBe(215);
    expect(sideRowSizes.infoWidth).toBe(430);
    expect(sideRowSizes.cameraWidth).toBeCloseTo(1000 - (4 / 3) * 215 - 5 - 430 - 5);
    expect(sideRowSizes.cameraHeight).toBe(215);
    expect(sideRowSizes.isCameraMainAttached).toBe(true);
  });

  it('puts info without aux content at the left end of a shared row', () => {
    expect(calculateSideRowSizes(withInfo, { ...context, sharedHeight: 100 })).toMatchObject({
      contentAuxWidth: 0,
      infoWidth: 200,
      infoHeight: 100,
      cameraWidth: 780,
      cameraHeight: 100,
    });
  });

  it('sizes a shared row without a camera', () => {
    expect(
      calculateSideRowSizes({ ...withContentAux, hasSideCamera: false }, { ...context, sharedHeight: 300 }),
    ).toMatchObject({ contentAuxWidth: 400, contentAuxHeight: 300, cameraWidth: 0, cameraHeight: 0 });
  });

  it('omits every side region when the shared height rounds to nothing', () => {
    expect(calculateSideRowSizes(withContentAux, { ...context, sharedHeight: 0.2 })).toEqual({
      mainHeight: 562.5,
      ...noSideRow,
      isCameraMainAttached: false,
    });
  });

  it('omits the camera when the rest of a shared row rounds to no width', () => {
    expect(calculateSideRowSizes(withContentAux, { ...context, columnWidth: 420, sharedHeight: 300 })).toMatchObject({
      contentAuxWidth: 400,
      cameraWidth: 0,
      cameraHeight: 0,
    });
  });
});

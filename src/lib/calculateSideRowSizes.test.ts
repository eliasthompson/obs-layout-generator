import { describe, expect, it } from 'vitest';

import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

import {
  calculateSideRowSizes,
  type CalculateSideRowSizesContext,
  canSplitInfoRow,
  fitSideRowHeight,
  hasSideRow,
  isSideRowShared,
  measureCellHeight,
  splitInfoRow,
} from '@/lib/calculateSideRowSizes';

// A loose maximum ratio, so only the tests about it narrow a camera
const context: CalculateSideRowSizesContext = {
  cameraNumericAspectRatioDefault: 4 / 3,
  cameraNumericAspectRatioMax: 100,
  cameraNumericAspectRatioMin: 9 / 16,
  cellHeight: 1000,
  columnWidth: 1000,
  isInfoRowSplit: false,
  layoutGap: 20,
  regionBorder: 5,
  sharedHeight: Infinity,
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

const withContentAux = createResolvedLayoutConfig({ sideContentAuxNumericAspectRatio: 4 / 3 });
const withInfo = createResolvedLayoutConfig({ hasSideInfo: true, sideInfoNumericAspectRatio: 2 });
// A 5:1 info row is 200 px tall across the 1000 px column, leaving a 780 px cell for the side row beneath it; info
// splits only when wider than the widest camera, so the split context holds cameras to 4:1
const withWideInfo = createResolvedLayoutConfig({ hasSideInfo: true, sideInfoNumericAspectRatio: 5 });
const splitContext = { ...context, cameraNumericAspectRatioMax: 4, isInfoRowSplit: true };
const noSideRow = {
  infoRowHeight: 0,
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

describe('canSplitInfoRow', () => {
  it.each([
    ['ratio info beside a camera', withWideInfo, true],
    [
      'ratio info beside aux content',
      { ...withWideInfo, hasSideCamera: false, sideContentAuxNumericAspectRatio: 4 / 3 },
      true,
    ],
    ['ratio info no wider than the widest camera', { ...withWideInfo, sideInfoNumericAspectRatio: 16 / 9 }, false],
    ['ratio info alone', { ...withWideInfo, hasSideCamera: false }, false],
    ['auto info beside a camera', createResolvedLayoutConfig({ hasSideInfo: true }), false],
    ['no info', createResolvedLayoutConfig({}), false],
  ])('with %s', (_, resolvedLayoutConfig, expected) => {
    expect(canSplitInfoRow(resolvedLayoutConfig, 16 / 9)).toBe(expected);
  });
});

describe('splitInfoRow', () => {
  it('spans the column at the info ratio and leaves the rest of the cell to the side row without the info', () => {
    expect(splitInfoRow(withWideInfo, context)).toEqual({
      infoRowHeight: 200,
      infoWidth: 1000,
      infoHeight: 200,
      rowResolvedLayoutConfig: { ...withWideInfo, hasSideInfo: false },
      rowCellHeight: 780,
    });
  });

  it('reaches info attached to the main region up across the gap, taking that much less of the row', () => {
    expect(splitInfoRow({ ...withWideInfo, isInfoMainAttached: true }, context)).toMatchObject({
      infoRowHeight: 185,
      infoHeight: 200,
      rowCellHeight: 795,
    });
  });

  it('keeps info no taller than the cell leaves under the main region, narrowing it to its ratio', () => {
    expect(splitInfoRow({ ...withWideInfo, sideInfoNumericAspectRatio: 1 }, context)).toMatchObject({
      infoRowHeight: 417.5,
      infoWidth: 417.5,
      infoHeight: 417.5,
      rowCellHeight: 562.5,
    });
  });
});

describe('measureCellHeight', () => {
  const sideRowSizes = { mainHeight: 500, ...noSideRow, isCameraMainAttached: false };

  it('takes the main region alone without shown side regions', () => {
    expect(measureCellHeight(sideRowSizes, 20)).toBe(500);
  });

  it('adds the info row and the side row, each with its gap', () => {
    expect(
      measureCellHeight(
        { ...sideRowSizes, infoRowHeight: 100, sideRowHeight: 200, infoWidth: 1000, cameraWidth: 300 },
        20,
      ),
    ).toBe(840);
  });

  it('adds the side row gap for a shown region even when the row has no height below its top', () => {
    expect(measureCellHeight({ ...sideRowSizes, cameraWidth: 10, cameraHeight: 15 }, 20)).toBe(520);
    expect(measureCellHeight({ ...sideRowSizes, contentAuxWidth: 10 }, 20)).toBe(520);
    expect(measureCellHeight({ ...sideRowSizes, infoWidth: 10 }, 20)).toBe(520);
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
          isCameraPreviousAttached: true,
          isInfoPreviousAttached: true,
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

  it('grows a main region that may be taller to fill a cell without a side row, down to its narrowest ratio', () => {
    const mainCamera = createResolvedLayoutConfig({
      hasSideCamera: false,
      mainNumericAspectRatioMin: 9 / 16,
      mainRegion: 'camera',
    });

    expect(calculateSideRowSizes(mainCamera, context).mainHeight).toBe(1000);
    expect(calculateSideRowSizes(mainCamera, { ...context, cellHeight: 3000 }).mainHeight).toBeCloseTo(1000 / (9 / 16));
    expect(calculateSideRowSizes({ ...mainCamera, mainNumericAspectRatioMin: undefined }, context).mainHeight).toBe(
      562.5,
    );
  });

  it('grows a main region that may be taller into what its side row leaves of the cell', () => {
    const mainCameraWithInfo = createResolvedLayoutConfig({
      hasSideCamera: false,
      hasSideInfo: true,
      mainNumericAspectRatioMin: 9 / 16,
      mainRegion: 'camera',
      sideInfoNumericAspectRatio: 2,
    });

    // 1000 less the 20 px gap and the 100 px row
    expect(calculateSideRowSizes(mainCameraWithInfo, { ...context, sharedHeight: 100 })).toMatchObject({
      mainHeight: 880,
      sideRowHeight: 100,
      infoWidth: 200,
      infoHeight: 100,
    });
    // A row that fills the rest of the cell leaves it nothing to grow into
    expect(calculateSideRowSizes(mainCameraWithInfo, { ...context, sharedHeight: 417.5 }).mainHeight).toBe(562.5);
  });

  it('grows a main region that may be taller into what an info row and the side row beneath it leave', () => {
    const mainCameraWithWideInfo = {
      ...withWideInfo,
      hasSideCamera: false,
      mainNumericAspectRatioMin: 9 / 16,
      mainRegion: 'camera' as const,
      sideContentAuxNumericAspectRatio: 4 / 3,
    };

    // 1000 less the 200 px info row and the 150 px side row, each with its 20 px gap
    expect(calculateSideRowSizes(mainCameraWithWideInfo, { ...splitContext, sharedHeight: 150 })).toMatchObject({
      mainHeight: 610,
      infoRowHeight: 200,
      sideRowHeight: 150,
    });
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

  it('narrows a lone camera the shared height leaves wider than the maximum ratio', () => {
    expect(
      calculateSideRowSizes(createResolvedLayoutConfig({}), {
        ...context,
        cameraNumericAspectRatioMax: 16 / 9,
        sharedHeight: 300,
      }),
    ).toMatchObject({ sideRowHeight: 300, cameraWidth: (16 / 9) * 300, cameraHeight: 300 });
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
      infoRowHeight: 0,
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

  it('narrows the camera in a shared row to the maximum ratio, leaving the rest of the row empty', () => {
    expect(
      calculateSideRowSizes(withContentAux, { ...context, cameraNumericAspectRatioMax: 16 / 9, sharedHeight: 300 }),
    ).toMatchObject({ contentAuxWidth: 400, cameraWidth: (16 / 9) * 300, cameraHeight: 300 });
  });

  it('grows attached regions by the gap less the border and separates attached ones by one border', () => {
    const sideRowSizes = calculateSideRowSizes(
      {
        ...withContentAux,
        hasSideInfo: true,
        isCameraPreviousAttached: true,
        isCameraMainAttached: true,
        isContentAuxMainAttached: true,
        isInfoPreviousAttached: true,
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

  it('gives auto info what a lone camera at its default ratio leaves of the row', () => {
    const sideRowSizes = calculateSideRowSizes(createResolvedLayoutConfig({ hasSideInfo: true }), context);

    expect(sideRowSizes).toMatchObject({ sideRowHeight: 417.5, infoHeight: 417.5, cameraHeight: 417.5 });
    expect(sideRowSizes.cameraWidth).toBeCloseTo((4 / 3) * 417.5);
    expect(sideRowSizes.infoWidth).toBeCloseTo(1000 - (4 / 3) * 417.5 - 20);
  });

  it('grows auto info attached to the main region, and attaches the camera to it by one shared border', () => {
    const sideRowSizes = calculateSideRowSizes(
      createResolvedLayoutConfig({ hasSideInfo: true, isCameraPreviousAttached: true, isInfoMainAttached: true }),
      context,
    );

    expect(sideRowSizes.infoHeight).toBe(432.5);
    expect(sideRowSizes.infoWidth).toBeCloseTo(1000 - (4 / 3) * 417.5 - 5);
  });

  it('omits auto info when the camera at its default ratio leaves it no width', () => {
    expect(
      calculateSideRowSizes(createResolvedLayoutConfig({ hasSideInfo: true }), { ...context, cellHeight: 1400 }),
    ).toMatchObject({ infoWidth: 0, infoHeight: 0, cameraWidth: 1000, cameraHeight: 817.5 });
  });

  it('omits auto info when the row rounds to no height', () => {
    expect(
      calculateSideRowSizes(createResolvedLayoutConfig({ hasSideInfo: true }), { ...context, cellHeight: 582 }),
    ).toMatchObject({ infoWidth: 0, infoHeight: 0, cameraWidth: 0 });
  });

  it('puts auto info between aux content and the camera at its default ratio in a shared row', () => {
    const withAutoInfo = { ...withContentAux, hasSideInfo: true };

    expect(calculateSideRowSizes(withAutoInfo, { ...context, sharedHeight: 300 })).toMatchObject({
      contentAuxWidth: 400,
      infoWidth: 160,
      infoHeight: 300,
      cameraWidth: 400,
      cameraHeight: 300,
    });
    expect(
      calculateSideRowSizes({ ...withAutoInfo, isInfoPreviousAttached: true }, { ...context, sharedHeight: 300 })
        .infoWidth,
    ).toBe(175);
  });

  it('gives split info a row of its own and fills the row beneath it with a lone camera', () => {
    expect(calculateSideRowSizes(withWideInfo, splitContext)).toEqual({
      mainHeight: 562.5,
      infoRowHeight: 200,
      sideRowHeight: 197.5,
      contentAuxWidth: 0,
      contentAuxHeight: 0,
      infoWidth: 1000,
      infoHeight: 200,
      cameraWidth: 790,
      cameraHeight: 197.5,
      isCameraMainAttached: false,
    });
  });

  it('shares the row beneath split info between aux content and the camera at the shared height', () => {
    expect(
      calculateSideRowSizes(
        { ...withWideInfo, sideContentAuxNumericAspectRatio: 4 / 3 },
        { ...splitContext, sharedHeight: 150 },
      ),
    ).toMatchObject({
      infoRowHeight: 200,
      sideRowHeight: 150,
      contentAuxWidth: 200,
      infoWidth: 1000,
      cameraWidth: 600,
      cameraHeight: 150,
    });
  });

  it('keeps info no wider than the widest camera in the side row', () => {
    expect(
      calculateSideRowSizes(withWideInfo, { ...splitContext, cameraNumericAspectRatioMax: 5, sharedHeight: 100 }),
    ).toMatchObject({ infoRowHeight: 0, sideRowHeight: 100, infoWidth: 500, cameraWidth: 480 });
  });

  it('keeps info that cannot split in the side row', () => {
    expect(
      calculateSideRowSizes({ ...withInfo, hasSideCamera: false }, { ...splitContext, sharedHeight: 100 }),
    ).toMatchObject({ infoRowHeight: 0, sideRowHeight: 100, infoWidth: 200, infoHeight: 100 });
  });

  it('omits split info whose row rounds to no height or width', () => {
    expect(calculateSideRowSizes(withWideInfo, { ...splitContext, cellHeight: 582 })).toMatchObject({
      infoRowHeight: 0,
      infoWidth: 0,
      infoHeight: 0,
    });
    // With cameras narrower still, info narrow enough to split rounds to no width at the height the cell leaves it
    expect(
      calculateSideRowSizes(
        { ...withWideInfo, sideInfoNumericAspectRatio: 1 / 1000 },
        { ...splitContext, cameraNumericAspectRatioMax: 1 / 2000 },
      ),
    ).toMatchObject({ infoRowHeight: 0, infoWidth: 0, infoHeight: 0 });
  });

  it('gives auto info the rest of a shared row without a camera', () => {
    expect(
      calculateSideRowSizes(
        { ...withContentAux, hasSideCamera: false, hasSideInfo: true },
        { ...context, sharedHeight: 300 },
      ),
    ).toMatchObject({ infoWidth: 580, infoHeight: 300, cameraWidth: 0 });
  });
});

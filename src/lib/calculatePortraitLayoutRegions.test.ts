import { describe, expect, it } from 'vitest';

import type { SideRowSizes } from '@/lib/calculateSideRowSizes';
import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

import {
  calculatePortraitLayoutRegions,
  type CalculatePortraitLayoutRegionsContext,
} from '@/lib/calculatePortraitLayoutRegions';

const context: CalculatePortraitLayoutRegionsContext = {
  cellX: 100,
  cellY: 50,
  columnWidth: 400,
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

const createSideRowSizes = (sideRowSizes: Partial<SideRowSizes>): SideRowSizes => ({
  mainHeight: 225,
  contentAuxWidth: 0,
  contentAuxHeight: 0,
  infoWidth: 0,
  infoHeight: 0,
  cameraWidth: 0,
  cameraHeight: 0,
  isCameraMainAttached: false,
  ...sideRowSizes,
});

const main = { x: 100, y: 50, width: 400, height: 225, hasBorder: true };
const loneCamera = createSideRowSizes({ cameraWidth: 400, cameraHeight: 150 });
const sharedRow = createSideRowSizes({
  contentAuxWidth: 120,
  contentAuxHeight: 90,
  infoWidth: 80,
  infoHeight: 90,
  cameraWidth: 100,
  cameraHeight: 90,
});

describe('calculatePortraitLayoutRegions', () => {
  it('places main content on top and a lone camera across the row beneath it', () => {
    expect(calculatePortraitLayoutRegions(createResolvedLayoutConfig({}), loneCamera, context)).toEqual({
      camera: { x: 100, y: 295, width: 400, height: 150, hasBorder: true },
      contentMain: main,
    });
  });

  it('lays the side row out as aux content, info, and the camera at the right end', () => {
    expect(calculatePortraitLayoutRegions(createResolvedLayoutConfig({}), sharedRow, context)).toEqual({
      camera: { x: 400, y: 295, width: 100, height: 90, hasBorder: true },
      contentMain: main,
      contentAux: { x: 100, y: 295, width: 120, height: 90, hasBorder: true },
      info: { x: 240, y: 295, width: 80, height: 90, hasBorder: true },
    });
  });

  it('places attached info one shared border right of the aux content', () => {
    expect(
      calculatePortraitLayoutRegions(createResolvedLayoutConfig({ isInfoAboveAttached: true }), sharedRow, context)
        .info,
    ).toEqual({ x: 225, y: 295, width: 80, height: 90, hasBorder: true });
  });

  it('starts info at the left end without aux content', () => {
    expect(
      calculatePortraitLayoutRegions(
        createResolvedLayoutConfig({}),
        createSideRowSizes({ infoWidth: 80, infoHeight: 90, cameraWidth: 300, cameraHeight: 90 }),
        context,
      ).info,
    ).toEqual({ x: 100, y: 295, width: 80, height: 90, hasBorder: true });
  });

  it('reaches regions attached to the main region up by the gap less the shared border', () => {
    expect(
      calculatePortraitLayoutRegions(
        createResolvedLayoutConfig({ isContentAuxMainAttached: true, isInfoMainAttached: true }),
        { ...sharedRow, contentAuxHeight: 105, infoHeight: 105, cameraHeight: 105, isCameraMainAttached: true },
        context,
      ),
    ).toMatchObject({
      camera: { y: 280, height: 105 },
      contentAux: { y: 280, height: 105 },
      info: { y: 280, height: 105 },
    });
  });

  it('puts the camera in the main column with aux content in the row beneath it', () => {
    expect(
      calculatePortraitLayoutRegions(
        createResolvedLayoutConfig({ hasSideCamera: false, mainRegion: 'camera' }),
        createSideRowSizes({ contentAuxWidth: 120, contentAuxHeight: 90 }),
        context,
      ),
    ).toEqual({
      camera: main,
      contentAux: { x: 100, y: 295, width: 120, height: 90, hasBorder: true },
    });
  });

  it('leaves a green screen camera without a border in the main column and in the side row', () => {
    expect(
      calculatePortraitLayoutRegions(
        createResolvedLayoutConfig({ isCameraGreenScreen: true, mainRegion: 'camera' }),
        createSideRowSizes({}),
        context,
      ).camera,
    ).toEqual({ ...main, hasBorder: false });
    expect(
      calculatePortraitLayoutRegions(createResolvedLayoutConfig({ isCameraGreenScreen: true }), loneCamera, context)
        .camera,
    ).toEqual({ x: 100, y: 295, width: 400, height: 150, hasBorder: false });
  });

  it.each(['contentAux', 'info'] as const)('puts %s in the main column', (mainRegion) => {
    expect(
      calculatePortraitLayoutRegions(
        createResolvedLayoutConfig({ hasSideCamera: false, mainRegion }),
        createSideRowSizes({}),
        context,
      ),
    ).toEqual({ [mainRegion]: main });
  });

  it('returns no regions without a main region or side regions', () => {
    expect(
      calculatePortraitLayoutRegions(
        createResolvedLayoutConfig({ hasSideCamera: false, mainRegion: undefined }),
        createSideRowSizes({ mainHeight: 0 }),
        context,
      ),
    ).toEqual({});
  });

  it('omits the main region when the column has no width or the main region no height', () => {
    expect(
      calculatePortraitLayoutRegions(createResolvedLayoutConfig({}), createSideRowSizes({}), {
        ...context,
        columnWidth: 0.4,
      }),
    ).toEqual({});
    expect(
      calculatePortraitLayoutRegions(createResolvedLayoutConfig({}), createSideRowSizes({ mainHeight: 0.3 }), context),
    ).toEqual({});
  });
});

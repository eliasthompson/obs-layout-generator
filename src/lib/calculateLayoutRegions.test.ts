import { describe, expect, it } from 'vitest';

import type { SideRegionHeights } from '@/lib/calculateSideRegionHeights';
import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

import { calculateLayoutRegions, type CalculateLayoutRegionsContext } from '@/lib/calculateLayoutRegions';

const context: CalculateLayoutRegionsContext = {
  cameraHeight: 100,
  layoutGap: 10,
  layoutSideWidth: 200,
  mainWidth: 400,
  mainX: 50,
  regionBorder: 0,
  rowHeight: 300,
  rowY: 20,
};

const createResolvedLayoutConfig = (resolvedLayoutConfig: Partial<ResolvedLayoutConfig>): ResolvedLayoutConfig => ({
  hasName: false,
  hasSideCamera: true,
  hasSideInfo: false,
  isCameraAboveAttached: false,
  isCameraGreenScreen: false,
  isInfoAboveAttached: false,
  mainNumericAspectRatio: 16 / 9,
  mainRegion: 'contentMain',
  sideCameraWidth: 200,
  sideContentAuxWidth: 200,
  sideInfoWidth: 200,
  sideWidthTotal: 210,
  ...resolvedLayoutConfig,
});

const noSideRegionHeights: SideRegionHeights = { contentAuxHeight: 0, infoHeight: 0, showSideCamera: false };
const sideRegionHeights: SideRegionHeights = { contentAuxHeight: 150, infoHeight: 30, showSideCamera: true };
const main = { x: 50, y: 20, width: 400, height: 300, hasBorder: true };

describe('calculateLayoutRegions', () => {
  it('places main content and stacks side aux content, side info, and the side camera', () => {
    expect(calculateLayoutRegions(createResolvedLayoutConfig({}), sideRegionHeights, context)).toEqual({
      camera: { x: 460, y: 220, width: 200, height: 100, hasBorder: true },
      contentMain: main,
      contentAux: { x: 460, y: 20, width: 200, height: 150, hasBorder: true },
      info: { x: 460, y: 180, width: 200, height: 30, hasBorder: true },
    });
  });

  it('starts side info at the top of the row without side aux content', () => {
    expect(
      calculateLayoutRegions(createResolvedLayoutConfig({}), { ...noSideRegionHeights, infoHeight: 60 }, context).info,
    ).toEqual({ x: 460, y: 20, width: 200, height: 60, hasBorder: true });
  });

  it('keeps side regions on the right edge of the side column at their own widths', () => {
    expect(
      calculateLayoutRegions(
        createResolvedLayoutConfig({ sideCameraWidth: 240, sideContentAuxWidth: 220, sideInfoWidth: 200 }),
        sideRegionHeights,
        context,
      ),
    ).toMatchObject({
      camera: { x: 420, width: 240 },
      contentAux: { x: 440, width: 220 },
      info: { x: 460, width: 200 },
    });
  });

  it('places attached side info one shared border below the side aux content', () => {
    expect(
      calculateLayoutRegions(createResolvedLayoutConfig({ isInfoAboveAttached: true }), sideRegionHeights, {
        ...context,
        regionBorder: 4,
      }).info,
    ).toEqual({ x: 460, y: 174, width: 200, height: 30, hasBorder: true });
  });

  it('reaches an attached side camera up to one shared border below the region above it', () => {
    expect(
      calculateLayoutRegions(createResolvedLayoutConfig({ isCameraAboveAttached: true }), sideRegionHeights, {
        ...context,
        regionBorder: 4,
      }).camera,
    ).toEqual({ x: 460, y: 214, width: 200, height: 106, hasBorder: true });
  });

  it('keeps an attached side camera at the shared height when reaching up would make it narrower than 9:16', () => {
    expect(
      calculateLayoutRegions(
        createResolvedLayoutConfig({ isCameraAboveAttached: true, sideCameraWidth: 50 }),
        sideRegionHeights,
        { ...context, regionBorder: 4 },
      ).camera,
    ).toEqual({ x: 610, y: 220, width: 50, height: 100, hasBorder: true });
  });

  it('keeps an attached side camera at the shared height with nothing above it', () => {
    expect(
      calculateLayoutRegions(
        createResolvedLayoutConfig({ isCameraAboveAttached: true }),
        { ...noSideRegionHeights, showSideCamera: true },
        { ...context, regionBorder: 4 },
      ).camera,
    ).toEqual({ x: 460, y: 220, width: 200, height: 100, hasBorder: true });
  });

  it('leaves a green screen side camera without a border', () => {
    expect(
      calculateLayoutRegions(createResolvedLayoutConfig({ isCameraGreenScreen: true }), sideRegionHeights, context)
        .camera,
    ).toEqual({ x: 460, y: 220, width: 200, height: 100, hasBorder: false });
  });

  it('leaves a green screen main camera without a border', () => {
    expect(
      calculateLayoutRegions(
        createResolvedLayoutConfig({ isCameraGreenScreen: true, mainRegion: 'camera' }),
        noSideRegionHeights,
        context,
      ),
    ).toEqual({ camera: { ...main, hasBorder: false } });
  });

  it.each(['camera', 'contentAux', 'info'] as const)('puts %s in the main column', (mainRegion) => {
    expect(calculateLayoutRegions(createResolvedLayoutConfig({ mainRegion }), noSideRegionHeights, context)).toEqual({
      [mainRegion]: main,
    });
  });

  it('returns no regions without a main column or side regions', () => {
    expect(
      calculateLayoutRegions(createResolvedLayoutConfig({ mainRegion: undefined }), noSideRegionHeights, context),
    ).toEqual({});
  });

  it('omits the main column when it has no width', () => {
    expect(
      calculateLayoutRegions(createResolvedLayoutConfig({}), noSideRegionHeights, { ...context, mainWidth: 0.4 }),
    ).toEqual({});
  });

  it('omits the main column when the row has no height', () => {
    expect(
      calculateLayoutRegions(createResolvedLayoutConfig({ mainRegion: 'camera' }), noSideRegionHeights, {
        ...context,
        rowHeight: 0,
      }),
    ).toEqual({});
  });
});

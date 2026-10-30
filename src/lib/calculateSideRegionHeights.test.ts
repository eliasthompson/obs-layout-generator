import { describe, expect, it } from 'vitest';

import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

import { calculateSideRegionHeights, type CalculateSideRegionHeightsContext } from '@/lib/calculateSideRegionHeights';

const context: CalculateSideRegionHeightsContext = {
  cameraHeight: 100,
  hasCameraRoom: true,
  layoutGap: 10,
  regionBorder: 0,
  rowHeight: 400,
};

const createResolvedLayoutConfig = (resolvedLayoutConfig: Partial<ResolvedLayoutConfig>): ResolvedLayoutConfig => ({
  hasName: false,
  hasSideCamera: false,
  hasSideInfo: false,
  isCameraPreviousAttached: false,
  isCameraGreenScreen: false,
  isCameraMainAttached: false,
  isContentAuxMainAttached: false,
  isInfoPreviousAttached: false,
  isInfoMainAttached: false,
  mainNumericAspectRatio: 16 / 9,
  sideCameraWidth: 200,
  sideContentAuxWidth: 200,
  sideInfoWidth: 200,
  sideWidthTotal: 210,
  ...resolvedLayoutConfig,
});

describe('calculateSideRegionHeights', () => {
  it('shows a side camera when there is camera room', () => {
    expect(calculateSideRegionHeights(createResolvedLayoutConfig({ hasSideCamera: true }), context)).toEqual({
      contentAuxHeight: 0,
      infoHeight: 0,
      showSideCamera: true,
    });
  });

  it('hides a side camera when there is no camera room', () => {
    expect(
      calculateSideRegionHeights(createResolvedLayoutConfig({ hasSideCamera: true }), {
        ...context,
        hasCameraRoom: false,
      }).showSideCamera,
    ).toBe(false);
  });

  it('sizes side aux content by its ratio above the camera', () => {
    expect(
      calculateSideRegionHeights(
        createResolvedLayoutConfig({ hasSideCamera: true, sideContentAuxNumericAspectRatio: 4 / 3 }),
        context,
      ).contentAuxHeight,
    ).toBe(150);
  });

  it('sizes attached side aux content by its ratio at its wider width', () => {
    expect(
      calculateSideRegionHeights(
        createResolvedLayoutConfig({
          hasSideCamera: true,
          sideContentAuxNumericAspectRatio: 4 / 3,
          sideContentAuxWidth: 240,
        }),
        context,
      ).contentAuxHeight,
    ).toBe(180);
  });

  it('omits side aux content taller than the space above the camera rather than squeezing it', () => {
    expect(
      calculateSideRegionHeights(
        createResolvedLayoutConfig({ hasSideCamera: true, sideContentAuxNumericAspectRatio: 1 / 2 }),
        context,
      ).contentAuxHeight,
    ).toBe(0);
  });

  it('lets side aux content fill the row when there is no side camera', () => {
    expect(
      calculateSideRegionHeights(createResolvedLayoutConfig({ sideContentAuxNumericAspectRatio: 1 / 2 }), context)
        .contentAuxHeight,
    ).toBe(400);
  });

  it('omits side aux content when no space remains', () => {
    expect(
      calculateSideRegionHeights(
        createResolvedLayoutConfig({ hasSideCamera: true, sideContentAuxNumericAspectRatio: 4 / 3 }),
        { ...context, rowHeight: 110 },
      ).contentAuxHeight,
    ).toBe(0);
  });

  it('fills the remaining space with auto side info below side aux content', () => {
    expect(
      calculateSideRegionHeights(
        createResolvedLayoutConfig({
          hasSideCamera: true,
          hasSideInfo: true,
          sideContentAuxNumericAspectRatio: 4 / 3,
        }),
        context,
      ),
    ).toEqual({ contentAuxHeight: 150, infoHeight: 130, showSideCamera: true });
  });

  it('reaches attached auto side info up through the gap to the aux content, keeping the shared border', () => {
    expect(
      calculateSideRegionHeights(
        createResolvedLayoutConfig({
          hasSideCamera: true,
          hasSideInfo: true,
          isInfoPreviousAttached: true,
          sideContentAuxNumericAspectRatio: 4 / 3,
        }),
        { ...context, regionBorder: 4 },
      ).infoHeight,
    ).toBe(136);
  });

  it('keeps attached ratio side info at its ratio height', () => {
    expect(
      calculateSideRegionHeights(
        createResolvedLayoutConfig({
          hasSideCamera: true,
          hasSideInfo: true,
          isInfoPreviousAttached: true,
          sideContentAuxNumericAspectRatio: 4 / 3,
          sideInfoNumericAspectRatio: 16 / 9,
        }),
        { ...context, regionBorder: 4 },
      ).infoHeight,
    ).toBe(112.5);
  });

  it('ignores info attachment without side aux content above it', () => {
    expect(
      calculateSideRegionHeights(
        createResolvedLayoutConfig({ hasSideCamera: true, hasSideInfo: true, isInfoPreviousAttached: true }),
        { ...context, regionBorder: 4 },
      ).infoHeight,
    ).toBe(290);
  });

  it('sizes side info by its ratio when it fits', () => {
    expect(
      calculateSideRegionHeights(
        createResolvedLayoutConfig({ hasSideCamera: true, hasSideInfo: true, sideInfoNumericAspectRatio: 16 / 9 }),
        context,
      ).infoHeight,
    ).toBe(112.5);
  });

  it('omits side info taller than the remaining space before the aux content above it', () => {
    expect(
      calculateSideRegionHeights(
        createResolvedLayoutConfig({
          hasSideCamera: true,
          hasSideInfo: true,
          sideContentAuxNumericAspectRatio: 4 / 3,
          sideInfoNumericAspectRatio: 1,
        }),
        context,
      ),
    ).toEqual({ contentAuxHeight: 150, infoHeight: 0, showSideCamera: true });
  });

  it('shows side info that fits when the side aux content above it does not', () => {
    expect(
      calculateSideRegionHeights(
        createResolvedLayoutConfig({
          hasSideCamera: true,
          hasSideInfo: true,
          sideContentAuxNumericAspectRatio: 1 / 2,
          sideInfoNumericAspectRatio: 16 / 9,
        }),
        context,
      ),
    ).toEqual({ contentAuxHeight: 0, infoHeight: 112.5, showSideCamera: true });
  });

  it('omits auto side info when side aux content takes all the space', () => {
    expect(
      calculateSideRegionHeights(
        createResolvedLayoutConfig({
          hasSideCamera: true,
          hasSideInfo: true,
          sideContentAuxNumericAspectRatio: 1 / 2,
        }),
        { ...context, rowHeight: 510 },
      ),
    ).toEqual({ contentAuxHeight: 400, infoHeight: 0, showSideCamera: true });
  });
});

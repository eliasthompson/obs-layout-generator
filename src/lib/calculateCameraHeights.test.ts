import { describe, expect, it } from 'vitest';

import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

import { calculateCameraHeights, type CalculateCameraHeightsContext } from '@/lib/calculateCameraHeights';

const context: CalculateCameraHeightsContext = {
  cameraNumericAspectRatioDefault: 3 / 4,
  cameraNumericAspectRatioMax: 16 / 9,
  cameraNumericAspectRatioMin: 9 / 16,
  hasSideRoom: true,
  layoutGap: 10,
  regionBorder: 5,
  rowHeight: 410,
};

const createResolvedLayoutConfigs = (...sideContentAuxNumericAspectRatios: (number | undefined)[]) =>
  sideContentAuxNumericAspectRatios.map((sideContentAuxNumericAspectRatio, index): ResolvedLayoutConfig => ({
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
    sideCameraWidth: 200,
    sideContentAuxNumericAspectRatio,
    // The second config's aux content is attached to the main region, so it is wider than the side column
    sideContentAuxWidth: index === 1 ? 280 : 200,
    sideInfoWidth: 200,
    sideWidthTotal: 210,
  }));

const [withoutStack] = createResolvedLayoutConfigs(undefined);
const withInfo = (sideInfoNumericAspectRatio: number | undefined, resolvedLayoutConfig = withoutStack) => ({
  ...resolvedLayoutConfig,
  hasSideInfo: true,
  sideInfoNumericAspectRatio,
});

describe('calculateCameraHeights', () => {
  it('takes the default ratio without a side stack', () => {
    const cameraHeights = calculateCameraHeights([withoutStack], context);

    expect(cameraHeights.cameraHeight).toBeCloseTo(800 / 3);
    expect(cameraHeights.hasCameraRoom).toBe(true);
  });

  it('is never taller than the row', () => {
    expect(calculateCameraHeights([withoutStack], { ...context, rowHeight: 200 }).cameraHeight).toBe(200);
  });

  it('is never narrower than the minimum ratio, even at the default ratio', () => {
    expect(calculateCameraHeights([withoutStack], { ...context, cameraNumericAspectRatioMin: 1 }).cameraHeight).toBe(
      200,
    );
  });

  it('stays at the default ratio when side aux content fits above it', () => {
    expect(calculateCameraHeights(createResolvedLayoutConfigs(2), context).cameraHeight).toBeCloseTo(800 / 3);
  });

  it('leaves room for the tallest side aux content in the layout', () => {
    expect(calculateCameraHeights(createResolvedLayoutConfigs(4 / 3, undefined, 0.8), context).cameraHeight).toBe(150);
  });

  it('measures side aux content at its own width when it is attached to the main region', () => {
    expect(calculateCameraHeights(createResolvedLayoutConfigs(undefined, 4 / 3), context).cameraHeight).toBe(190);
  });

  it('leaves room for ratio info', () => {
    expect(calculateCameraHeights([withInfo(1)], context).cameraHeight).toBe(200);
  });

  it('leaves room for ratio info below aux content, a gap or one shared border away', () => {
    const [withContentAux] = createResolvedLayoutConfigs(4);

    expect(calculateCameraHeights([withInfo(2, withContentAux)], context).cameraHeight).toBe(240);
    expect(
      calculateCameraHeights([{ ...withInfo(2, withContentAux), isInfoPreviousAttached: true }], context).cameraHeight,
    ).toBe(245);
  });

  it('is not shortened by auto info', () => {
    expect(calculateCameraHeights([withInfo(undefined)], context).cameraHeight).toBeCloseTo(800 / 3);
  });

  it('shortens down to the maximum ratio for side aux content that fits above it there', () => {
    expect(
      calculateCameraHeights(createResolvedLayoutConfigs(0.8), { ...context, rowHeight: 372.5 }).cameraHeight,
    ).toBe(112.5);
  });

  it('ignores side aux content too tall to fit above the camera at the maximum ratio, since it is omitted', () => {
    expect(calculateCameraHeights(createResolvedLayoutConfigs(0.6), context).cameraHeight).toBeCloseTo(800 / 3);
  });

  it('ignores ratio info that does not fit below the aux content above the camera at the maximum ratio', () => {
    const [withContentAux] = createResolvedLayoutConfigs(4 / 3);

    expect(calculateCameraHeights([withInfo(1, withContentAux)], context).cameraHeight).toBe(250);
  });

  it('takes the default from the narrowest side camera and the maximum from the widest', () => {
    const [narrow, wide] = createResolvedLayoutConfigs(0.8, undefined);

    // At 16:9, the 280 px camera leaves 232.5 px above it, too little for the 250 px aux content, which is omitted
    expect(
      calculateCameraHeights([narrow, { ...wide, sideCameraWidth: 280 }], { ...context, rowHeight: 400 }).cameraHeight,
    ).toBeCloseTo(800 / 3);
    expect(calculateCameraHeights([{ ...narrow, sideCameraWidth: 90 }, wide], context).cameraHeight).toBe(120);
  });

  it('ignores the side camera width and side stack of participants without a side camera', () => {
    const [withContentAux] = createResolvedLayoutConfigs(0.8);

    expect(
      calculateCameraHeights(
        [
          withoutStack,
          { ...withoutStack, hasSideCamera: false, sideCameraWidth: 90 },
          { ...withContentAux, hasSideCamera: false },
        ],
        context,
      ).cameraHeight,
    ).toBeCloseTo(800 / 3);
  });

  it('fills the row when no participant has a side camera', () => {
    expect(calculateCameraHeights([{ ...withoutStack, hasSideCamera: false }], context).cameraHeight).toBe(410);
  });

  it('has no camera room without side room', () => {
    expect(calculateCameraHeights([withoutStack], { ...context, hasSideRoom: false }).hasCameraRoom).toBe(false);
  });

  it('has no camera room when the camera rounds to nothing', () => {
    expect(calculateCameraHeights([withoutStack], { ...context, rowHeight: 0.4 })).toEqual({
      cameraHeight: 0.4,
      hasCameraRoom: false,
    });
  });

  it('never sizes the camera below zero', () => {
    expect(calculateCameraHeights([withoutStack], { ...context, rowHeight: -10 }).cameraHeight).toBe(0);
  });
});

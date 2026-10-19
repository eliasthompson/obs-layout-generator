import { describe, expect, it } from 'vitest';

import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

import { calculateCameraHeights, type CalculateCameraHeightsContext } from '@/lib/calculateCameraHeights';

const context: CalculateCameraHeightsContext = {
  hasSideRoom: true,
  layoutGap: 10,
  rowHeight: 410,
};

const createResolvedLayoutConfigs = (...sideContentAuxNumericAspectRatios: (number | undefined)[]) =>
  sideContentAuxNumericAspectRatios.map((sideContentAuxNumericAspectRatio, index): ResolvedLayoutConfig => ({
    hasName: false,
    hasSideCamera: true,
    hasSideInfo: false,
    isCameraAboveAttached: false,
    isCameraGreenScreen: false,
    isInfoAboveAttached: false,
    mainNumericAspectRatio: 16 / 9,
    sideCameraWidth: 200,
    sideContentAuxNumericAspectRatio,
    // The second config's aux content is attached to the main region, so it is wider than the side column
    sideContentAuxWidth: index === 1 ? 280 : 200,
    sideInfoWidth: 200,
    sideWidthTotal: 210,
  }));

describe('calculateCameraHeights', () => {
  it('uses half the row without side aux content, with a third of it as the name cap', () => {
    const cameraHeights = calculateCameraHeights(createResolvedLayoutConfigs(undefined), context);

    expect(cameraHeights).toMatchObject({ cameraHeight: 200, hasCameraNameRoom: true, hasCameraRoom: true });
    expect(cameraHeights.nameHeightMax).toBeCloseTo(200 / 3);
  });

  it('stays at half the row when side aux content fits above it', () => {
    expect(calculateCameraHeights(createResolvedLayoutConfigs(4 / 3), context).cameraHeight).toBe(200);
  });

  it('leaves room for the tallest side aux content in the layout without lowering the name cap', () => {
    const cameraHeights = calculateCameraHeights(createResolvedLayoutConfigs(4 / 3, undefined, 0.8), context);

    expect(cameraHeights).toMatchObject({ cameraHeight: 150, hasCameraNameRoom: true });
    expect(cameraHeights.nameHeightMax).toBeCloseTo(200 / 3);
  });

  it('measures side aux content at its own width when it is attached to the main region', () => {
    expect(calculateCameraHeights(createResolvedLayoutConfigs(undefined, 4 / 3), context).cameraHeight).toBe(190);
  });

  it('keeps the camera but moves the name off it when the camera is shorter than the name cap', () => {
    const cameraHeights = calculateCameraHeights(createResolvedLayoutConfigs(5 / 9), context);

    expect(cameraHeights.cameraHeight).toBeCloseTo(40);
    expect(cameraHeights).toMatchObject({ hasCameraNameRoom: false, hasCameraRoom: true });
  });

  it('collapses the camera when side aux content takes the whole row', () => {
    expect(calculateCameraHeights(createResolvedLayoutConfigs(0.5), context)).toMatchObject({
      cameraHeight: 0,
      hasCameraNameRoom: false,
      hasCameraRoom: false,
    });
  });

  it('has no camera room without side room', () => {
    expect(
      calculateCameraHeights(createResolvedLayoutConfigs(undefined), { ...context, hasSideRoom: false }),
    ).toMatchObject({ cameraHeight: 200, hasCameraNameRoom: false, hasCameraRoom: false });
  });

  it('never caps the name below zero when the row is shorter than the gap', () => {
    expect(calculateCameraHeights(createResolvedLayoutConfigs(undefined), { ...context, rowHeight: 4 })).toMatchObject({
      cameraHeight: 0,
      hasCameraRoom: false,
      nameHeightMax: 0,
    });
  });
});

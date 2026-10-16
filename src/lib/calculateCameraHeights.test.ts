import { describe, expect, it } from 'vitest';

import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

import { calculateCameraHeights, type CalculateCameraHeightsContext } from '@/lib/calculateCameraHeights';

const context: CalculateCameraHeightsContext = {
  hasSideRoom: true,
  layoutGap: 10,
  layoutSideWidth: 200,
  rowHeight: 410,
};

const createResolvedLayoutConfigs = (...sideContentAuxNumericAspectRatios: (number | undefined)[]) =>
  sideContentAuxNumericAspectRatios.map((sideContentAuxNumericAspectRatio): ResolvedLayoutConfig => ({
    hasName: false,
    hasSideCamera: true,
    hasSideInfo: false,
    mainNumericAspectRatio: 16 / 9,
    sideContentAuxNumericAspectRatio,
    sideWidthTotal: 210,
  }));

describe('calculateCameraHeights', () => {
  it('uses half the row without side aux content', () => {
    const cameraHeights = calculateCameraHeights(createResolvedLayoutConfigs(undefined), context);

    expect(cameraHeights).toMatchObject({ cameraHeight: 200, hasCameraNameRoom: true, hasCameraRoom: true });
    expect(cameraHeights.nameHeight).toBeCloseTo(200 / 3);
  });

  it('stays at half the row when side aux content fits above it', () => {
    expect(calculateCameraHeights(createResolvedLayoutConfigs(4 / 3), context).cameraHeight).toBe(200);
  });

  it('leaves room for the tallest side aux content in the layout', () => {
    const cameraHeights = calculateCameraHeights(createResolvedLayoutConfigs(4 / 3, undefined, 0.8), context);

    expect(cameraHeights).toMatchObject({ cameraHeight: 150, hasCameraNameRoom: true, nameHeight: 50 });
  });

  it('keeps the camera but moves the name off it when the camera is too short for the name', () => {
    const cameraHeights = calculateCameraHeights(createResolvedLayoutConfigs(5 / 9), context);

    expect(cameraHeights.cameraHeight).toBeCloseTo(40);
    expect(cameraHeights).toMatchObject({ hasCameraNameRoom: false, hasCameraRoom: true });
    expect(cameraHeights.nameHeight).toBeCloseTo(200 / 3);
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
});

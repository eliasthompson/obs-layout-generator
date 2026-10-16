import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

export interface CalculateCameraHeightsContext {
  hasSideRoom: boolean;
  layoutGap: number;
  layoutSideWidth: number;
  rowHeight: number;
}

export interface CameraHeights {
  cameraHeight: number;
  hasCameraNameRoom: boolean;
  hasCameraRoom: boolean;
  nameHeight: number;
}

// Size the shared side camera, leaving room for the tallest side aux content, and the name that sits on it
export const calculateCameraHeights = (
  resolvedLayoutConfigs: ResolvedLayoutConfig[],
  { hasSideRoom, layoutGap, layoutSideWidth, rowHeight }: CalculateCameraHeightsContext,
): CameraHeights => {
  const sideContentAuxNumericAspectRatios = resolvedLayoutConfigs.flatMap(
    ({ sideContentAuxNumericAspectRatio }) => sideContentAuxNumericAspectRatio ?? [],
  );
  const cameraHeightMax = (rowHeight - layoutGap) / 2;
  const cameraHeightVariable = sideContentAuxNumericAspectRatios.length
    ? rowHeight - layoutGap - layoutSideWidth / Math.min(...sideContentAuxNumericAspectRatios)
    : cameraHeightMax;
  const cameraHeight = Math.max(0, Math.min(cameraHeightMax, cameraHeightVariable));
  const hasCameraRoom = hasSideRoom && Math.round(cameraHeight) > 0;
  const nameHeightMax = cameraHeightMax / 3;
  const hasCameraNameRoom = hasCameraRoom && cameraHeight >= nameHeightMax;

  return {
    cameraHeight,
    hasCameraNameRoom,
    hasCameraRoom,
    nameHeight: hasCameraNameRoom ? cameraHeight / 3 : nameHeightMax,
  };
};

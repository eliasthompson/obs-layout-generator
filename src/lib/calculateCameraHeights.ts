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

/**
 * Size the side camera shared by every participant, and the name tag that sits on it.
 *
 * @param resolvedLayoutConfigs - Resolved configs for every participant.
 * @param context - Whether there is a side column at all, the column gap, side width, and row height.
 * @returns The shared camera height, whether it is usable, the name height, and whether the camera can host the name.
 */
export const calculateCameraHeights = (
  resolvedLayoutConfigs: ResolvedLayoutConfig[],
  { hasSideRoom, layoutGap, layoutSideWidth, rowHeight }: CalculateCameraHeightsContext,
): CameraHeights => {
  // Side aux content sits above the camera, so the tallest one in the layout limits every camera
  const sideContentAuxNumericAspectRatios = resolvedLayoutConfigs.flatMap(
    ({ sideContentAuxNumericAspectRatio }) => sideContentAuxNumericAspectRatio ?? [],
  );
  // A camera is at most half the row, less the gap to whatever stacks above it
  const cameraHeightMax = (rowHeight - layoutGap) / 2;
  // With side aux content, the camera gets what the tallest aux (the smallest ratio at the side width) leaves
  const cameraHeightVariable = sideContentAuxNumericAspectRatios.length
    ? rowHeight - layoutGap - layoutSideWidth / Math.min(...sideContentAuxNumericAspectRatios)
    : cameraHeightMax;
  const cameraHeight = Math.max(0, Math.min(cameraHeightMax, cameraHeightVariable));
  const hasCameraRoom = hasSideRoom && Math.round(cameraHeight) > 0;
  // The name is a third of the camera when the camera is tall enough, else a third of the largest possible camera
  const nameHeightMax = cameraHeightMax / 3;
  const hasCameraNameRoom = hasCameraRoom && cameraHeight >= nameHeightMax;

  return {
    cameraHeight,
    hasCameraNameRoom,
    hasCameraRoom,
    nameHeight: hasCameraNameRoom ? cameraHeight / 3 : nameHeightMax,
  };
};

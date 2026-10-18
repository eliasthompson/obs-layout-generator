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
  nameHeightMax: number;
}

/**
 * Size the side camera shared by every participant, and the largest name tag: a third of a full-height side camera.
 *
 * @param resolvedLayoutConfigs - Resolved configs for every participant.
 * @param context - Whether there is a side column at all, the column gap, side width, and row height.
 * @returns The shared camera height, whether it is usable and tall enough to host the name, and the name height cap.
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
  // The name is at most a third of the largest possible camera; a side camera shorter than that hands it to the content
  const nameHeightMax = Math.max(0, cameraHeightMax / 3);
  const hasCameraNameRoom = hasCameraRoom && cameraHeight >= nameHeightMax;

  return { cameraHeight, hasCameraNameRoom, hasCameraRoom, nameHeightMax };
};

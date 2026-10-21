import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

import { CAMERA_ASPECT_RATIO_MIN } from '@/constants/cameraAspectRatioMin';
import { transformAspectRatio } from '@/lib/transformAspectRatio';

/** The narrowest side camera shape as a number, below which a camera is shortened */
export const cameraNumericAspectRatioMin = transformAspectRatio(CAMERA_ASPECT_RATIO_MIN);

export interface CalculateCameraHeightsContext {
  hasSideRoom: boolean;
  layoutGap: number;
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
 * The camera is never narrower than `CAMERA_ASPECT_RATIO_MIN`: a side column narrower than that at the shared height
 * shortens every camera instead.
 *
 * @param resolvedLayoutConfigs - Resolved configs for every participant.
 * @param context - Whether there is a side column at all, the column gap, and the row height.
 * @returns The shared camera height, whether it is usable and tall enough to host the name, and the name height cap.
 */
export const calculateCameraHeights = (
  resolvedLayoutConfigs: ResolvedLayoutConfig[],
  { hasSideRoom, layoutGap, rowHeight }: CalculateCameraHeightsContext,
): CameraHeights => {
  // Side aux content sits above the camera, so the tallest one in the layout, at its own width, limits every camera
  const sideContentAuxHeights = resolvedLayoutConfigs.flatMap(
    ({ sideContentAuxNumericAspectRatio, sideContentAuxWidth }) =>
      sideContentAuxNumericAspectRatio ? [sideContentAuxWidth / sideContentAuxNumericAspectRatio] : [],
  );
  // A camera is at most half the row, less the gap to whatever stacks above it
  const cameraHeightMax = (rowHeight - layoutGap) / 2;
  // With side aux content, the camera gets what the tallest aux leaves
  const cameraHeightVariable = sideContentAuxHeights.length
    ? rowHeight - layoutGap - Math.max(...sideContentAuxHeights)
    : cameraHeightMax;
  // The narrowest side camera in the layout must still be at least the minimum ratio, which caps the shared height
  const sideCameraWidths = resolvedLayoutConfigs.flatMap(({ hasSideCamera, sideCameraWidth }) =>
    hasSideCamera ? [sideCameraWidth] : [],
  );
  const cameraHeightRatioMax = sideCameraWidths.length
    ? Math.min(...sideCameraWidths) / cameraNumericAspectRatioMin
    : Infinity;
  const cameraHeight = Math.max(0, Math.min(cameraHeightMax, cameraHeightVariable, cameraHeightRatioMax));
  const hasCameraRoom = hasSideRoom && Math.round(cameraHeight) > 0;
  // The name is at most a third of the largest possible camera; a side camera shorter than that hands it to the content
  const nameHeightMax = Math.max(0, cameraHeightMax / 3);
  const hasCameraNameRoom = hasCameraRoom && cameraHeight >= nameHeightMax;

  return { cameraHeight, hasCameraNameRoom, hasCameraRoom, nameHeightMax };
};

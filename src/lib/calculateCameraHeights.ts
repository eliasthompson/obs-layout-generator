import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

import { calculateSideRegionHeights } from '@/lib/calculateSideRegionHeights';

export interface CalculateCameraHeightsContext {
  cameraNumericAspectRatioDefault: number;
  cameraNumericAspectRatioMax: number;
  cameraNumericAspectRatioMin: number;
  hasSideRoom: boolean;
  layoutGap: number;
  regionBorder: number;
  rowHeight: number;
}

export interface CameraHeights {
  cameraHeight: number;
  hasCameraRoom: boolean;
}

/**
 * Size the side camera shared by every participant: the default ratio, shortened to leave room for the side aux
 * content and ratio info stacked above it, but never wider than the maximum ratio, and never narrower than the
 * minimum ratio or taller than the row. Only the aux content and info that fit above a camera at the maximum ratio
 * count, since the rest is omitted, info before aux content. `'auto'` info fills what the camera leaves, so it does
 * not shorten it. A row too short for a camera at the maximum ratio narrows the camera instead.
 *
 * @param resolvedLayoutConfigs - Resolved configs for every participant.
 * @param context - The camera ratio default and limits, whether there is a side column at all, the column gap, the
 *   region border, and the row height.
 * @returns The shared camera height, and whether it is usable.
 */
export const calculateCameraHeights = (
  resolvedLayoutConfigs: ResolvedLayoutConfig[],
  {
    cameraNumericAspectRatioDefault,
    cameraNumericAspectRatioMax,
    cameraNumericAspectRatioMin,
    hasSideRoom,
    layoutGap,
    regionBorder,
    rowHeight,
  }: CalculateCameraHeightsContext,
): CameraHeights => {
  // The narrowest side camera sets the default height and must stay at least the minimum ratio, and the widest must
  // stay at most the maximum ratio
  const sideCameraResolvedLayoutConfigs = resolvedLayoutConfigs.filter(({ hasSideCamera }) => hasSideCamera);
  const sideCameraWidths = sideCameraResolvedLayoutConfigs.map(({ sideCameraWidth }) => sideCameraWidth);
  const sideCameraWidthMin = sideCameraWidths.length ? Math.min(...sideCameraWidths) : Infinity;
  const sideCameraWidthMax = sideCameraWidths.length ? Math.max(...sideCameraWidths) : 0;
  const cameraHeightDefault = sideCameraWidthMin / cameraNumericAspectRatioDefault;
  const cameraHeightMin = sideCameraWidthMax / cameraNumericAspectRatioMax;
  const cameraHeightRatioMax = sideCameraWidthMin / cameraNumericAspectRatioMin;
  // The shortest the camera gets, at the maximum ratio within the row, leaves the most room above it
  const cameraHeightLowest = Math.max(0, Math.min(rowHeight, cameraHeightRatioMax, cameraHeightMin));
  // The aux content and ratio info that fit above the shortest camera stack there at their own widths, so the tallest
  // such stack in the layout limits every camera
  const sideStackHeights = sideCameraResolvedLayoutConfigs.flatMap((resolvedLayoutConfig) => {
    const { isInfoPreviousAttached, sideInfoNumericAspectRatio } = resolvedLayoutConfig;
    const { contentAuxHeight, infoHeight } = calculateSideRegionHeights(
      { ...resolvedLayoutConfig, hasSideInfo: sideInfoNumericAspectRatio !== undefined },
      { cameraHeight: cameraHeightLowest, hasCameraRoom: true, layoutGap, regionBorder, rowHeight },
    );
    // Info below aux content is a gap away, or one shared border when attached to it
    const infoGap = contentAuxHeight ? (isInfoPreviousAttached ? regionBorder : layoutGap) : 0;
    const stackHeight = contentAuxHeight + (infoHeight ? infoGap + infoHeight : 0);

    return stackHeight ? [stackHeight] : [];
  });
  // With a side stack, the camera gets what the tallest one leaves
  const cameraHeightVariable = sideStackHeights.length
    ? rowHeight - layoutGap - Math.max(...sideStackHeights)
    : Infinity;
  const cameraHeight = Math.max(
    0,
    Math.min(
      rowHeight,
      cameraHeightRatioMax,
      Math.max(cameraHeightMin, Math.min(cameraHeightDefault, cameraHeightVariable)),
    ),
  );
  const hasCameraRoom = hasSideRoom && Math.round(cameraHeight) > 0;

  return { cameraHeight, hasCameraRoom };
};

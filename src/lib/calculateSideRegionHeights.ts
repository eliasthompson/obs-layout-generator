import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

export interface CalculateSideRegionHeightsContext {
  cameraHeight: number;
  hasCameraRoom: boolean;
  layoutGap: number;
  regionBorder: number;
  rowHeight: number;
}

export interface SideRegionHeights {
  contentAuxHeight: number;
  infoHeight: number;
  showSideCamera: boolean;
}

/** How far a region at its ratio may overrun the room above the camera, for floating point error. */
const FIT_TOLERANCE = 1e-6;

/**
 * Stack one participant's side column: aux content at the top, info below it, and the camera at the bottom. Aux content
 * and ratio info show at their ratios or not at all: aux content takes its place first, and each is omitted when it
 * does not fit what the camera and the regions above it leave.
 *
 * @param resolvedLayoutConfig - Which regions this participant has in its side column, their ratios and widths, and
 *   whether the info is attached to the aux content above it.
 * @param context - The shared camera height and whether it has room, the column gap, region border, and row height.
 * @returns Aux content and info heights, where `0` means the region is omitted, and whether the side camera is shown.
 */
export const calculateSideRegionHeights = (
  {
    hasSideCamera,
    hasSideInfo,
    isInfoPreviousAttached,
    sideContentAuxNumericAspectRatio,
    sideContentAuxWidth,
    sideInfoNumericAspectRatio,
    sideInfoWidth,
  }: ResolvedLayoutConfig,
  { cameraHeight, hasCameraRoom, layoutGap, regionBorder, rowHeight }: CalculateSideRegionHeightsContext,
): SideRegionHeights => {
  // Show the side camera only when this participant has one and the shared camera height is usable
  const showSideCamera = hasSideCamera && hasCameraRoom;
  // The stack above the camera gets whatever the camera and its gap leave of the row
  let stackHeight = showSideCamera ? rowHeight - cameraHeight - layoutGap : rowHeight;
  let contentAuxHeight = 0;
  let infoHeight = 0;

  // Aux content takes its ratio height at its width when that fits the stack, and claims its gap
  if (sideContentAuxNumericAspectRatio) {
    const height = sideContentAuxWidth / sideContentAuxNumericAspectRatio;

    if (Math.round(height) > 0 && height <= stackHeight + FIT_TOLERANCE) {
      contentAuxHeight = height;
      stackHeight -= height + layoutGap;
    }
  }

  // Info takes its ratio height the same way, or the rest of the stack when its ratio is 'auto'
  if (hasSideInfo) {
    // Attached to the aux content above it, info reaches up through the gap to share the aux content's border
    const attachedGap = isInfoPreviousAttached && contentAuxHeight ? layoutGap - regionBorder : 0;
    const height = sideInfoNumericAspectRatio ? sideInfoWidth / sideInfoNumericAspectRatio : stackHeight + attachedGap;

    if (Math.round(height) > 0 && height <= stackHeight + attachedGap + FIT_TOLERANCE) infoHeight = height;
  }

  return { contentAuxHeight, infoHeight, showSideCamera };
};

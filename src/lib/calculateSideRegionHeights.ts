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

/**
 * Stack one participant's side column: aux content at the top, info below it, and the camera at the bottom.
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
    isInfoAboveAttached,
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

  // Aux content takes its ratio height at its width, capped by the stack, and claims its gap when it fits
  if (sideContentAuxNumericAspectRatio) {
    const height = Math.min(sideContentAuxWidth / sideContentAuxNumericAspectRatio, stackHeight);

    if (Math.round(height) > 0) {
      contentAuxHeight = height;
      stackHeight -= height + layoutGap;
    }
  }

  // Info takes its ratio height the same way, or the rest of the stack when its ratio is 'auto'
  if (hasSideInfo) {
    // Attached to the aux content above it, info reaches up through the gap to share the aux content's border
    const attachedGap = isInfoAboveAttached && contentAuxHeight ? layoutGap - regionBorder : 0;
    const height = sideInfoNumericAspectRatio
      ? Math.min(sideInfoWidth / sideInfoNumericAspectRatio, stackHeight + attachedGap)
      : stackHeight + attachedGap;

    if (Math.round(height) > 0) infoHeight = height;
  }

  return { contentAuxHeight, infoHeight, showSideCamera };
};

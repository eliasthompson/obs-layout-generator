import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

export interface CalculateSideRegionHeightsContext {
  cameraHeight: number;
  hasCameraRoom: boolean;
  layoutGap: number;
  layoutSideWidth: number;
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
 * @param resolvedLayoutConfig - Which regions this participant has in its side column and their ratios.
 * @param context - The shared camera height and whether it has room, the column gap, side width, and row height.
 * @returns Aux content and info heights, where `0` means the region is omitted, and whether the side camera is shown.
 */
export const calculateSideRegionHeights = (
  { hasSideCamera, hasSideInfo, sideContentAuxNumericAspectRatio, sideInfoNumericAspectRatio }: ResolvedLayoutConfig,
  { cameraHeight, hasCameraRoom, layoutGap, layoutSideWidth, rowHeight }: CalculateSideRegionHeightsContext,
): SideRegionHeights => {
  // Show the side camera only when this participant has one and the shared camera height is usable
  const showSideCamera = hasSideCamera && hasCameraRoom;
  // The stack above the camera gets whatever the camera and its gap leave of the row
  let stackHeight = showSideCamera ? rowHeight - cameraHeight - layoutGap : rowHeight;
  let contentAuxHeight = 0;
  let infoHeight = 0;

  // Aux content takes its ratio height at the side width, capped by the stack, and claims its gap when it fits
  if (sideContentAuxNumericAspectRatio) {
    const height = Math.min(layoutSideWidth / sideContentAuxNumericAspectRatio, stackHeight);

    if (Math.round(height) > 0) {
      contentAuxHeight = height;
      stackHeight -= height + layoutGap;
    }
  }

  // Info takes its ratio height the same way, or the rest of the stack when its ratio is 'auto'
  if (hasSideInfo) {
    const height = sideInfoNumericAspectRatio
      ? Math.min(layoutSideWidth / sideInfoNumericAspectRatio, stackHeight)
      : stackHeight;

    if (Math.round(height) > 0) infoHeight = height;
  }

  return { contentAuxHeight, infoHeight, showSideCamera };
};

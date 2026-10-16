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

// Stack side aux content at the top, info below it, and the camera at the bottom; a height of 0 means the region is omitted
export const calculateSideRegionHeights = (
  { hasSideCamera, hasSideInfo, sideContentAuxNumericAspectRatio, sideInfoNumericAspectRatio }: ResolvedLayoutConfig,
  { cameraHeight, hasCameraRoom, layoutGap, layoutSideWidth, rowHeight }: CalculateSideRegionHeightsContext,
): SideRegionHeights => {
  const showSideCamera = hasSideCamera && hasCameraRoom;
  let stackHeight = showSideCamera ? rowHeight - cameraHeight - layoutGap : rowHeight;
  let contentAuxHeight = 0;
  let infoHeight = 0;

  if (sideContentAuxNumericAspectRatio) {
    const height = Math.min(layoutSideWidth / sideContentAuxNumericAspectRatio, stackHeight);

    if (Math.round(height) > 0) {
      contentAuxHeight = height;
      stackHeight -= height + layoutGap;
    }
  }

  if (hasSideInfo) {
    const height = sideInfoNumericAspectRatio
      ? Math.min(layoutSideWidth / sideInfoNumericAspectRatio, stackHeight)
      : stackHeight;

    if (Math.round(height) > 0) infoHeight = height;
  }

  return { contentAuxHeight, infoHeight, showSideCamera };
};

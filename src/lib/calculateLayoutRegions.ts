import type { SideRegionHeights } from '@/lib/calculateSideRegionHeights';
import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';
import type { LayoutMetric, LayoutRegion } from '@/types/LayoutMetric';

export interface CalculateLayoutRegionsContext {
  cameraHeight: number;
  cameraNumericAspectRatioMin: number;
  layoutGap: number;
  layoutSideWidth: number;
  mainWidth: number;
  mainX: number;
  regionBorder: number;
  rowHeight: number;
  rowY: number;
}

/**
 * Position one participant's regions: the main column region and the side column stack.
 *
 * @param resolvedLayoutConfig - Which region takes the main column, the side region widths, how the side regions
 *   attach, and whether the camera is a green screen.
 * @param sideRegionHeights - Heights of the side regions, where `0` omits the region.
 * @param context - The shared camera height, the narrowest camera ratio, the column gap and side width, the region
 *   border, and the size and position of the main column and the row.
 * @returns The positioned regions, before any green screen camera is expanded, the name is placed, and rounding.
 */
export const calculateLayoutRegions = (
  {
    isCameraAboveAttached,
    isCameraGreenScreen,
    isInfoAboveAttached,
    mainRegion,
    sideCameraWidth,
    sideContentAuxWidth,
    sideInfoWidth,
  }: ResolvedLayoutConfig,
  { contentAuxHeight, infoHeight, showSideCamera }: SideRegionHeights,
  {
    cameraHeight,
    cameraNumericAspectRatioMin,
    layoutGap,
    layoutSideWidth,
    mainWidth,
    mainX,
    regionBorder,
    rowHeight,
    rowY,
  }: CalculateLayoutRegionsContext,
): LayoutMetric => {
  // Side regions line up on the right edge of the side column; attached ones reach further left from there
  const sideRight = mainX + mainWidth + layoutGap + layoutSideWidth;
  const rowBottom = rowY + rowHeight;
  // The main region fills the main column, unless the column would round to nothing
  const main =
    mainRegion && Math.round(mainWidth) > 0 && Math.round(rowHeight) > 0
      ? { x: mainX, y: rowY, width: mainWidth, height: rowHeight, hasBorder: true }
      : undefined;
  const layoutMetric: LayoutMetric = {};
  // The lowest side region placed so far, which the next one down may attach to
  let above: LayoutRegion | undefined;

  // Main content only ever takes the main column
  if (mainRegion === 'contentMain' && main) {
    layoutMetric.contentMain = main;
  }

  // Aux content: the main column, else the top of the side column
  if (mainRegion === 'contentAux' && main) {
    layoutMetric.contentAux = main;
  } else if (contentAuxHeight) {
    layoutMetric.contentAux = {
      x: sideRight - sideContentAuxWidth,
      y: rowY,
      width: sideContentAuxWidth,
      height: contentAuxHeight,
      hasBorder: true,
    };
    above = layoutMetric.contentAux;
  }

  // Info: the main column, else the side column below the aux content, or at the top when there is none
  if (mainRegion === 'info' && main) {
    layoutMetric.info = main;
  } else if (infoHeight) {
    // Attached, info sits one shared border below the aux content instead of a gap
    const infoY = above ? above.y + above.height + (isInfoAboveAttached ? regionBorder : layoutGap) : rowY;

    layoutMetric.info = {
      x: sideRight - sideInfoWidth,
      y: infoY,
      width: sideInfoWidth,
      height: infoHeight,
      hasBorder: true,
    };
    above = layoutMetric.info;
  }

  // Camera: the main column, else the bottom of the side column at the shared camera height, reaching up to share
  // the border of the region above it when attached, unless that would make it narrower than the minimum ratio
  if (mainRegion === 'camera' && main) {
    layoutMetric.camera = { ...main, hasBorder: !isCameraGreenScreen };
  } else if (showSideCamera) {
    const attachedCameraY = above && isCameraAboveAttached ? above.y + above.height + regionBorder : undefined;
    const cameraY =
      attachedCameraY !== undefined && rowBottom - attachedCameraY <= sideCameraWidth / cameraNumericAspectRatioMin
        ? attachedCameraY
        : rowBottom - cameraHeight;

    layoutMetric.camera = {
      x: sideRight - sideCameraWidth,
      y: cameraY,
      width: sideCameraWidth,
      height: rowBottom - cameraY,
      hasBorder: !isCameraGreenScreen,
    };
  }

  return layoutMetric;
};

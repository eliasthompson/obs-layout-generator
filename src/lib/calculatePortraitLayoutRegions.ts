import type { SideRowSizes } from '@/lib/calculateSideRowSizes';
import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';
import type { LayoutMetric } from '@/types/LayoutMetric';

export interface CalculatePortraitLayoutRegionsContext {
  cellX: number;
  cellY: number;
  columnWidth: number;
  layoutGap: number;
  regionBorder: number;
}

/**
 * Position one participant's regions on a portrait canvas: the main region at the top of its cell and the side row
 * beneath it, with aux content at the left, info next, and the camera at the right end.
 *
 * @param resolvedLayoutConfig - Which region takes the main column, how the side regions attach, and whether the
 *   camera is a green screen.
 * @param sideRowSizes - The main region height and each side region's size, where `0` omits the region.
 * @param context - The cell position, the column width, the gap between regions, and the region border.
 * @returns The positioned regions, before any green screen camera is expanded, the name is placed, and rounding.
 */
export const calculatePortraitLayoutRegions = (
  {
    isCameraGreenScreen,
    isContentAuxMainAttached,
    isInfoAboveAttached,
    isInfoMainAttached,
    mainRegion,
  }: ResolvedLayoutConfig,
  {
    mainHeight,
    contentAuxWidth,
    contentAuxHeight,
    infoWidth,
    infoHeight,
    cameraWidth,
    cameraHeight,
    isCameraMainAttached,
  }: SideRowSizes,
  { cellX, cellY, columnWidth, layoutGap, regionBorder }: CalculatePortraitLayoutRegionsContext,
): LayoutMetric => {
  const attachedGrowth = layoutGap - regionBorder;
  // The side row sits directly beneath the main region; a region attached to it reaches up by the gap less the border
  const rowY = cellY + mainHeight + layoutGap;
  const cellRight = cellX + columnWidth;
  // The main region fills the top of the cell, unless it would round to nothing
  const main =
    mainRegion && Math.round(columnWidth) > 0 && Math.round(mainHeight) > 0
      ? { x: cellX, y: cellY, width: columnWidth, height: mainHeight, hasBorder: true }
      : undefined;
  const layoutMetric: LayoutMetric = {};

  // Main content only ever takes the main column
  if (mainRegion === 'contentMain' && main) {
    layoutMetric.contentMain = main;
  }

  // Aux content: the main column, else the left end of the side row
  const sideContentAux =
    mainRegion !== 'contentAux' && contentAuxWidth
      ? {
          x: cellX,
          y: rowY - (isContentAuxMainAttached ? attachedGrowth : 0),
          width: contentAuxWidth,
          height: contentAuxHeight,
          hasBorder: true,
        }
      : undefined;

  if (mainRegion === 'contentAux' && main) {
    layoutMetric.contentAux = main;
  } else if (sideContentAux) {
    layoutMetric.contentAux = sideContentAux;
  }

  // Info: the main column, else right of the aux content, one shared border away when attached, or the left end
  if (mainRegion === 'info' && main) {
    layoutMetric.info = main;
  } else if (infoWidth) {
    layoutMetric.info = {
      x: sideContentAux
        ? sideContentAux.x + sideContentAux.width + (isInfoAboveAttached ? regionBorder : layoutGap)
        : cellX,
      y: rowY - (isInfoMainAttached ? attachedGrowth : 0),
      width: infoWidth,
      height: infoHeight,
      hasBorder: true,
    };
  }

  // Camera: the main column, else the right end of the side row
  if (mainRegion === 'camera' && main) {
    layoutMetric.camera = { ...main, hasBorder: !isCameraGreenScreen };
  } else if (cameraWidth) {
    layoutMetric.camera = {
      x: cellRight - cameraWidth,
      y: rowY - (isCameraMainAttached ? attachedGrowth : 0),
      width: cameraWidth,
      height: cameraHeight,
      hasBorder: !isCameraGreenScreen,
    };
  }

  return layoutMetric;
};

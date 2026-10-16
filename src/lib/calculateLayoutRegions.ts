import type { SideRegionHeights } from '@/lib/calculateSideRegionHeights';
import type { LayoutMainRegion } from '@/types/LayoutMainRegion';
import type { LayoutMetric } from '@/types/LayoutMetric';

export interface CalculateLayoutRegionsContext {
  cameraHeight: number;
  layoutGap: number;
  layoutSideWidth: number;
  mainWidth: number;
  mainX: number;
  rowHeight: number;
  rowY: number;
}

/**
 * Position one participant's regions: the main column region and the side column stack.
 *
 * @param mainRegion - Which region takes the main column, or `undefined` when none does.
 * @param sideRegionHeights - Heights of the side regions, where `0` omits the region.
 * @param context - The shared camera height, the column gap and side width, and the size and position of the main
 *   column and the row.
 * @returns The positioned regions, before the name is placed and before rounding.
 */
export const calculateLayoutRegions = (
  mainRegion: LayoutMainRegion | undefined,
  { contentAuxHeight, infoHeight, showSideCamera }: SideRegionHeights,
  { cameraHeight, layoutGap, layoutSideWidth, mainWidth, mainX, rowHeight, rowY }: CalculateLayoutRegionsContext,
): LayoutMetric => {
  // The side column starts after the main column and the gap between them
  const sideX = mainX + mainWidth + layoutGap;
  // The main region fills the main column, unless the column would round to nothing
  const main =
    mainRegion && Math.round(mainWidth) > 0 && Math.round(rowHeight) > 0
      ? { x: mainX, y: rowY, width: mainWidth, height: rowHeight }
      : undefined;
  const layoutMetric: LayoutMetric = {};

  // Camera: the main column, else the bottom of the side column at the shared camera height
  if (mainRegion === 'camera' && main) {
    layoutMetric.camera = main;
  } else if (showSideCamera) {
    layoutMetric.camera = {
      x: sideX,
      y: rowY + rowHeight - cameraHeight,
      width: layoutSideWidth,
      height: cameraHeight,
    };
  }

  // Main content only ever takes the main column
  if (mainRegion === 'contentMain' && main) {
    layoutMetric.contentMain = main;
  }

  // Aux content: the main column, else the top of the side column
  if (mainRegion === 'contentAux' && main) {
    layoutMetric.contentAux = main;
  } else if (contentAuxHeight) {
    layoutMetric.contentAux = { x: sideX, y: rowY, width: layoutSideWidth, height: contentAuxHeight };
  }

  // Info: the main column, else the side column below the aux content, or at the top when there is none
  if (mainRegion === 'info' && main) {
    layoutMetric.info = main;
  } else if (infoHeight) {
    layoutMetric.info = {
      x: sideX,
      y: rowY + (contentAuxHeight ? contentAuxHeight + layoutGap : 0),
      width: layoutSideWidth,
      height: infoHeight,
    };
  }

  return layoutMetric;
};

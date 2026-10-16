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

// Position the main column element and the side column stack of one layout config, before the name and rounding
export const calculateLayoutRegions = (
  mainRegion: LayoutMainRegion | undefined,
  { contentAuxHeight, infoHeight, showSideCamera }: SideRegionHeights,
  { cameraHeight, layoutGap, layoutSideWidth, mainWidth, mainX, rowHeight, rowY }: CalculateLayoutRegionsContext,
): LayoutMetric => {
  const sideX = mainX + mainWidth + layoutGap;
  const main =
    mainRegion && Math.round(mainWidth) > 0 && Math.round(rowHeight) > 0
      ? { x: mainX, y: rowY, width: mainWidth, height: rowHeight }
      : undefined;
  const layoutMetric: LayoutMetric = {};

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

  if (mainRegion === 'contentMain' && main) {
    layoutMetric.contentMain = main;
  }

  if (mainRegion === 'contentAux' && main) {
    layoutMetric.contentAux = main;
  } else if (contentAuxHeight) {
    layoutMetric.contentAux = { x: sideX, y: rowY, width: layoutSideWidth, height: contentAuxHeight };
  }

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

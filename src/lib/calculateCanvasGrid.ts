import { CONTENT_ASPECT_RATIOS } from '@/constants/contentAspectRatios';
import { LAYOUT_OPTIONS_DEFAULT, type LayoutOptions } from '@/constants/layoutOptions';
import { transformAspectRatio } from '@/lib/transformAspectRatio';

// Measured between region content rects: the content area is inset by one region border and the gaps include two
export interface CanvasGrid {
  canvasContentHeight: number;
  canvasContentWidth: number;
  canvasContentX: number;
  canvasContentY: number;
  canvasGap: number;
  canvasGridUnitNumericAspectRatio: number;
  hasSideRoom: boolean;
  layoutGap: number;
  layoutSideWidth: number;
  regionBorder: number;
}

export const numericContentAspectRatios = CONTENT_ASPECT_RATIOS.map(transformAspectRatio);
export const widestNumericContentAspectRatio = Math.max(...numericContentAspectRatios);

// Size the content area and grid, giving the side column whatever a grid cell has left after the widest content ratio
export const calculateCanvasGrid = (
  {
    canvasWidth = LAYOUT_OPTIONS_DEFAULT.canvasWidth,
    canvasHeight = LAYOUT_OPTIONS_DEFAULT.canvasHeight,
    canvasMarginTop = LAYOUT_OPTIONS_DEFAULT.canvasMarginTop,
    canvasMarginBottom = LAYOUT_OPTIONS_DEFAULT.canvasMarginBottom,
    canvasMarginLeft = LAYOUT_OPTIONS_DEFAULT.canvasMarginLeft,
    canvasMarginRight = LAYOUT_OPTIONS_DEFAULT.canvasMarginRight,
    canvasPadding = LAYOUT_OPTIONS_DEFAULT.canvasPadding,
    canvasGap = LAYOUT_OPTIONS_DEFAULT.canvasGap,
    layoutGap = LAYOUT_OPTIONS_DEFAULT.layoutGap ?? canvasGap / 2,
    regionBorder = LAYOUT_OPTIONS_DEFAULT.regionBorder,
  }: LayoutOptions,
  layoutConfigsTotal: number,
): CanvasGrid => {
  // Borders sit outside region content rects, so in content terms they inset the content area and widen the gaps
  const regionBorderTotal = regionBorder * 2;
  const canvasContentGap = canvasGap + regionBorderTotal;
  const layoutContentGap = layoutGap + regionBorderTotal;
  const canvasContentWidth = canvasWidth - canvasMarginLeft - canvasMarginRight - canvasPadding * 2 - regionBorderTotal;
  const canvasContentHeight =
    canvasHeight - canvasMarginTop - canvasMarginBottom - canvasPadding * 2 - regionBorderTotal;
  const canvasGridUnits = Math.ceil(Math.sqrt(layoutConfigsTotal));
  const canvasGridUnitWidth = (canvasContentWidth - (canvasGridUnits - 1) * canvasContentGap) / canvasGridUnits;
  const canvasGridUnitHeight = (canvasContentHeight - (canvasGridUnits - 1) * canvasContentGap) / canvasGridUnits;
  const layoutSideWidth = Math.max(
    0,
    canvasGridUnitWidth - canvasGridUnitHeight * widestNumericContentAspectRatio - layoutContentGap,
  );

  return {
    canvasContentHeight,
    canvasContentWidth,
    canvasContentX: canvasMarginLeft + canvasPadding + regionBorder,
    canvasContentY: canvasMarginTop + canvasPadding + regionBorder,
    canvasGap: canvasContentGap,
    canvasGridUnitNumericAspectRatio: canvasGridUnitWidth / canvasGridUnitHeight,
    hasSideRoom: Math.round(layoutSideWidth) > 0,
    layoutGap: layoutContentGap,
    layoutSideWidth,
    regionBorder,
  };
};

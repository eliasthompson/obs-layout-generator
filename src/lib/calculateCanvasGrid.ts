import { CONTENT_ASPECT_RATIOS } from '@/constants/contentAspectRatios';
import { LAYOUT_OPTIONS_DEFAULT, type LayoutOptions } from '@/constants/layoutOptions';
import { transformAspectRatio } from '@/lib/transformAspectRatio';

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
}

export const numericContentAspectRatios = CONTENT_ASPECT_RATIOS.map(transformAspectRatio);
export const widestNumericContentAspectRatio = Math.max(...numericContentAspectRatios);

// Size the content area and grid, giving the side column whatever a grid cell has left after the widest content ratio
export const calculateCanvasGrid = (
  {
    canvasWidth = LAYOUT_OPTIONS_DEFAULT.canvasWidth,
    canvasHeight = LAYOUT_OPTIONS_DEFAULT.canvasHeight,
    canvasPadding = LAYOUT_OPTIONS_DEFAULT.canvasPadding,
    canvasMarginTop = LAYOUT_OPTIONS_DEFAULT.canvasMarginTop,
    canvasMarginBottom = LAYOUT_OPTIONS_DEFAULT.canvasMarginBottom,
    canvasMarginLeft = LAYOUT_OPTIONS_DEFAULT.canvasMarginLeft,
    canvasMarginRight = LAYOUT_OPTIONS_DEFAULT.canvasMarginRight,
  }: LayoutOptions,
  layoutConfigsTotal: number,
): CanvasGrid => {
  const canvasPaddingTopBottom = canvasPadding * 3;
  const canvasGap = canvasPadding;
  const layoutGap = canvasGap / 2;
  const canvasContentWidth = canvasWidth - canvasMarginLeft - canvasMarginRight - canvasPadding * 2;
  const canvasContentHeight = canvasHeight - canvasMarginTop - canvasMarginBottom - canvasPaddingTopBottom * 2;
  const canvasGridUnits = Math.ceil(Math.sqrt(layoutConfigsTotal));
  const canvasGridUnitWidth = (canvasContentWidth - (canvasGridUnits - 1) * canvasGap) / canvasGridUnits;
  const canvasGridUnitHeight = (canvasContentHeight - (canvasGridUnits - 1) * canvasGap) / canvasGridUnits;
  const layoutSideWidth = Math.max(
    0,
    canvasGridUnitWidth - canvasGridUnitHeight * widestNumericContentAspectRatio - layoutGap,
  );

  return {
    canvasContentHeight,
    canvasContentWidth,
    canvasContentX: canvasMarginLeft + canvasPadding,
    canvasContentY: canvasMarginTop + canvasPaddingTopBottom,
    canvasGap,
    canvasGridUnitNumericAspectRatio: canvasGridUnitWidth / canvasGridUnitHeight,
    hasSideRoom: Math.round(layoutSideWidth) > 0,
    layoutGap,
    layoutSideWidth,
  };
};

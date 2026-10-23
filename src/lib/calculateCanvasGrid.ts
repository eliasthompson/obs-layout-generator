import type { AspectRatio } from '@/types/AspectRatio';
import type { LayoutNamePosition } from '@/types/LayoutNamePosition';

import { CONTENT_ASPECT_RATIOS } from '@/constants/contentAspectRatios';
import { LAYOUT_OPTIONS_DEFAULT, type LayoutOptions } from '@/constants/layoutOptions';
import { transformAspectRatio } from '@/lib/transformAspectRatio';

/**
 * Measured between region content rects: the content area is inset by one region border and the gaps include two.
 * The layout area is the canvas inside the margins, before padding and borders. The camera ratio limits and the name
 * settings are the resolved options both orientations share.
 */
export interface CanvasGrid {
  cameraNumericAspectRatioMax: number;
  cameraNumericAspectRatioMin: number;
  canvasContentHeight: number;
  canvasContentWidth: number;
  canvasContentX: number;
  canvasContentY: number;
  canvasGap: number;
  canvasGridUnitNumericAspectRatio: number;
  canvasLayoutHeight: number;
  canvasLayoutWidth: number;
  canvasLayoutX: number;
  canvasLayoutY: number;
  canvasPadding: number;
  hasSideRoom: boolean;
  isPortrait: boolean;
  layoutGap: number;
  layoutSideMin: number;
  layoutSideWidth: number;
  nameHeightMin: number;
  namePosition: LayoutNamePosition;
  regionBorder: number;
}

/** The numeric value of a camera ratio option, or of its default when the option is not a valid ratio */
const cameraNumericAspectRatio = (aspectRatio: AspectRatio, aspectRatioDefault: AspectRatio) =>
  transformAspectRatio(aspectRatio) || transformAspectRatio(aspectRatioDefault);

/** Each content ratio as a number, in the order of `CONTENT_ASPECT_RATIOS` */
export const numericContentAspectRatios = CONTENT_ASPECT_RATIOS.map(transformAspectRatio);
/** The widest content ratio, which sets how much of a grid cell a main column can need */
export const widestNumericContentAspectRatio = Math.max(...numericContentAspectRatios);

/**
 * Size the layout area, the content area and the grid that participants share, and the side column width.
 *
 * @param layoutOptions - Canvas options; missing fields take their defaults.
 * @param layoutConfigsTotal - Number of participants, which sets the grid size.
 * @returns The layout area inside the margins, and the content area, gaps, grid cell ratio, and side column width,
 *   all measured between region content rects. The side column is at least `layoutSideMin` wide; the rows narrow
 *   their main columns to fit it. Also the orientation, the side camera ratio limits, and the name settings.
 */
export const calculateCanvasGrid = (
  {
    canvasWidth = LAYOUT_OPTIONS_DEFAULT.canvasWidth,
    canvasHeight = LAYOUT_OPTIONS_DEFAULT.canvasHeight,
    orientation = LAYOUT_OPTIONS_DEFAULT.orientation,
    canvasMarginTop = LAYOUT_OPTIONS_DEFAULT.canvasMarginTop,
    canvasMarginBottom = LAYOUT_OPTIONS_DEFAULT.canvasMarginBottom,
    canvasMarginLeft = LAYOUT_OPTIONS_DEFAULT.canvasMarginLeft,
    canvasMarginRight = LAYOUT_OPTIONS_DEFAULT.canvasMarginRight,
    canvasPadding = LAYOUT_OPTIONS_DEFAULT.canvasPadding,
    canvasGap = LAYOUT_OPTIONS_DEFAULT.canvasGap,
    layoutGap = LAYOUT_OPTIONS_DEFAULT.layoutGap ?? canvasGap / 2,
    layoutSideMin = LAYOUT_OPTIONS_DEFAULT.layoutSideMin,
    regionBorder = LAYOUT_OPTIONS_DEFAULT.regionBorder,
    cameraAspectRatioMin = LAYOUT_OPTIONS_DEFAULT.cameraAspectRatioMin,
    cameraAspectRatioMax = LAYOUT_OPTIONS_DEFAULT.cameraAspectRatioMax,
    nameHeightMin = LAYOUT_OPTIONS_DEFAULT.nameHeightMin,
    namePosition = LAYOUT_OPTIONS_DEFAULT.namePosition,
  }: LayoutOptions,
  layoutConfigsTotal: number,
): CanvasGrid => {
  // The layout area is the canvas less the margins
  const canvasLayoutWidth = canvasWidth - canvasMarginLeft - canvasMarginRight;
  const canvasLayoutHeight = canvasHeight - canvasMarginTop - canvasMarginBottom;
  // Borders sit outside region content rects, so in content terms they inset the content area and widen the gaps
  const regionBorderTotal = regionBorder * 2;
  const canvasContentGap = canvasGap + regionBorderTotal;
  const layoutContentGap = layoutGap + regionBorderTotal;
  // The content area is the layout area less the padding and one border on each side
  const canvasContentWidth = canvasLayoutWidth - canvasPadding * 2 - regionBorderTotal;
  const canvasContentHeight = canvasLayoutHeight - canvasPadding * 2 - regionBorderTotal;
  // Split the content area into a square grid with a cell for every participant and a gap between cells
  const canvasGridUnits = Math.ceil(Math.sqrt(layoutConfigsTotal));
  const canvasGridUnitWidth = (canvasContentWidth - (canvasGridUnits - 1) * canvasContentGap) / canvasGridUnits;
  const canvasGridUnitHeight = (canvasContentHeight - (canvasGridUnits - 1) * canvasContentGap) / canvasGridUnits;
  // The side column gets whatever a cell has left after the widest content at full cell height and the column gap,
  // or the minimum when that is more, in which case the main columns narrow to make room
  const layoutSideWidth = Math.max(
    layoutSideMin,
    canvasGridUnitWidth - canvasGridUnitHeight * widestNumericContentAspectRatio - layoutContentGap,
  );

  return {
    cameraNumericAspectRatioMax: cameraNumericAspectRatio(
      cameraAspectRatioMax,
      LAYOUT_OPTIONS_DEFAULT.cameraAspectRatioMax,
    ),
    cameraNumericAspectRatioMin: cameraNumericAspectRatio(
      cameraAspectRatioMin,
      LAYOUT_OPTIONS_DEFAULT.cameraAspectRatioMin,
    ),
    canvasContentHeight,
    canvasContentWidth,
    canvasContentX: canvasMarginLeft + canvasPadding + regionBorder,
    canvasContentY: canvasMarginTop + canvasPadding + regionBorder,
    canvasGap: canvasContentGap,
    canvasGridUnitNumericAspectRatio: canvasGridUnitWidth / canvasGridUnitHeight,
    canvasLayoutHeight,
    canvasLayoutWidth,
    canvasLayoutX: canvasMarginLeft,
    canvasLayoutY: canvasMarginTop,
    canvasPadding,
    hasSideRoom: Math.round(layoutSideWidth) > 0,
    // Portrait is columns of main regions with side rows beneath them. Left to `'auto'`, or to an unknown value, a
    // content area taller than wide is laid out in portrait
    isPortrait: orientation === 'portrait' || (orientation !== 'landscape' && canvasContentHeight > canvasContentWidth),
    layoutGap: layoutContentGap,
    layoutSideMin,
    layoutSideWidth,
    nameHeightMin,
    namePosition,
    regionBorder,
  };
};

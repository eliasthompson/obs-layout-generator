import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

import { cameraNumericAspectRatioMin } from '@/lib/calculateCameraHeights';

export interface SideRowContext {
  columnWidth: number;
  layoutGap: number;
  regionBorder: number;
}

export interface CalculateSideRowSizesContext extends SideRowContext {
  cellHeight: number;
  sharedHeight: number;
}

export interface SideRowSizes {
  mainHeight: number;
  sideRowHeight: number;
  contentAuxWidth: number;
  contentAuxHeight: number;
  infoWidth: number;
  infoHeight: number;
  cameraWidth: number;
  cameraHeight: number;
  isCameraMainAttached: boolean;
}

/**
 * Whether a participant has anything for a side row beneath its main region: a camera, aux content, or ratio info.
 * `'auto'` info has no ratio to size it by in a row, so it is left out of portrait layouts.
 *
 * @param resolvedLayoutConfig - The participant's resolved config.
 * @returns `true` when a side row is needed.
 */
export const hasSideRow = ({
  hasSideCamera,
  hasSideInfo,
  sideContentAuxNumericAspectRatio,
  sideInfoNumericAspectRatio,
}: ResolvedLayoutConfig) =>
  hasSideCamera ||
  sideContentAuxNumericAspectRatio !== undefined ||
  (hasSideInfo && sideInfoNumericAspectRatio !== undefined);

/**
 * Whether a participant's side row shares the layout's row content height: it holds aux content or ratio info, not
 * just a camera.
 *
 * @param resolvedLayoutConfig - The participant's resolved config.
 * @returns `true` when the row is sized by the shared height.
 */
export const isSideRowShared = ({
  hasSideInfo,
  sideContentAuxNumericAspectRatio,
  sideInfoNumericAspectRatio,
}: ResolvedLayoutConfig) =>
  sideContentAuxNumericAspectRatio !== undefined || (hasSideInfo && sideInfoNumericAspectRatio !== undefined);

/**
 * The content height at which a shared side row exactly fills the column: aux content and info at their ratios, the
 * camera at the minimum ratio, and the gaps or shared borders between them. Regions attached to the main region are
 * taller by the gap they close, so their widths count that growth too.
 *
 * @param resolvedLayoutConfig - A participant whose side row is shared.
 * @param context - The column width, the gap between regions, and the region border.
 * @returns The fitting content height.
 */
export const fitSideRowHeight = (
  {
    hasSideCamera,
    hasSideInfo,
    isCameraAboveAttached,
    isCameraMainAttached,
    isContentAuxMainAttached,
    isInfoAboveAttached,
    isInfoMainAttached,
    sideContentAuxNumericAspectRatio,
    sideInfoNumericAspectRatio,
  }: ResolvedLayoutConfig,
  { columnWidth, layoutGap, regionBorder }: SideRowContext,
) => {
  const attachedGrowth = layoutGap - regionBorder;
  // Each region adds its ratio times the height to the row; the fixed part is the gaps and the attached growth
  let ratioTotal = 0;
  let fixedWidth = 0;

  if (sideContentAuxNumericAspectRatio !== undefined) {
    ratioTotal += sideContentAuxNumericAspectRatio;
    fixedWidth += sideContentAuxNumericAspectRatio * (isContentAuxMainAttached ? attachedGrowth : 0);
  }

  if (hasSideInfo && sideInfoNumericAspectRatio !== undefined) {
    // Info after aux content is a gap away, or one shared border when attached to it
    const gap = sideContentAuxNumericAspectRatio === undefined ? 0 : isInfoAboveAttached ? regionBorder : layoutGap;

    ratioTotal += sideInfoNumericAspectRatio;
    fixedWidth += gap + sideInfoNumericAspectRatio * (isInfoMainAttached ? attachedGrowth : 0);
  }

  if (hasSideCamera) {
    // A shared row always has a region before the camera, a gap or one shared border away
    ratioTotal += cameraNumericAspectRatioMin;
    fixedWidth +=
      (isCameraAboveAttached ? regionBorder : layoutGap) +
      cameraNumericAspectRatioMin * (isCameraMainAttached ? attachedGrowth : 0);
  }

  return (columnWidth - fixedWidth) / ratioTotal;
};

/**
 * Size one participant's main region and side row: aux content at the left, info next, and the camera at the right.
 * A lone camera fills the row; a row with aux content or ratio info uses the layout's shared content height, with
 * the camera taking the rest of the width.
 *
 * @param resolvedLayoutConfig - The participant's resolved config.
 * @param context - The cell height, column width, gap, border, and the shared row content height, `Infinity` when
 *   no row in the layout is shared.
 * @returns The main region height, the height the side row takes below its top, `0` when no side region is shown,
 *   each side region's size, `0` when the region is omitted, and whether the camera reaches the main region.
 */
export const calculateSideRowSizes = (
  resolvedLayoutConfig: ResolvedLayoutConfig,
  { cellHeight, columnWidth, layoutGap, regionBorder, sharedHeight }: CalculateSideRowSizesContext,
): SideRowSizes => {
  const {
    hasSideCamera,
    hasSideInfo,
    isCameraAboveAttached,
    isCameraMainAttached,
    isContentAuxMainAttached,
    isInfoAboveAttached,
    isInfoMainAttached,
    mainNumericAspectRatio,
    sideContentAuxNumericAspectRatio,
    sideInfoNumericAspectRatio,
  } = resolvedLayoutConfig;
  const attachedGrowth = layoutGap - regionBorder;
  const sizes: SideRowSizes = {
    mainHeight: mainNumericAspectRatio > 0 ? columnWidth / mainNumericAspectRatio : 0,
    sideRowHeight: 0,
    contentAuxWidth: 0,
    contentAuxHeight: 0,
    infoWidth: 0,
    infoHeight: 0,
    cameraWidth: 0,
    cameraHeight: 0,
    isCameraMainAttached: false,
  };

  if (!hasSideRow(resolvedLayoutConfig)) return sizes;

  // The row gets what the main region and the gap leave of the cell; a camera is never narrower than the minimum ratio
  const rowHeight = cellHeight - sizes.mainHeight - layoutGap;
  const cameraHeightMax = Math.min(columnWidth / cameraNumericAspectRatioMin, sharedHeight);

  if (!isSideRowShared(resolvedLayoutConfig)) {
    // A lone camera fills the row, reaching up to the main region when attached unless that makes it too tall
    const attachedHeight = rowHeight + attachedGrowth;
    const isAttached = isCameraMainAttached && attachedHeight <= cameraHeightMax;
    const cameraHeight = isAttached ? attachedHeight : Math.min(rowHeight, cameraHeightMax);

    if (Math.round(cameraHeight) > 0) {
      // An attached camera reaches above the row top, so the row itself is only the part below it
      sizes.sideRowHeight = isAttached ? rowHeight : cameraHeight;
      sizes.cameraWidth = columnWidth;
      sizes.cameraHeight = cameraHeight;
      sizes.isCameraMainAttached = isAttached;
    }

    return sizes;
  }

  if (Math.round(sharedHeight) <= 0) return sizes;

  // Shared rows all use the shared height; regions attached to the main region are taller by the gap they close
  sizes.sideRowHeight = sharedHeight;
  let usedWidth = 0;

  if (sideContentAuxNumericAspectRatio !== undefined) {
    sizes.contentAuxHeight = sharedHeight + (isContentAuxMainAttached ? attachedGrowth : 0);
    sizes.contentAuxWidth = sideContentAuxNumericAspectRatio * sizes.contentAuxHeight;
    usedWidth += sizes.contentAuxWidth;
  }

  if (hasSideInfo && sideInfoNumericAspectRatio !== undefined) {
    const gap = sideContentAuxNumericAspectRatio === undefined ? 0 : isInfoAboveAttached ? regionBorder : layoutGap;

    sizes.infoHeight = sharedHeight + (isInfoMainAttached ? attachedGrowth : 0);
    sizes.infoWidth = sideInfoNumericAspectRatio * sizes.infoHeight;
    usedWidth += gap + sizes.infoWidth;
  }

  if (hasSideCamera) {
    // The camera takes the rest of the row, which the shared height keeps at least the minimum ratio wide
    const cameraWidth = columnWidth - usedWidth - (isCameraAboveAttached ? regionBorder : layoutGap);

    if (Math.round(cameraWidth) > 0) {
      sizes.cameraWidth = cameraWidth;
      sizes.cameraHeight = sharedHeight + (isCameraMainAttached ? attachedGrowth : 0);
      sizes.isCameraMainAttached = isCameraMainAttached;
    }
  }

  return sizes;
};

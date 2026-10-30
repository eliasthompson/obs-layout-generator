import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

export interface SideRowGaps {
  layoutGap: number;
  regionBorder: number;
}

export interface SideRowContext extends SideRowGaps {
  cameraNumericAspectRatioMin: number;
  columnWidth: number;
}

export interface SideRowMeasure {
  ratioTotal: number;
  fixedWidth: number;
}

export interface SplitInfoRowContext extends SideRowGaps {
  cellHeight: number;
  columnWidth: number;
}

export interface InfoRow {
  infoRowHeight: number;
  infoWidth: number;
  infoHeight: number;
  rowResolvedLayoutConfig: ResolvedLayoutConfig;
  rowCellHeight: number;
}

export interface CalculateSideRowSizesContext extends SideRowContext {
  cameraNumericAspectRatioDefault: number;
  cameraNumericAspectRatioMax: number;
  cellHeight: number;
  isInfoRowSplit: boolean;
  sharedHeight: number;
}

export interface SideRowSizes {
  mainHeight: number;
  infoRowHeight: number;
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
 * `'auto'` info has no ratio to size it by in a row, so it only fills what a row of those regions leaves.
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
 * Whether a participant's ratio info can take a row of its own between the main region and a side row of its aux
 * content and camera. Only info wider than the widest camera, a strip such as a timer, can: squarer info across the
 * column would be taller than a camera row there, and the main region would shrink to make room for it. `'auto'` info
 * has no ratio to size a row by, and info alone already has the side row to itself.
 *
 * @param resolvedLayoutConfig - The participant's resolved config.
 * @param cameraNumericAspectRatioMax - The widest camera ratio.
 * @returns `true` when the info row can split from the side row.
 */
export const canSplitInfoRow = (
  { hasSideCamera, hasSideInfo, sideContentAuxNumericAspectRatio, sideInfoNumericAspectRatio }: ResolvedLayoutConfig,
  cameraNumericAspectRatioMax: number,
) =>
  hasSideInfo &&
  sideInfoNumericAspectRatio !== undefined &&
  sideInfoNumericAspectRatio > cameraNumericAspectRatioMax &&
  (hasSideCamera || sideContentAuxNumericAspectRatio !== undefined);

/**
 * Split ratio info into a row of its own beneath the main region: as wide as the column at its ratio, and no taller
 * than the cell leaves. The side row beneath it then sizes as the side row of a participant without the info in a
 * cell shorter by the info row and its gap, so attachments to the main region reach up to the info row instead.
 *
 * @param resolvedLayoutConfig - A participant whose info row can split.
 * @param context - The cell height, the column width, the gap between regions, and the region border.
 * @returns The height the info row takes below its top, the info size, and the config and cell height to size the
 *   side row beneath it by.
 */
export const splitInfoRow = (
  resolvedLayoutConfig: ResolvedLayoutConfig,
  { cellHeight, columnWidth, layoutGap, regionBorder }: SplitInfoRowContext,
): InfoRow => {
  const { isInfoMainAttached, mainNumericAspectRatio, sideInfoNumericAspectRatio = 0 } = resolvedLayoutConfig;
  // Info attached to the main region reaches up across the gap, so its row takes that much less below its top
  const infoGrowth = isInfoMainAttached ? layoutGap - regionBorder : 0;
  const infoHeight = Math.min(
    columnWidth / sideInfoNumericAspectRatio,
    cellHeight - columnWidth / mainNumericAspectRatio - layoutGap + infoGrowth,
  );
  const infoRowHeight = infoHeight - infoGrowth;

  return {
    infoRowHeight,
    infoWidth: sideInfoNumericAspectRatio * infoHeight,
    infoHeight,
    rowResolvedLayoutConfig: { ...resolvedLayoutConfig, hasSideInfo: false },
    rowCellHeight: cellHeight - infoRowHeight - layoutGap,
  };
};

/**
 * Measure a shared side row's width against its content height: at height `h` it is `ratioTotal * h + fixedWidth`
 * wide, with aux content and info at their ratios, the camera at the given ratio, and the gaps or shared borders
 * between them. Regions attached to the main region are taller by the gap they close, so their widths count that
 * growth too.
 *
 * @param resolvedLayoutConfig - A participant whose side row is shared.
 * @param gaps - The gap between regions and the region border.
 * @param cameraNumericAspectRatio - The camera's ratio in the row.
 * @returns The sum of the regions' ratios and the width that does not grow with the height.
 */
export const measureSideRow = (
  {
    hasSideCamera,
    hasSideInfo,
    isCameraPreviousAttached,
    isCameraMainAttached,
    isContentAuxMainAttached,
    isInfoPreviousAttached,
    isInfoMainAttached,
    sideContentAuxNumericAspectRatio,
    sideInfoNumericAspectRatio,
  }: ResolvedLayoutConfig,
  { layoutGap, regionBorder }: SideRowGaps,
  cameraNumericAspectRatio: number,
): SideRowMeasure => {
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
    const gap = sideContentAuxNumericAspectRatio === undefined ? 0 : isInfoPreviousAttached ? regionBorder : layoutGap;

    ratioTotal += sideInfoNumericAspectRatio;
    fixedWidth += gap + sideInfoNumericAspectRatio * (isInfoMainAttached ? attachedGrowth : 0);
  }

  if (hasSideCamera) {
    // A shared row always has a region before the camera, a gap or one shared border away
    ratioTotal += cameraNumericAspectRatio;
    fixedWidth +=
      (isCameraPreviousAttached ? regionBorder : layoutGap) +
      cameraNumericAspectRatio * (isCameraMainAttached ? attachedGrowth : 0);
  }

  return { ratioTotal, fixedWidth };
};

/**
 * The content height at which a shared side row exactly fills the column, with the camera at the minimum ratio.
 *
 * @param resolvedLayoutConfig - A participant whose side row is shared.
 * @param context - The narrowest camera ratio, the column width, the gap between regions, and the region border.
 * @returns The fitting content height.
 */
export const fitSideRowHeight = (resolvedLayoutConfig: ResolvedLayoutConfig, context: SideRowContext) => {
  const { ratioTotal, fixedWidth } = measureSideRow(resolvedLayoutConfig, context, context.cameraNumericAspectRatioMin);

  return (context.columnWidth - fixedWidth) / ratioTotal;
};

/**
 * Fit `'auto'` info into a sized side row, between the aux content and the camera: the camera narrows to its default
 * ratio, and the info takes the rest of the row's width at the row's height.
 *
 * @param resolvedLayoutConfig - The participant's resolved config.
 * @param sizes - The side row sized without the info, which this updates.
 * @param context - The default camera ratio, the column width, the gap between regions, and the region border.
 * @returns The sizes, with the info and the narrowed camera when the info rounds to some width and height.
 */
const fillAutoInfo = (
  {
    hasSideInfo,
    isCameraPreviousAttached,
    isInfoPreviousAttached,
    isInfoMainAttached,
    sideInfoNumericAspectRatio,
  }: ResolvedLayoutConfig,
  sizes: SideRowSizes,
  {
    cameraNumericAspectRatioDefault,
    columnWidth,
    layoutGap,
    regionBorder,
  }: Pick<
    CalculateSideRowSizesContext,
    'cameraNumericAspectRatioDefault' | 'columnWidth' | 'layoutGap' | 'regionBorder'
  >,
): SideRowSizes => {
  if (!hasSideInfo || sideInfoNumericAspectRatio !== undefined) return sizes;

  // Info starts after the aux content, a gap or one shared border away, and ends a gap or one shared border before the
  // camera at its default ratio
  const cameraWidth = cameraNumericAspectRatioDefault * sizes.cameraHeight;
  const infoStart = sizes.contentAuxWidth
    ? sizes.contentAuxWidth + (isInfoPreviousAttached ? regionBorder : layoutGap)
    : 0;
  const infoEnd = sizes.cameraWidth
    ? columnWidth - cameraWidth - (isCameraPreviousAttached ? regionBorder : layoutGap)
    : columnWidth;
  const infoWidth = infoEnd - infoStart;
  const infoHeight = sizes.sideRowHeight + (isInfoMainAttached ? layoutGap - regionBorder : 0);

  if (Math.round(infoWidth) <= 0 || Math.round(infoHeight) <= 0) return sizes;

  return {
    ...sizes,
    infoWidth,
    infoHeight,
    cameraWidth: sizes.cameraWidth && cameraWidth,
  };
};

/**
 * Size one participant's main region and side row: aux content at the left, info next, and the camera at the right.
 * A lone camera fills the row; a row with aux content or ratio info uses the layout's shared content height, with
 * the camera taking the rest of the width. A camera is never narrower than the minimum ratio or wider than the
 * maximum; the column width leaves every row tall enough for that, and a camera the shared height leaves too wide is
 * narrowed. `'auto'` info takes what the row leaves with the camera at its default ratio, and is omitted when that
 * leaves nothing. When the info row is split, ratio info wider than the widest camera, beside aux content or a camera,
 * takes a row of its own above the side row instead.
 *
 * @param resolvedLayoutConfig - The participant's resolved config.
 * @param context - The camera ratio default and limits, the cell height, column width, gap, border, whether ratio info
 *   takes a row of its own, and the shared row content height, `Infinity` when no row in the layout is shared.
 * @returns The main region height, the height the info row takes below its top, `0` when the info has no row of its
 *   own, the height the side row takes below its top, `0` when no side region is shown in it, each side region's size,
 *   `0` when the region is omitted, and whether the camera reaches the region above it.
 */
export const calculateSideRowSizes = (
  resolvedLayoutConfig: ResolvedLayoutConfig,
  context: CalculateSideRowSizesContext,
): SideRowSizes => {
  // Split, the side row sizes beneath the info row without the info, which is omitted when its row rounds to nothing
  if (context.isInfoRowSplit && canSplitInfoRow(resolvedLayoutConfig, context.cameraNumericAspectRatioMax)) {
    const { infoRowHeight, infoWidth, infoHeight, rowResolvedLayoutConfig, rowCellHeight } = splitInfoRow(
      resolvedLayoutConfig,
      context,
    );
    const rowSizes = calculateSideRowSizes(rowResolvedLayoutConfig, {
      ...context,
      cellHeight: rowCellHeight,
      isInfoRowSplit: false,
    });

    return Math.round(infoRowHeight) > 0 && Math.round(infoWidth) > 0
      ? { ...rowSizes, infoRowHeight, infoWidth, infoHeight }
      : rowSizes;
  }

  const {
    cameraNumericAspectRatioDefault,
    cameraNumericAspectRatioMax,
    cameraNumericAspectRatioMin,
    cellHeight,
    columnWidth,
    layoutGap,
    regionBorder,
    sharedHeight,
  } = context;
  const {
    hasSideCamera,
    hasSideInfo,
    isCameraPreviousAttached,
    isCameraMainAttached,
    isContentAuxMainAttached,
    isInfoPreviousAttached,
    isInfoMainAttached,
    mainNumericAspectRatio,
    mainNumericAspectRatioMin = mainNumericAspectRatio,
    sideContentAuxNumericAspectRatio,
    sideInfoNumericAspectRatio,
  } = resolvedLayoutConfig;
  const attachedGrowth = layoutGap - regionBorder;
  const sizes: SideRowSizes = {
    mainHeight: mainNumericAspectRatio > 0 ? columnWidth / mainNumericAspectRatio : 0,
    infoRowHeight: 0,
    sideRowHeight: 0,
    contentAuxWidth: 0,
    contentAuxHeight: 0,
    infoWidth: 0,
    infoHeight: 0,
    cameraWidth: 0,
    cameraHeight: 0,
    isCameraMainAttached: false,
  };

  if (!hasSideRow(resolvedLayoutConfig)) {
    // Alone in its cell, a main region that may grow taller, an 'auto' main camera, fills the cell down to its
    // narrowest ratio
    if (mainNumericAspectRatio > 0) {
      sizes.mainHeight = Math.max(sizes.mainHeight, Math.min(cellHeight, columnWidth / mainNumericAspectRatioMin));
    }

    return sizes;
  }

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
      sizes.cameraWidth = Math.min(columnWidth, cameraNumericAspectRatioMax * cameraHeight);
      sizes.cameraHeight = cameraHeight;
      sizes.isCameraMainAttached = isAttached;
    }

    return fillAutoInfo(resolvedLayoutConfig, sizes, {
      cameraNumericAspectRatioDefault,
      columnWidth,
      layoutGap,
      regionBorder,
    });
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
    const gap = sideContentAuxNumericAspectRatio === undefined ? 0 : isInfoPreviousAttached ? regionBorder : layoutGap;

    sizes.infoHeight = sharedHeight + (isInfoMainAttached ? attachedGrowth : 0);
    sizes.infoWidth = sideInfoNumericAspectRatio * sizes.infoHeight;
    usedWidth += gap + sizes.infoWidth;
  }

  if (hasSideCamera) {
    // The camera takes the rest of the row, which the shared height keeps at least the minimum ratio wide, up to the
    // maximum ratio
    const cameraHeight = sharedHeight + (isCameraMainAttached ? attachedGrowth : 0);
    const cameraWidth = Math.min(
      columnWidth - usedWidth - (isCameraPreviousAttached ? regionBorder : layoutGap),
      cameraNumericAspectRatioMax * cameraHeight,
    );

    if (Math.round(cameraWidth) > 0) {
      sizes.cameraWidth = cameraWidth;
      sizes.cameraHeight = cameraHeight;
      sizes.isCameraMainAttached = isCameraMainAttached;
    }
  }

  return fillAutoInfo(resolvedLayoutConfig, sizes, {
    cameraNumericAspectRatioDefault,
    columnWidth,
    layoutGap,
    regionBorder,
  });
};

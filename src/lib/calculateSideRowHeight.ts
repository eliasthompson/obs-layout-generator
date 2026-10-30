import type { SideRowContext } from '@/lib/calculateSideRowSizes';
import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

import { canSplitInfoRow, fitSideRowHeight, isSideRowShared, splitInfoRow } from '@/lib/calculateSideRowSizes';

export interface CalculateSideRowHeightContext extends SideRowContext {
  cameraNumericAspectRatioMax: number;
  cellHeight: number;
  isInfoRowSplit: boolean;
}

export interface SideRowHeight {
  sharedHeight: number;
}

/**
 * Size the side row content height shared by every row that holds aux content or ratio info.
 *
 * @param resolvedLayoutConfigs - Resolved configs for every participant.
 * @param context - The camera ratio limits, the cell height, column width, gap between regions, region border, and
 *   whether ratio info takes a row of its own.
 * @returns The shared row content height, `Infinity` when no row is shared.
 */
export const calculateSideRowHeight = (
  resolvedLayoutConfigs: ResolvedLayoutConfig[],
  context: CalculateSideRowHeightContext,
): SideRowHeight => {
  const { cameraNumericAspectRatioMax, cellHeight, columnWidth, isInfoRowSplit, layoutGap } = context;
  // Every shared row uses one height: the smallest of each row's leftover under its main region, that main region's
  // height, and the height at which the row exactly fills the column. Split, the row is the one beneath the info row,
  // without the info, in what the info row leaves of the cell
  const sharedHeights = resolvedLayoutConfigs.flatMap((resolvedLayoutConfig) => {
    const { rowResolvedLayoutConfig, rowCellHeight } =
      isInfoRowSplit && canSplitInfoRow(resolvedLayoutConfig, cameraNumericAspectRatioMax)
        ? splitInfoRow(resolvedLayoutConfig, context)
        : { rowResolvedLayoutConfig: resolvedLayoutConfig, rowCellHeight: cellHeight };

    if (!isSideRowShared(rowResolvedLayoutConfig)) return [];

    const mainHeight = columnWidth / rowResolvedLayoutConfig.mainNumericAspectRatio;

    return [
      Math.min(rowCellHeight - mainHeight - layoutGap, mainHeight, fitSideRowHeight(rowResolvedLayoutConfig, context)),
    ];
  });

  return { sharedHeight: sharedHeights.length ? Math.min(...sharedHeights) : Infinity };
};

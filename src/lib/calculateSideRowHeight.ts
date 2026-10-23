import type { SideRowContext } from '@/lib/calculateSideRowSizes';
import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

import { fitSideRowHeight, isSideRowShared } from '@/lib/calculateSideRowSizes';

export interface CalculateSideRowHeightContext extends SideRowContext {
  cellHeight: number;
}

export interface SideRowHeight {
  sharedHeight: number;
  nameHeightMax: number;
}

/**
 * Size the side row content height shared by every row that holds aux content or ratio info, and the largest name
 * tag: a third of a full side camera, which is half the cell at most and never narrower than the minimum ratio.
 *
 * @param resolvedLayoutConfigs - Resolved configs for every participant.
 * @param context - The narrowest camera ratio, the cell height, column width, gap between regions, and region border.
 * @returns The shared row content height, `Infinity` when no row is shared, and the name height cap.
 */
export const calculateSideRowHeight = (
  resolvedLayoutConfigs: ResolvedLayoutConfig[],
  context: CalculateSideRowHeightContext,
): SideRowHeight => {
  const { cameraNumericAspectRatioMin, cellHeight, columnWidth, layoutGap } = context;
  // Every shared row uses one height: the smallest of each row's leftover under its main region, that main region's
  // height, and the height at which the row exactly fills the column
  const sharedHeights = resolvedLayoutConfigs.flatMap((resolvedLayoutConfig) => {
    if (!isSideRowShared(resolvedLayoutConfig)) return [];

    const mainHeight = columnWidth / resolvedLayoutConfig.mainNumericAspectRatio;

    return [Math.min(cellHeight - mainHeight - layoutGap, mainHeight, fitSideRowHeight(resolvedLayoutConfig, context))];
  });
  const sharedHeight = sharedHeights.length ? Math.min(...sharedHeights) : Infinity;
  // A full side camera is at most half the cell less the gap, and never narrower than the minimum ratio
  const cameraHeightMax = Math.max(
    0,
    Math.min((cellHeight - layoutGap) / 2, columnWidth / cameraNumericAspectRatioMin),
  );

  return { sharedHeight, nameHeightMax: cameraHeightMax / 3 };
};

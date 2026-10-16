import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

export interface CalculateRowHeightContext {
  canvasContentHeight: number;
  canvasContentWidth: number;
  canvasGap: number;
}

/**
 * Find the tallest row height at which every row fits the content area.
 *
 * @param resolvedRows - Resolved configs grouped into rows.
 * @param context - Content area size and the gap between participants.
 * @returns The row height shared by every row: the height that splits the content height evenly, reduced until the
 *   widest row also fits the content width.
 */
export const calculateRowHeight = (
  resolvedRows: ResolvedLayoutConfig[][],
  { canvasContentHeight, canvasContentWidth, canvasGap }: CalculateRowHeightContext,
) =>
  Math.min(
    // The height at which the rows and the gaps between them exactly fill the content height
    (canvasContentHeight + canvasGap) / resolvedRows.length - canvasGap,
    // For each row, the height at which its main columns, side columns, and gaps exactly fill the content width
    ...resolvedRows.map((rowResolvedLayoutConfigs) => {
      // Main column widths scale with the row height, so sum their ratios; side widths and gaps are fixed
      const mainNumericAspectRatio = rowResolvedLayoutConfigs.reduce(
        (acc, resolvedLayoutConfig) => acc + resolvedLayoutConfig.mainNumericAspectRatio,
        0,
      );
      const sideWidthTotal = rowResolvedLayoutConfigs.reduce(
        (acc, resolvedLayoutConfig) => acc + resolvedLayoutConfig.sideWidthTotal,
        0,
      );

      // A row with no main columns puts no limit on the height
      return mainNumericAspectRatio > 0
        ? (canvasContentWidth - (rowResolvedLayoutConfigs.length - 1) * canvasGap - sideWidthTotal) /
            mainNumericAspectRatio
        : Infinity;
    }),
  );

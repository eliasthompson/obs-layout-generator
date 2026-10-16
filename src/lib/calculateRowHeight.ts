import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

export interface CalculateRowHeightContext {
  canvasContentHeight: number;
  canvasContentWidth: number;
  canvasGap: number;
}

// The tallest row height at which the rows share the content height and every row fits the content width
export const calculateRowHeight = (
  resolvedRows: ResolvedLayoutConfig[][],
  { canvasContentHeight, canvasContentWidth, canvasGap }: CalculateRowHeightContext,
) =>
  Math.min(
    (canvasContentHeight + canvasGap) / resolvedRows.length - canvasGap,
    ...resolvedRows.map((rowResolvedLayoutConfigs) => {
      const mainNumericAspectRatio = rowResolvedLayoutConfigs.reduce(
        (acc, resolvedLayoutConfig) => acc + resolvedLayoutConfig.mainNumericAspectRatio,
        0,
      );
      const sideWidthTotal = rowResolvedLayoutConfigs.reduce(
        (acc, resolvedLayoutConfig) => acc + resolvedLayoutConfig.sideWidthTotal,
        0,
      );

      return mainNumericAspectRatio > 0
        ? (canvasContentWidth - (rowResolvedLayoutConfigs.length - 1) * canvasGap - sideWidthTotal) /
            mainNumericAspectRatio
        : Infinity;
    }),
  );

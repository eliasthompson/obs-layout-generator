import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

import { canSplitInfoRow, hasSideRow, isSideRowShared, measureSideRow } from '@/lib/calculateSideRowSizes';

export interface CalculateColumnWidthContext {
  cameraNumericAspectRatioMax: number;
  canvasContentHeight: number;
  canvasContentWidth: number;
  canvasGap: number;
  isInfoRowSplit: boolean;
  layoutGap: number;
  layoutSideMin: number;
  regionBorder: number;
}

export interface ColumnSizes {
  cellHeight: number;
  columnWidth: number;
}

/**
 * Find the widest column width at which every participant's main region fits its cell with room for its side row.
 *
 * @param resolvedColumns - Resolved configs grouped into columns.
 * @param context - The widest camera ratio, content area size, the gap between participants, whether ratio info takes
 *   a row of its own, the gap between a main region and its side row, the smallest side row height, and the region
 *   border.
 * @returns The cell height shared by every cell, set by the fullest column, and the column width shared by every
 *   column: the even split, narrowed until each main region, and its info row when split, leaves its side row at
 *   least the minimum height, and tall enough that its camera is no wider than the maximum ratio.
 */
export const calculateColumnWidth = (
  resolvedColumns: ResolvedLayoutConfig[][],
  {
    cameraNumericAspectRatioMax,
    canvasContentHeight,
    canvasContentWidth,
    canvasGap,
    isInfoRowSplit,
    layoutGap,
    layoutSideMin,
    regionBorder,
  }: CalculateColumnWidthContext,
): ColumnSizes => {
  // Cells share one height so cameras match across columns and a sparse column centers its cells
  const cellsPerColumnMax = Math.max(...resolvedColumns.map((column) => column.length));
  const cellHeight = (canvasContentHeight + canvasGap) / cellsPerColumnMax - canvasGap;
  // What the main region and its side row share of a cell
  const rowRoom = cellHeight - layoutGap;
  // A main region's height follows from the column width, so each one caps the width by what its cell can hold
  const columnWidth = Math.min(
    (canvasContentWidth + canvasGap) / resolvedColumns.length - canvasGap,
    ...resolvedColumns.flat().map((resolvedLayoutConfig) => {
      const {
        hasSideCamera,
        isInfoMainAttached,
        mainNumericAspectRatio,
        sideInfoNumericAspectRatio = 0,
      } = resolvedLayoutConfig;

      if (mainNumericAspectRatio <= 0) return Infinity;
      if (!hasSideRow(resolvedLayoutConfig)) return mainNumericAspectRatio * cellHeight;

      // Split, the info row stacks beneath the main region, so per unit of width the two are 1 / mainRatio +
      // 1 / infoRatio tall, and the info row's gap, less what info attached to the main region closes, leaves the
      // side row less room
      const isSplit = isInfoRowSplit && canSplitInfoRow(resolvedLayoutConfig, cameraNumericAspectRatioMax);
      const rowResolvedLayoutConfig = isSplit ? { ...resolvedLayoutConfig, hasSideInfo: false } : resolvedLayoutConfig;
      const aboveHeightPerWidth = 1 / mainNumericAspectRatio + (isSplit ? 1 / sideInfoNumericAspectRatio : 0);
      const sideRowRoom = isSplit ? rowRoom - (isInfoMainAttached ? regionBorder : layoutGap) : rowRoom;
      const sideRowWidths = [(sideRowRoom - layoutSideMin) / aboveHeightPerWidth];

      if (hasSideCamera) {
        // At content height h the row is ratioTotal * h + fixedWidth wide, with the camera at the widest ratio; a lone
        // camera is the whole row. The row must reach that height under the main region and any info row, so the
        // width W satisfies sideRowRoom >= W * aboveHeightPerWidth + (W - fixedWidth) / ratioTotal
        const { ratioTotal, fixedWidth } = isSideRowShared(rowResolvedLayoutConfig)
          ? measureSideRow(rowResolvedLayoutConfig, { layoutGap, regionBorder }, cameraNumericAspectRatioMax)
          : { ratioTotal: cameraNumericAspectRatioMax, fixedWidth: 0 };

        sideRowWidths.push((sideRowRoom + fixedWidth / ratioTotal) / (aboveHeightPerWidth + 1 / ratioTotal));
      }

      return Math.min(...sideRowWidths);
    }),
  );

  return { cellHeight, columnWidth };
};

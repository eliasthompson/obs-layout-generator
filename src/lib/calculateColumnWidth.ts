import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

import { hasSideRow } from '@/lib/calculateSideRowSizes';

export interface CalculateColumnWidthContext {
  canvasContentHeight: number;
  canvasContentWidth: number;
  canvasGap: number;
  layoutGap: number;
  layoutSideMin: number;
}

export interface ColumnSizes {
  cellHeight: number;
  columnWidth: number;
}

/**
 * Find the widest column width at which every participant's main region fits its cell with room for its side row.
 *
 * @param resolvedColumns - Resolved configs grouped into columns.
 * @param context - Content area size, the gap between participants, the gap between a main region and its side row,
 *   and the smallest side row height.
 * @returns The cell height shared by every cell, set by the fullest column, and the column width shared by every
 *   column: the even split, narrowed until each main region leaves its side row at least the minimum height.
 */
export const calculateColumnWidth = (
  resolvedColumns: ResolvedLayoutConfig[][],
  { canvasContentHeight, canvasContentWidth, canvasGap, layoutGap, layoutSideMin }: CalculateColumnWidthContext,
): ColumnSizes => {
  // Cells share one height so cameras match across columns and a sparse column centers its cells
  const cellsPerColumnMax = Math.max(...resolvedColumns.map((column) => column.length));
  const cellHeight = (canvasContentHeight + canvasGap) / cellsPerColumnMax - canvasGap;
  // A main region's height follows from the column width, so each one caps the width by what its cell can hold
  const columnWidth = Math.min(
    (canvasContentWidth + canvasGap) / resolvedColumns.length - canvasGap,
    ...resolvedColumns.flat().map((resolvedLayoutConfig) => {
      const { mainNumericAspectRatio } = resolvedLayoutConfig;
      const sideRowReserve = hasSideRow(resolvedLayoutConfig) ? layoutGap + layoutSideMin : 0;

      return mainNumericAspectRatio > 0 ? mainNumericAspectRatio * (cellHeight - sideRowReserve) : Infinity;
    }),
  );

  return { cellHeight, columnWidth };
};

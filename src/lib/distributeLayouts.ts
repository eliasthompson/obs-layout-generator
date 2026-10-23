import type { LayoutConfig } from '@/constants/layoutConfig';

/**
 * Split layout configs into balanced rows.
 *
 * @param layoutConfigs - One config per participant, in display order.
 * @param rowsTotal - How many rows to split them into, at least one and at most one per config. Left out, 1-2 configs
 *   give one row, 3-6 two, 7-12 three, and so on.
 * @returns Rows of configs, in order; the first rows take any extra configs.
 */
export const distributeLayouts = (layoutConfigs: LayoutConfig[], rowsTotal?: number): LayoutConfig[][] => {
  const layoutConfigsTotal = layoutConfigs.length;

  if (!layoutConfigsTotal) return [];

  // Use the given number of rows, or the fewest rows R such that R * (R + 1) holds every config: 1-2 -> 1 row,
  // 3-6 -> 2, 7-12 -> 3, 13-20 -> 4
  let numRows = 1;

  if (rowsTotal === undefined) {
    while (numRows * (numRows + 1) < layoutConfigsTotal) {
      numRows += 1;
    }
  } else {
    numRows = Math.min(Math.max(1, Math.floor(rowsTotal)), layoutConfigsTotal);
  }

  // Start every row at the same size and count how many configs are left over
  const baseSize = Math.floor(layoutConfigsTotal / numRows);
  const extra = layoutConfigsTotal % numRows;
  const rowSizes = new Array<number>(numRows).fill(baseSize);

  // Give the leftover configs to the first rows, one each, so the earlier rows are the fuller ones
  for (let rowSizeIndex = 0; rowSizeIndex < extra; rowSizeIndex += 1) {
    rowSizes[rowSizeIndex] += 1;
  }

  // Slice the configs into rows of those sizes, keeping input order
  const result: LayoutConfig[][] = [];
  let offset = 0;

  for (const rowSize of rowSizes) {
    result.push(layoutConfigs.slice(offset, offset + rowSize));
    offset += rowSize;
  }

  return result;
};

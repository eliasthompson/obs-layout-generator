import type { LayoutConfig } from '@/constants/layoutConfig';

export const distributeLayouts = (layoutConfigs: LayoutConfig[]): LayoutConfig[][] => {
  const layoutConfigsTotal = layoutConfigs.length;

  if (!layoutConfigsTotal) return [];

  // 1. Determine the number of rows (R)
  // Pattern: 1-2 layoutConfigs -> 1 row; 3-6 -> 2; 7-12 -> 3; 13-20 -> 4
  // Formula: R(R+1) >= layoutConfigsTotal
  let numRows = 1;

  while (numRows * (numRows + 1) < layoutConfigsTotal) {
    numRows += 1;
  }

  // 2. Initial Row Sizes (Base Math)
  const baseSize = Math.floor(layoutConfigsTotal / numRows);
  const extra = layoutConfigsTotal % numRows;
  const rowSizes = new Array<number>(numRows).fill(baseSize);

  // 3. Distribute extras top-down (first rows get the extra layoutConfigs)
  for (let rowSizeIndex = 0; rowSizeIndex < extra; rowSizeIndex += 1) {
    rowSizes[rowSizeIndex] += 1;
  }

  // 4. Map back to layoutConfigs
  const result: LayoutConfig[][] = [];
  let offset = 0;

  for (const rowSize of rowSizes) {
    result.push(layoutConfigs.slice(offset, offset + rowSize));
    offset += rowSize;
  }

  return result;
};

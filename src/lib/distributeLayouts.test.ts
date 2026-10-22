import { describe, expect, it } from 'vitest';

import type { LayoutConfig } from '@/constants/layoutConfig';

import { distributeLayouts } from '@/lib/distributeLayouts';

const createLayoutConfigs = (total: number): LayoutConfig[] =>
  Array.from({ length: total }, (_, index) => ({ hasName: index % 2 === 0 }));

describe('distributeLayouts', () => {
  it('returns no rows for no layout configs', () => {
    expect(distributeLayouts([])).toEqual([]);
  });

  it.each([
    [1, [1]],
    [2, [2]],
    [3, [2, 1]],
    [4, [2, 2]],
    [5, [3, 2]],
    [6, [3, 3]],
    [7, [3, 2, 2]],
    [8, [3, 3, 2]],
    [12, [4, 4, 4]],
    [13, [4, 3, 3, 3]],
    [20, [5, 5, 5, 5]],
  ])('splits %i layout configs into rows of %j', (total, rowSizes) => {
    expect(distributeLayouts(createLayoutConfigs(total)).map((row) => row.length)).toEqual(rowSizes);
  });

  it.each([
    [2, 1, [2]],
    [2, 2, [1, 1]],
    [3, 2, [2, 1]],
    [5, 3, [2, 2, 1]],
    [3, 5, [1, 1, 1]],
    [3, 0, [3]],
  ])('splits %i layout configs into %i rows of %j when the count is given', (total, rowsTotal, rowSizes) => {
    expect(distributeLayouts(createLayoutConfigs(total), rowsTotal).map((row) => row.length)).toEqual(rowSizes);
  });

  it('keeps layout configs in their original order', () => {
    const layoutConfigs = createLayoutConfigs(9);
    const rows = distributeLayouts(layoutConfigs);

    expect(rows.flat()).toHaveLength(layoutConfigs.length);
    rows.flat().forEach((layoutConfig, index) => {
      expect(layoutConfig).toBe(layoutConfigs[index]);
    });
  });
});

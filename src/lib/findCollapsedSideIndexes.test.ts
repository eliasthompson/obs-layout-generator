import { describe, expect, it } from 'vitest';

import type { SideRegionHeights } from '@/lib/calculateSideRegionHeights';
import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

import { findCollapsedSideIndexes } from '@/lib/findCollapsedSideIndexes';

const createResolvedLayoutConfig = (sideWidthTotal: number): ResolvedLayoutConfig => ({
  hasName: false,
  hasSideCamera: true,
  hasSideInfo: false,
  mainNumericAspectRatio: 16 / 9,
  sideWidthTotal,
});

const noSideRegionHeights: SideRegionHeights = { contentAuxHeight: 0, infoHeight: 0, showSideCamera: false };

describe('findCollapsedSideIndexes', () => {
  it('finds reserved side columns with no side regions left', () => {
    expect(
      findCollapsedSideIndexes(
        [
          createResolvedLayoutConfig(210),
          createResolvedLayoutConfig(210),
          createResolvedLayoutConfig(210),
          createResolvedLayoutConfig(210),
          createResolvedLayoutConfig(0),
          createResolvedLayoutConfig(210),
        ],
        [
          noSideRegionHeights,
          { ...noSideRegionHeights, showSideCamera: true },
          { ...noSideRegionHeights, contentAuxHeight: 150 },
          { ...noSideRegionHeights, infoHeight: 80 },
          noSideRegionHeights,
          noSideRegionHeights,
        ],
      ),
    ).toEqual([0, 5]);
  });

  it('finds nothing when every side column has a region', () => {
    expect(
      findCollapsedSideIndexes([createResolvedLayoutConfig(210)], [{ ...noSideRegionHeights, showSideCamera: true }]),
    ).toEqual([]);
  });
});

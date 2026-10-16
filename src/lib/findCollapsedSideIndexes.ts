import type { SideRegionHeights } from '@/lib/calculateSideRegionHeights';
import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

// Indexes of layout configs that reserved a side column but have no side regions left to show in it
export const findCollapsedSideIndexes = (
  resolvedLayoutConfigs: ResolvedLayoutConfig[],
  sideRegionHeights: SideRegionHeights[],
) =>
  resolvedLayoutConfigs.flatMap(({ sideWidthTotal }, index) => {
    const { contentAuxHeight, infoHeight, showSideCamera } = sideRegionHeights[index];

    return sideWidthTotal > 0 && !showSideCamera && !contentAuxHeight && !infoHeight ? [index] : [];
  });

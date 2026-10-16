import type { SideRegionHeights } from '@/lib/calculateSideRegionHeights';
import type { ResolvedLayoutConfig } from '@/lib/resolveLayoutConfig';

/**
 * Find the layout configs that reserved a side column but have nothing left to show in it.
 *
 * @param resolvedLayoutConfigs - Resolved configs for every participant, in layout order.
 * @param sideRegionHeights - Side column heights for the same participants, in the same order.
 * @returns Indexes into `resolvedLayoutConfigs` whose side column should be dropped.
 */
export const findCollapsedSideIndexes = (
  resolvedLayoutConfigs: ResolvedLayoutConfig[],
  sideRegionHeights: SideRegionHeights[],
) =>
  resolvedLayoutConfigs.flatMap(({ sideWidthTotal }, index) => {
    const { contentAuxHeight, infoHeight, showSideCamera } = sideRegionHeights[index];

    // Collapsed means a side column was reserved (width > 0) but the camera, aux content, and info were all omitted
    return sideWidthTotal > 0 && !showSideCamera && !contentAuxHeight && !infoHeight ? [index] : [];
  });

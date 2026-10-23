import type { LayoutOptions } from '@/constants/layoutOptions';
import type { LayoutMetric } from '@/types/LayoutMetric';

import { LAYOUT_CONFIG_DEFAULT, type LayoutConfig } from '@/constants/layoutConfig';
import { calculateCanvasGrid } from '@/lib/calculateCanvasGrid';
import { generateLandscapeLayout } from '@/lib/generateLandscapeLayout';
import { generatePortraitLayout } from '@/lib/generatePortraitLayout';

/**
 * Lay out every participant on the canvas.
 *
 * @param layoutConfigs - One config per participant, in display order. Defaults to a single default participant.
 * @param layoutOptions - Canvas options; missing fields take their defaults.
 * @returns One layout metric per participant, in input order, with every region rounded to whole pixels.
 */
export const generateLayout = (
  layoutConfigs: LayoutConfig[] = [LAYOUT_CONFIG_DEFAULT],
  layoutOptions: LayoutOptions = {},
): LayoutMetric[] => {
  if (!layoutConfigs.length) return [];

  // Size the canvas grid, then lay out by orientation: portrait gets columns of main regions with side rows beneath
  // them, landscape gets rows of main columns with side columns beside them
  const canvasGrid = calculateCanvasGrid(layoutOptions, layoutConfigs.length);

  return canvasGrid.isPortrait
    ? generatePortraitLayout(layoutConfigs, canvasGrid)
    : generateLandscapeLayout(layoutConfigs, canvasGrid);
};

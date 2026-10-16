import type { LayoutMetric } from '@/types/LayoutMetric';

import { roundLayoutRegion } from '@/lib/roundLayoutRegion';

/** Region keys in the order they appear on a layout metric */
const layoutMetricRegions = [
  'camera',
  'contentMain',
  'contentAux',
  'info',
  'name',
] as const satisfies readonly (keyof LayoutMetric)[];

/**
 * Round every region of a layout metric to whole pixels.
 *
 * @param layoutMetric - Layout metric with fractional regions.
 * @returns A new layout metric with the same regions rounded, in the canonical region order.
 */
export const roundLayoutMetric = (layoutMetric: LayoutMetric) => {
  const roundedLayoutMetric: LayoutMetric = {};

  // Copy regions in canonical order so the output key order does not depend on how the metric was built
  layoutMetricRegions.forEach((region) => {
    const layoutRegion = layoutMetric[region];
    if (layoutRegion) roundedLayoutMetric[region] = roundLayoutRegion(layoutRegion);
  });

  return roundedLayoutMetric;
};

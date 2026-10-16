import type { LayoutMetric } from '@/types/LayoutMetric';

import { roundLayoutRegion } from '@/lib/roundLayoutRegion';

const layoutMetricRegions = [
  'camera',
  'contentMain',
  'contentAux',
  'info',
  'name',
] as const satisfies readonly (keyof LayoutMetric)[];

// Round every region of a layout metric to whole pixels, keeping the region order
export const roundLayoutMetric = (layoutMetric: LayoutMetric) => {
  const roundedLayoutMetric: LayoutMetric = {};

  layoutMetricRegions.forEach((region) => {
    const layoutRegion = layoutMetric[region];
    if (layoutRegion) roundedLayoutMetric[region] = roundLayoutRegion(layoutRegion);
  });

  return roundedLayoutMetric;
};

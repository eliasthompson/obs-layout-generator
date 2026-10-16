import type { LayoutMetric } from '@/types/LayoutMetric';

import { roundLayoutMetricItem } from '@/lib/roundLayoutMetricItem';

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
    const layoutMetricItem = layoutMetric[region];
    if (layoutMetricItem) roundedLayoutMetric[region] = roundLayoutMetricItem(layoutMetricItem);
  });

  return roundedLayoutMetric;
};

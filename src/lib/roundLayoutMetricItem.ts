import type { LayoutMetricItem } from '@/types/LayoutMetric';

export const roundLayoutMetricItem = ({ x, y, width, height }: LayoutMetricItem): LayoutMetricItem => ({
  x: Math.round(x),
  y: Math.round(y),
  width: Math.round(width),
  height: Math.round(height),
});

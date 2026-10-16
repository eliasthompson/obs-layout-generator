import type { LayoutRegion } from '@/types/LayoutMetric';

export const roundLayoutRegion = ({ x, y, width, height }: LayoutRegion): LayoutRegion => ({
  x: Math.round(x),
  y: Math.round(y),
  width: Math.round(width),
  height: Math.round(height),
});

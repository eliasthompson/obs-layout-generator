import type { LayoutRegion } from '@/types/LayoutMetric';

/**
 * Round a region's position and size to whole pixels.
 *
 * @param layoutRegion - Region with fractional values.
 * @returns A new region with each value passed through `Math.round` and the same border flag.
 */
export const roundLayoutRegion = ({ x, y, width, height, hasBorder }: LayoutRegion): LayoutRegion => ({
  x: Math.round(x),
  y: Math.round(y),
  width: Math.round(width),
  height: Math.round(height),
  hasBorder,
});

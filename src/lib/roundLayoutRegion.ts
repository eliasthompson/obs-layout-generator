import type { LayoutRegion } from '@/types/LayoutMetric';

/**
 * Round a region's edges to whole pixels. Rounding the edges rather than the size keeps two regions that meet, such as
 * attached regions sharing a border, meeting after rounding.
 *
 * @param layoutRegion - Region with fractional values.
 * @returns A new region whose left and top edges are rounded, whose size reaches the rounded right and bottom edges,
 *   and with the same border flag.
 */
export const roundLayoutRegion = ({ x, y, width, height, hasBorder }: LayoutRegion): LayoutRegion => {
  const left = Math.round(x);
  const top = Math.round(y);

  return { x: left, y: top, width: Math.round(x + width) - left, height: Math.round(y + height) - top, hasBorder };
};

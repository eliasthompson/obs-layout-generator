import type { LayoutRegion } from '@/types/LayoutMetric';
import type { LayoutNeighbor, LayoutNeighbors } from '@/types/LayoutNeighbor';

export interface ExpandGreenScreenCameraContext {
  canvasGap: number;
  canvasLayoutHeight: number;
  canvasLayoutWidth: number;
  canvasLayoutX: number;
  canvasLayoutY: number;
  layoutGap: number;
  neighbors: LayoutNeighbors;
  regionBorder: number;
}

/**
 * Expand a green screen camera over its own border and the space around it. An edge that faces another region of
 * the participant reaches that region's border box across the layout gap. An edge that faces another participant or
 * row reaches halfway across the canvas gap, so two green screen cameras facing each other meet without overlapping.
 * An edge that faces neither runs to the margin.
 *
 * @param camera - The camera as positioned with a border, before rounding.
 * @param context - The content gaps and region border, the layout area inside the margins, and what each edge faces.
 * @returns The expanded camera, without a border.
 */
export const expandGreenScreenCamera = (
  { x, y, width, height }: LayoutRegion,
  {
    canvasGap,
    canvasLayoutHeight,
    canvasLayoutWidth,
    canvasLayoutX,
    canvasLayoutY,
    layoutGap,
    neighbors,
    regionBorder,
  }: ExpandGreenScreenCameraContext,
): LayoutRegion => {
  // Content gaps include a border on each side. Across the layout gap the camera drops its own border and stops at
  // the neighbor's, so it reaches the gap less one border; across the canvas gap it reaches the middle
  const reach = (neighbor: LayoutNeighbor) => (neighbor === 'canvas' ? canvasGap / 2 : layoutGap - regionBorder);
  const left = neighbors.left === 'margin' ? canvasLayoutX : x - reach(neighbors.left);
  const top = neighbors.top === 'margin' ? canvasLayoutY : y - reach(neighbors.top);
  const right = neighbors.right === 'margin' ? canvasLayoutX + canvasLayoutWidth : x + width + reach(neighbors.right);
  const bottom =
    neighbors.bottom === 'margin' ? canvasLayoutY + canvasLayoutHeight : y + height + reach(neighbors.bottom);

  return { x: left, y: top, width: right - left, height: bottom - top, hasBorder: false };
};

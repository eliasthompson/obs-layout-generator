import type { LayoutRegion } from '@/types/LayoutMetric';
import type { LayoutNeighbor, LayoutNeighbors } from '@/types/LayoutNeighbor';

/**
 * What an edge on the outside of a participant faces: the margin at the edge of the layout, else another participant.
 *
 * @param isAtLayoutEdge - Whether the participant is the first or last along that edge.
 * @returns The neighbor for that edge.
 */
export const outerNeighbor = (isAtLayoutEdge: boolean): LayoutNeighbor => (isAtLayoutEdge ? 'margin' : 'canvas');

export interface ExpandGreenScreenCameraContext {
  canvasGap: number;
  canvasLayoutHeight: number;
  canvasLayoutWidth: number;
  canvasLayoutX: number;
  canvasLayoutY: number;
  canvasPadding: number;
  layoutGap: number;
  neighbors: LayoutNeighbors;
  regionBorder: number;
}

/**
 * Expand a green screen camera over its own border and the space around it. An edge that faces another region of
 * the participant reaches that region's border box across the layout gap. An edge that faces another participant or
 * row reaches halfway across the canvas gap, so two green screen cameras facing each other meet without overlapping.
 * An edge that faces neither runs through its border and the padding, reaching the margin when the camera is at the
 * edge of the layout and stopping short of it when a short row or column leaves room between them.
 *
 * @param camera - The camera as positioned with a border, before rounding.
 * @param context - The content gaps, padding, and region border, the layout area inside the margins, and what each
 *   edge faces.
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
    canvasPadding,
    layoutGap,
    neighbors,
    regionBorder,
  }: ExpandGreenScreenCameraContext,
): LayoutRegion => {
  // Content gaps include a border on each side. Across the layout gap the camera drops its own border and stops at
  // the neighbor's, so it reaches the gap less one border; across the canvas gap it reaches the middle; toward the
  // margin it reaches its border and the padding, never past the margin
  const reach = (neighbor: LayoutNeighbor) => (neighbor === 'canvas' ? canvasGap / 2 : layoutGap - regionBorder);
  const outerReach = regionBorder + canvasPadding;
  const left = neighbors.left === 'margin' ? Math.max(canvasLayoutX, x - outerReach) : x - reach(neighbors.left);
  const top = neighbors.top === 'margin' ? Math.max(canvasLayoutY, y - outerReach) : y - reach(neighbors.top);
  const right =
    neighbors.right === 'margin'
      ? Math.min(canvasLayoutX + canvasLayoutWidth, x + width + outerReach)
      : x + width + reach(neighbors.right);
  const bottom =
    neighbors.bottom === 'margin'
      ? Math.min(canvasLayoutY + canvasLayoutHeight, y + height + outerReach)
      : y + height + reach(neighbors.bottom);

  return { x: left, y: top, width: right - left, height: bottom - top, hasBorder: false };
};

/** What a region's edge faces: another region of the same participant, another participant or row, or the margin */
export type LayoutNeighbor = 'canvas' | 'layout' | 'margin';

export interface LayoutNeighbors {
  left: LayoutNeighbor;
  top: LayoutNeighbor;
  right: LayoutNeighbor;
  bottom: LayoutNeighbor;
}

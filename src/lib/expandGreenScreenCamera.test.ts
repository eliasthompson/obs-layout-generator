import { describe, expect, it } from 'vitest';

import type { LayoutRegion } from '@/types/LayoutMetric';
import type { LayoutNeighbors } from '@/types/LayoutNeighbor';

import { expandGreenScreenCamera, type ExpandGreenScreenCameraContext } from '@/lib/expandGreenScreenCamera';

const camera: LayoutRegion = { x: 500, y: 300, width: 200, height: 100, hasBorder: true };
const neighbors: LayoutNeighbors = { left: 'layout', top: 'layout', right: 'margin', bottom: 'margin' };
const context: ExpandGreenScreenCameraContext = {
  canvasGap: 50,
  canvasLayoutHeight: 600,
  canvasLayoutWidth: 1000,
  canvasLayoutX: 100,
  canvasLayoutY: 50,
  layoutGap: 25,
  neighbors,
  regionBorder: 5,
};

describe('expandGreenScreenCamera', () => {
  it('reaches across the layout gap to the border of the regions it faces, dropping its own border', () => {
    expect(
      expandGreenScreenCamera(camera, {
        ...context,
        neighbors: { left: 'layout', top: 'layout', right: 'layout', bottom: 'layout' },
      }),
    ).toEqual({ x: 480, y: 280, width: 240, height: 140, hasBorder: false });
  });

  it('reaches halfway across the canvas gap toward the participants and rows it faces', () => {
    expect(
      expandGreenScreenCamera(camera, {
        ...context,
        neighbors: { left: 'canvas', top: 'canvas', right: 'canvas', bottom: 'canvas' },
      }),
    ).toEqual({ x: 475, y: 275, width: 250, height: 150, hasBorder: false });
  });

  it('fills the layout area to the margins on the edges that face nothing', () => {
    expect(
      expandGreenScreenCamera(camera, {
        ...context,
        neighbors: { left: 'margin', top: 'margin', right: 'margin', bottom: 'margin' },
      }),
    ).toEqual({ x: 100, y: 50, width: 1000, height: 600, hasBorder: false });
  });

  it('treats each edge on its own', () => {
    expect(expandGreenScreenCamera(camera, context)).toEqual({
      x: 480,
      y: 280,
      width: 620,
      height: 370,
      hasBorder: false,
    });
  });
});

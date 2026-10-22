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
  canvasPadding: 20,
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

  it('reaches the margin through its border and the padding when it is at the edge of the layout', () => {
    // The camera's border box starts at the padding on every side: 100 + 20 + 5 = 125 and 50 + 20 + 5 = 75
    const edgeCamera: LayoutRegion = { x: 125, y: 75, width: 950, height: 550, hasBorder: true };

    expect(
      expandGreenScreenCamera(edgeCamera, {
        ...context,
        neighbors: { left: 'margin', top: 'margin', right: 'margin', bottom: 'margin' },
      }),
    ).toEqual({ x: 100, y: 50, width: 1000, height: 600, hasBorder: false });
  });

  it('stops short of the margin when a short row or column leaves room between them, and never passes it', () => {
    const allMargins: LayoutNeighbors = { left: 'margin', top: 'margin', right: 'margin', bottom: 'margin' };

    expect(expandGreenScreenCamera(camera, { ...context, neighbors: allMargins })).toEqual({
      x: 475,
      y: 275,
      width: 250,
      height: 150,
      hasBorder: false,
    });
    expect(expandGreenScreenCamera(camera, { ...context, canvasPadding: 1000, neighbors: allMargins })).toEqual({
      x: 100,
      y: 50,
      width: 1000,
      height: 600,
      hasBorder: false,
    });
  });

  it('treats each edge on its own', () => {
    expect(expandGreenScreenCamera(camera, context)).toEqual({
      x: 480,
      y: 280,
      width: 245,
      height: 145,
      hasBorder: false,
    });
  });
});

import { describe, expect, it } from 'vitest';

import { roundLayoutRegion } from '@/lib/roundLayoutRegion';

describe('roundLayoutRegion', () => {
  it('rounds every edge to the nearest pixel, sizing the region between them', () => {
    expect(roundLayoutRegion({ x: 1.4, y: 1.5, width: 2.6, height: 99.49, hasBorder: true })).toEqual({
      x: 1,
      y: 2,
      width: 3,
      height: 99,
      hasBorder: true,
    });
  });

  it('keeps regions that meet meeting, where rounding their sizes would leave a pixel between them', () => {
    const above = roundLayoutRegion({ x: 0, y: 10.4, width: 10, height: 20.3, hasBorder: true });
    const below = roundLayoutRegion({ x: 0, y: 30.7, width: 10, height: 5, hasBorder: true });

    expect(above.y + above.height).toBe(below.y);
  });

  it('keeps whole values and the border flag unchanged', () => {
    expect(roundLayoutRegion({ x: 30, y: 90, width: 1387, height: 780, hasBorder: false })).toEqual({
      x: 30,
      y: 90,
      width: 1387,
      height: 780,
      hasBorder: false,
    });
  });
});

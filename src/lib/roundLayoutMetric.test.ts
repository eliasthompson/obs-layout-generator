import { describe, expect, it } from 'vitest';

import { roundLayoutMetric } from '@/lib/roundLayoutMetric';

describe('roundLayoutMetric', () => {
  it('rounds every present region and leaves absent regions out', () => {
    expect(
      roundLayoutMetric({
        contentMain: { x: 30.4, y: 89.6, width: 1386.67, height: 780, hasBorder: true },
        name: { x: 1431.67, y: 742.5, width: 458.33, height: 127.5, hasBorder: false },
      }),
    ).toEqual({
      contentMain: { x: 30, y: 90, width: 1387, height: 780, hasBorder: true },
      name: { x: 1432, y: 743, width: 458, height: 127, hasBorder: false },
    });
  });

  it('leaves out a region that rounds to no width or height', () => {
    expect(
      roundLayoutMetric({
        camera: { x: 10.5, y: 0, width: 0.4, height: 50, hasBorder: true },
        contentMain: { x: 0, y: 0, width: 10, height: 10, hasBorder: true },
      }),
    ).toEqual({ contentMain: { x: 0, y: 0, width: 10, height: 10, hasBorder: true } });
  });

  it('keeps regions in camera, contentMain, contentAux, info, name order', () => {
    const region = { x: 0, y: 0, width: 1, height: 1, hasBorder: true };

    expect(
      Object.keys(
        roundLayoutMetric({ name: region, info: region, contentAux: region, contentMain: region, camera: region }),
      ),
    ).toEqual(['camera', 'contentMain', 'contentAux', 'info', 'name']);
  });
});

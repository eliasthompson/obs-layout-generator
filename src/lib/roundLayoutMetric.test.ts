import { describe, expect, it } from 'vitest';

import { roundLayoutMetric } from '@/lib/roundLayoutMetric';

describe('roundLayoutMetric', () => {
  it('rounds every present region and leaves absent regions out', () => {
    expect(
      roundLayoutMetric({
        contentMain: { x: 30.4, y: 89.6, width: 1386.67, height: 780 },
        name: { x: 1431.67, y: 742.5, width: 458.33, height: 127.5 },
      }),
    ).toEqual({
      contentMain: { x: 30, y: 90, width: 1387, height: 780 },
      name: { x: 1432, y: 743, width: 458, height: 128 },
    });
  });

  it('keeps regions in camera, contentMain, contentAux, info, name order', () => {
    const item = { x: 0, y: 0, width: 1, height: 1 };

    expect(
      Object.keys(roundLayoutMetric({ name: item, info: item, contentAux: item, contentMain: item, camera: item })),
    ).toEqual(['camera', 'contentMain', 'contentAux', 'info', 'name']);
  });
});

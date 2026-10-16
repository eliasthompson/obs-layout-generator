import { describe, expect, it } from 'vitest';

import { roundLayoutRegion } from '@/lib/roundLayoutRegion';

describe('roundLayoutRegion', () => {
  it('rounds every value to the nearest pixel', () => {
    expect(roundLayoutRegion({ x: 1.4, y: 1.5, width: 2.6, height: 99.49 })).toEqual({
      x: 1,
      y: 2,
      width: 3,
      height: 99,
    });
  });

  it('keeps whole values unchanged', () => {
    expect(roundLayoutRegion({ x: 30, y: 90, width: 1387, height: 780 })).toEqual({
      x: 30,
      y: 90,
      width: 1387,
      height: 780,
    });
  });
});

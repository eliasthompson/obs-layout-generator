import { describe, expect, it } from 'vitest';

import type { AspectRatio } from '@/types/AspectRatio';

import { transformAspectRatio } from '@/lib/transformAspectRatio';

describe('transformAspectRatio', () => {
  it.each([
    ['16:9', 16 / 9],
    ['4:3', 4 / 3],
    ['1:1', 1],
    ['4:6', 4 / 6],
    ['1.5:1', 1.5],
  ] as const)('converts %s to its numeric ratio', (aspectRatio, numericAspectRatio) => {
    expect(transformAspectRatio(aspectRatio)).toBe(numericAspectRatio);
  });

  it.each(['0:9', '16:0', '0:0', '-4:3', '4:-3', 'Infinity:1', 'NaN:1'])(
    'returns 0 for the invalid ratio %s',
    (aspectRatio) => {
      expect(transformAspectRatio(aspectRatio as AspectRatio)).toBe(0);
    },
  );
});

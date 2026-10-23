import { describe, expect, it } from 'vitest';

import type { LayoutConfig } from '@/constants/layoutConfig';
import type { LayoutOptions } from '@/constants/layoutOptions';

import { calculateCanvasGrid } from '@/lib/calculateCanvasGrid';
import { generateLandscapeLayout } from '@/lib/generateLandscapeLayout';
import { generateLayout } from '@/lib/generateLayout';

const layoutOptions: LayoutOptions = { canvasGap: 30, canvasMarginBottom: 120, canvasPadding: 30, nameHeightMin: 36 };
const layoutConfigs: LayoutConfig[] = [{ contentAux: {}, hasName: true }, { hasName: true }, {}];

describe('generateLandscapeLayout', () => {
  it('lays out what generateLayout does on a landscape canvas', () => {
    expect(generateLandscapeLayout(layoutConfigs, calculateCanvasGrid(layoutOptions, layoutConfigs.length))).toEqual(
      generateLayout(layoutConfigs, layoutOptions),
    );
  });
});

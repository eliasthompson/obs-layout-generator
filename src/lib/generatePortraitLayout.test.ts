import { describe, expect, it } from 'vitest';

import type { LayoutConfig } from '@/constants/layoutConfig';
import type { LayoutOptions } from '@/constants/layoutOptions';

import { calculateCanvasGrid } from '@/lib/calculateCanvasGrid';
import { generateLayout } from '@/lib/generateLayout';
import { generatePortraitLayout } from '@/lib/generatePortraitLayout';

const layoutOptions: LayoutOptions = {
  canvasWidth: 1080,
  canvasHeight: 1920,
  canvasMarginTop: 144,
  canvasMarginBottom: 432,
  canvasPadding: 24,
  canvasGap: 24,
  layoutGap: 18,
  regionBorder: 6,
  nameHeightMin: 36,
};
const layoutConfigs: LayoutConfig[] = [{ contentAux: {}, hasName: true }, { hasName: true }, {}];

describe('generatePortraitLayout', () => {
  it('lays out what generateLayout does on a portrait canvas', () => {
    expect(generatePortraitLayout(layoutConfigs, calculateCanvasGrid(layoutOptions, layoutConfigs.length), 36)).toEqual(
      generateLayout(layoutConfigs, layoutOptions),
    );
  });
});

import { describe, expect, it } from 'vitest';

import type { SideRegionHeights } from '@/lib/calculateSideRegionHeights';

import { calculateLayoutRegions, type CalculateLayoutRegionsContext } from '@/lib/calculateLayoutRegions';

const context: CalculateLayoutRegionsContext = {
  cameraHeight: 100,
  layoutGap: 10,
  layoutSideWidth: 200,
  mainWidth: 400,
  mainX: 50,
  rowHeight: 300,
  rowY: 20,
};

const noSideRegionHeights: SideRegionHeights = { contentAuxHeight: 0, infoHeight: 0, showSideCamera: false };
const main = { x: 50, y: 20, width: 400, height: 300 };

describe('calculateLayoutRegions', () => {
  it('places main content and stacks side aux content, side info, and the side camera', () => {
    expect(
      calculateLayoutRegions('contentMain', { contentAuxHeight: 150, infoHeight: 30, showSideCamera: true }, context),
    ).toEqual({
      camera: { x: 460, y: 220, width: 200, height: 100 },
      contentMain: main,
      contentAux: { x: 460, y: 20, width: 200, height: 150 },
      info: { x: 460, y: 180, width: 200, height: 30 },
    });
  });

  it('starts side info at the top of the row without side aux content', () => {
    expect(calculateLayoutRegions('contentMain', { ...noSideRegionHeights, infoHeight: 60 }, context).info).toEqual({
      x: 460,
      y: 20,
      width: 200,
      height: 60,
    });
  });

  it.each(['camera', 'contentAux', 'info'] as const)('puts %s in the main column', (mainRegion) => {
    expect(calculateLayoutRegions(mainRegion, noSideRegionHeights, context)).toEqual({ [mainRegion]: main });
  });

  it('returns no regions without a main column or side regions', () => {
    expect(calculateLayoutRegions(undefined, noSideRegionHeights, context)).toEqual({});
  });

  it('omits the main column when it has no width', () => {
    expect(calculateLayoutRegions('contentMain', noSideRegionHeights, { ...context, mainWidth: 0.4 })).toEqual({});
  });

  it('omits the main column when the row has no height', () => {
    expect(calculateLayoutRegions('camera', noSideRegionHeights, { ...context, rowHeight: 0 })).toEqual({});
  });
});

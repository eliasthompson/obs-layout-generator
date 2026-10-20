import { describe, expect, it } from 'vitest';

import type { LayoutConfig } from '@/constants/layoutConfig';

import { mergeLayoutConfigs } from '@/lib/mergeLayoutConfigs';

describe('mergeLayoutConfigs', () => {
  it('merges a region set on both sides field by field', () => {
    expect(
      mergeLayoutConfigs(
        { camera: { isGreenScreen: true }, contentMain: { aspectRatio: '4:3' }, hasName: true },
        { camera: { isMainAttached: true }, info: { aspectRatio: '250:49' } },
      ),
    ).toEqual({
      camera: { isGreenScreen: true, isMainAttached: true },
      contentMain: { aspectRatio: '4:3' },
      info: { aspectRatio: '250:49' },
      hasName: true,
    });
  });

  it('lets null turn a region off on either side, and an object turn it back on', () => {
    expect(mergeLayoutConfigs({ contentMain: { aspectRatio: '4:3' } }, { contentMain: null })).toEqual({
      contentMain: null,
    });
    expect(mergeLayoutConfigs({ contentMain: null }, { contentMain: { aspectRatio: '4:3' } })).toEqual({
      contentMain: { aspectRatio: '4:3' },
    });
  });

  it('treats an undefined field in the override as left out', () => {
    expect(mergeLayoutConfigs({ camera: null, hasName: true }, { camera: undefined, hasName: undefined })).toEqual({
      camera: null,
      hasName: true,
    });
  });

  it('leaves both arguments unchanged', () => {
    const base: LayoutConfig = { camera: { isGreenScreen: true } };
    const override: LayoutConfig = { camera: { isMainAttached: true } };

    mergeLayoutConfigs(base, override);

    expect(base).toEqual({ camera: { isGreenScreen: true } });
    expect(override).toEqual({ camera: { isMainAttached: true } });
  });
});

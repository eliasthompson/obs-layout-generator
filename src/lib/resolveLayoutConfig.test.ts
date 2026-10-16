import { describe, expect, it } from 'vitest';

import { resolveLayoutConfig, type ResolveLayoutConfigContext } from '@/lib/resolveLayoutConfig';

const context: ResolveLayoutConfigContext = {
  canvasGridUnitNumericAspectRatio: 2,
  hasSideRoom: true,
  layoutGap: 15,
  layoutSideWidth: 400,
};

describe('resolveLayoutConfig', () => {
  it('uses the defaults for an empty layout config', () => {
    expect(resolveLayoutConfig({}, context)).toEqual({
      hasName: false,
      hasSideCamera: true,
      hasSideInfo: false,
      mainNumericAspectRatio: 16 / 9,
      mainRegion: 'contentMain',
      sideContentAuxNumericAspectRatio: undefined,
      sideInfoNumericAspectRatio: undefined,
      sideWidthTotal: 415,
    });
  });

  it('passes hasName through', () => {
    expect(resolveLayoutConfig({ hasName: true }, context).hasName).toBe(true);
  });

  it('puts the camera in the main column without main content', () => {
    expect(resolveLayoutConfig({ cameraMainAspectRatio: '4:3', contentMainAspectRatio: null }, context)).toMatchObject({
      hasSideCamera: false,
      mainNumericAspectRatio: 4 / 3,
      mainRegion: 'camera',
      sideWidthTotal: 0,
    });
  });

  it('skips an invalid main content ratio', () => {
    expect(resolveLayoutConfig({ contentMainAspectRatio: '0:9' as never }, context).mainRegion).toBe('camera');
  });

  it('keeps the camera in the side column when its main ratio is invalid', () => {
    expect(
      resolveLayoutConfig(
        { cameraMainAspectRatio: '16:0', contentAuxAspectRatio: '4:3', contentMainAspectRatio: null },
        context,
      ),
    ).toMatchObject({ hasSideCamera: true, mainNumericAspectRatio: 4 / 3, mainRegion: 'contentAux' });
  });

  it('puts aux content in the main column without main content or a camera', () => {
    expect(
      resolveLayoutConfig(
        { contentAuxAspectRatio: '4:3', contentMainAspectRatio: null, hasCamera: false, infoAspectRatio: '16:9' },
        context,
      ),
    ).toMatchObject({
      hasSideInfo: true,
      mainNumericAspectRatio: 4 / 3,
      mainRegion: 'contentAux',
      sideContentAuxNumericAspectRatio: undefined,
      sideInfoNumericAspectRatio: 16 / 9,
      sideWidthTotal: 415,
    });
  });

  it('puts info in the main column at its ratio as the last resort', () => {
    expect(
      resolveLayoutConfig({ contentMainAspectRatio: null, hasCamera: false, infoAspectRatio: '1:1' }, context),
    ).toMatchObject({ hasSideInfo: false, mainNumericAspectRatio: 1, mainRegion: 'info', sideWidthTotal: 0 });
  });

  it('fills the grid cell with auto info in the main column', () => {
    expect(
      resolveLayoutConfig({ contentMainAspectRatio: null, hasCamera: false, infoAspectRatio: 'auto' }, context),
    ).toMatchObject({ mainNumericAspectRatio: 2, mainRegion: 'info' });
  });

  it('resolves nothing without any regions', () => {
    expect(resolveLayoutConfig({ contentMainAspectRatio: null, hasCamera: false }, context)).toMatchObject({
      mainNumericAspectRatio: 0,
      mainRegion: undefined,
      sideWidthTotal: 0,
    });
  });

  it('keeps aux content and auto info in the side column beside main content', () => {
    expect(resolveLayoutConfig({ contentAuxAspectRatio: '1:1', infoAspectRatio: 'auto' }, context)).toMatchObject({
      hasSideCamera: true,
      hasSideInfo: true,
      sideContentAuxNumericAspectRatio: 1,
      sideInfoNumericAspectRatio: undefined,
    });
  });

  it('skips invalid aux and info ratios', () => {
    expect(
      resolveLayoutConfig({ contentAuxAspectRatio: '0:1' as never, hasCamera: false, infoAspectRatio: '1:0' }, context),
    ).toMatchObject({ hasSideInfo: false, sideContentAuxNumericAspectRatio: undefined, sideWidthTotal: 0 });
  });

  it('reserves no side column without side room', () => {
    expect(
      resolveLayoutConfig(
        { contentAuxAspectRatio: '1:1', infoAspectRatio: 'auto' },
        { ...context, hasSideRoom: false },
      ),
    ).toMatchObject({
      hasSideCamera: false,
      hasSideInfo: false,
      sideContentAuxNumericAspectRatio: undefined,
      sideWidthTotal: 0,
    });
  });
});

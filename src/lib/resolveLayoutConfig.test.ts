import { describe, expect, it } from 'vitest';

import { resolveLayoutConfig, type ResolveLayoutConfigContext } from '@/lib/resolveLayoutConfig';

const context: ResolveLayoutConfigContext = {
  canvasGridUnitNumericAspectRatio: 2,
  hasSideRoom: true,
  layoutGap: 15,
  layoutSideWidth: 400,
  regionBorder: 5,
};

describe('resolveLayoutConfig', () => {
  it('uses the defaults for an empty layout config', () => {
    expect(resolveLayoutConfig({}, context)).toEqual({
      hasName: false,
      hasSideCamera: true,
      hasSideInfo: false,
      isCameraAboveAttached: false,
      isCameraGreenScreen: false,
      isCameraMainAttached: false,
      isContentAuxMainAttached: false,
      isInfoAboveAttached: false,
      isInfoMainAttached: false,
      mainNumericAspectRatio: 16 / 9,
      mainRegion: 'contentMain',
      sideCameraWidth: 400,
      sideContentAuxNumericAspectRatio: undefined,
      sideContentAuxWidth: 400,
      sideInfoNumericAspectRatio: undefined,
      sideInfoWidth: 400,
      sideWidthTotal: 415,
    });
  });

  it('uses the region defaults for empty region configs', () => {
    expect(resolveLayoutConfig({ camera: {}, contentAux: {}, contentMain: {}, info: {} }, context)).toMatchObject({
      hasSideCamera: true,
      hasSideInfo: true,
      mainNumericAspectRatio: 16 / 9,
      mainRegion: 'contentMain',
      sideContentAuxNumericAspectRatio: 4 / 3,
      sideInfoNumericAspectRatio: undefined,
    });
  });

  it('passes hasName and the attachment flags through', () => {
    expect(
      resolveLayoutConfig(
        { camera: { isAboveAttached: true }, hasName: true, info: { isAboveAttached: true } },
        context,
      ),
    ).toMatchObject({ hasName: true, isCameraAboveAttached: true, isInfoAboveAttached: true });
  });

  it('widens side regions attached to the main region by the gap less the shared border', () => {
    expect(
      resolveLayoutConfig(
        { camera: { isMainAttached: true }, contentAux: { isMainAttached: true }, info: { isMainAttached: true } },
        context,
      ),
    ).toMatchObject({ sideCameraWidth: 410, sideContentAuxWidth: 410, sideInfoWidth: 410, sideWidthTotal: 415 });
  });

  it('ignores the camera attachments when it is a green screen', () => {
    expect(
      resolveLayoutConfig(
        {
          camera: { isAboveAttached: true, isGreenScreen: true, isMainAttached: true },
          info: { isMainAttached: true },
        },
        context,
      ),
    ).toMatchObject({
      isCameraAboveAttached: false,
      isCameraGreenScreen: true,
      sideCameraWidth: 400,
      sideInfoWidth: 410,
    });
  });

  it('ignores attachments to a green screen main camera', () => {
    expect(
      resolveLayoutConfig(
        {
          camera: { isGreenScreen: true },
          contentAux: { isMainAttached: true },
          contentMain: null,
          info: { isMainAttached: true },
        },
        context,
      ),
    ).toMatchObject({ mainRegion: 'camera', sideContentAuxWidth: 400, sideInfoWidth: 400 });
  });

  it('ignores main attachment without a main region to attach to', () => {
    expect(
      resolveLayoutConfig({ camera: { isMainAttached: true, mainAspectRatio: '16:0' }, contentMain: null }, context),
    ).toMatchObject({ hasSideCamera: true, mainRegion: undefined, sideCameraWidth: 400 });
  });

  it('puts the camera in the main column without main content', () => {
    expect(resolveLayoutConfig({ camera: { mainAspectRatio: '4:3' }, contentMain: null }, context)).toMatchObject({
      hasSideCamera: false,
      mainNumericAspectRatio: 4 / 3,
      mainRegion: 'camera',
      sideWidthTotal: 0,
    });
  });

  it('skips an invalid main content ratio', () => {
    expect(resolveLayoutConfig({ contentMain: { aspectRatio: '0:9' as never } }, context).mainRegion).toBe('camera');
  });

  it('keeps the camera in the side column when its main ratio is invalid', () => {
    expect(
      resolveLayoutConfig(
        { camera: { mainAspectRatio: '16:0' }, contentAux: { aspectRatio: '4:3' }, contentMain: null },
        context,
      ),
    ).toMatchObject({ hasSideCamera: true, mainNumericAspectRatio: 4 / 3, mainRegion: 'contentAux' });
  });

  it('puts aux content in the main column without main content or a camera', () => {
    expect(
      resolveLayoutConfig(
        { camera: null, contentAux: { aspectRatio: '4:3' }, contentMain: null, info: { aspectRatio: '16:9' } },
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
      resolveLayoutConfig({ camera: null, contentMain: null, info: { aspectRatio: '1:1' } }, context),
    ).toMatchObject({ hasSideInfo: false, mainNumericAspectRatio: 1, mainRegion: 'info', sideWidthTotal: 0 });
  });

  it('fills the grid cell with auto info in the main column', () => {
    expect(
      resolveLayoutConfig({ camera: null, contentMain: null, info: { aspectRatio: 'auto' } }, context),
    ).toMatchObject({ mainNumericAspectRatio: 2, mainRegion: 'info' });
  });

  it('resolves nothing without any regions', () => {
    expect(resolveLayoutConfig({ camera: null, contentMain: null }, context)).toMatchObject({
      mainNumericAspectRatio: 0,
      mainRegion: undefined,
      sideWidthTotal: 0,
    });
  });

  it('keeps aux content and auto info in the side column beside main content', () => {
    expect(
      resolveLayoutConfig({ contentAux: { aspectRatio: '1:1' }, info: { aspectRatio: 'auto' } }, context),
    ).toMatchObject({
      hasSideCamera: true,
      hasSideInfo: true,
      sideContentAuxNumericAspectRatio: 1,
      sideInfoNumericAspectRatio: undefined,
    });
  });

  it('skips invalid aux and info ratios', () => {
    expect(
      resolveLayoutConfig(
        { camera: null, contentAux: { aspectRatio: '0:1' as never }, info: { aspectRatio: '1:0' } },
        context,
      ),
    ).toMatchObject({ hasSideInfo: false, sideContentAuxNumericAspectRatio: undefined, sideWidthTotal: 0 });
  });

  it('reserves no side column without side room', () => {
    expect(
      resolveLayoutConfig(
        { contentAux: { aspectRatio: '1:1' }, info: { aspectRatio: 'auto' } },
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

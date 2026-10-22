import { describe, expect, it } from 'vitest';

import { placeName, type PlaceNameContext } from '@/lib/placeName';

const context: PlaceNameContext = {
  hasCameraNameRoom: true,
  mainRegion: 'contentMain',
  nameHeightMax: 50,
  nameHeightMin: 0,
  namePosition: 'bottom',
};
const camera = { x: 460, y: 220, width: 200, height: 90, hasBorder: true };
const contentMain = { x: 50, y: 20, width: 400, height: 300, hasBorder: true };
const contentAux = { x: 460, y: 20, width: 200, height: 150, hasBorder: true };

describe('placeName', () => {
  it('places the name along the bottom third of a side camera with room for it, without a border', () => {
    expect(placeName({ camera, contentMain }, context)).toEqual({
      x: 460,
      y: 280,
      width: 200,
      height: 30,
      hasBorder: false,
    });
  });

  it('places the name along the top of its host instead when asked', () => {
    expect(placeName({ camera, contentMain }, { ...context, namePosition: 'top' })).toEqual({
      x: 460,
      y: 220,
      width: 200,
      height: 30,
      hasBorder: false,
    });
  });

  it('caps the name on a main column camera at the largest name height', () => {
    const mainCamera = { x: 160, y: 30, width: 1600, height: 900, hasBorder: true };

    expect(placeName({ camera: mainCamera }, { ...context, hasCameraNameRoom: false, mainRegion: 'camera' })).toEqual({
      x: 160,
      y: 880,
      width: 1600,
      height: 50,
      hasBorder: false,
    });
  });

  it('falls back to the main content, capped, when the camera is too short for the name', () => {
    expect(placeName({ camera, contentMain }, { ...context, hasCameraNameRoom: false })).toEqual({
      x: 50,
      y: 270,
      width: 400,
      height: 50,
      hasBorder: false,
    });
  });

  it('falls back to the aux content without a camera or main content', () => {
    expect(placeName({ contentAux }, context)).toEqual({ x: 460, y: 120, width: 200, height: 50, hasBorder: false });
  });

  it('never places the name on info', () => {
    expect(placeName({ info: contentMain }, context)).toBeUndefined();
  });

  it('raises the name to the minimum height when a third of the host is shorter', () => {
    expect(placeName({ contentAux: { ...contentAux, height: 60 } }, { ...context, nameHeightMin: 40 })).toEqual({
      x: 460,
      y: 40,
      width: 200,
      height: 40,
      hasBorder: false,
    });
  });

  it('never exceeds its host, even for the minimum height', () => {
    expect(placeName({ contentAux: { ...contentAux, height: 30 } }, { ...context, nameHeightMin: 40 })).toEqual({
      x: 460,
      y: 20,
      width: 200,
      height: 30,
      hasBorder: false,
    });
  });

  it('omits the name when its height rounds to 0', () => {
    expect(placeName({ contentMain: { ...contentMain, height: 1 } }, context)).toBeUndefined();
  });
});

import { describe, expect, it } from 'vitest';

import { placeName, type PlaceNameContext } from '@/lib/placeName';

const context: PlaceNameContext = { hasCameraNameRoom: true, mainRegion: 'contentMain', nameHeight: 50 };
const camera = { x: 460, y: 220, width: 200, height: 100 };
const contentMain = { x: 50, y: 20, width: 400, height: 300 };
const contentAux = { x: 460, y: 20, width: 200, height: 150 };

describe('placeName', () => {
  it('places the name along the bottom of a side camera with room for it', () => {
    expect(placeName({ camera, contentMain }, context)).toEqual({ x: 460, y: 270, width: 200, height: 50 });
  });

  it('places the name on a main column camera even when side cameras are too short', () => {
    expect(placeName({ camera }, { ...context, hasCameraNameRoom: false, mainRegion: 'camera' })).toEqual({
      x: 460,
      y: 270,
      width: 200,
      height: 50,
    });
  });

  it('falls back to the main content when the camera is too short for the name', () => {
    expect(placeName({ camera, contentMain }, { ...context, hasCameraNameRoom: false })).toEqual({
      x: 50,
      y: 270,
      width: 400,
      height: 50,
    });
  });

  it('falls back to the aux content without a camera or main content', () => {
    expect(placeName({ contentAux }, context)).toEqual({ x: 460, y: 120, width: 200, height: 50 });
  });

  it('never places the name on info', () => {
    expect(placeName({ info: contentMain }, context)).toBeUndefined();
  });

  it('fits the name within a shorter host', () => {
    expect(placeName({ contentAux: { ...contentAux, height: 30 } }, context)).toEqual({
      x: 460,
      y: 20,
      width: 200,
      height: 30,
    });
  });

  it('omits the name when its height rounds to 0', () => {
    expect(placeName({ contentMain }, { ...context, nameHeight: 0.4 })).toBeUndefined();
  });
});

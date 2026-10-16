import type { LayoutMainRegion } from '@/types/LayoutMainRegion';
import type { LayoutMetric, LayoutRegion } from '@/types/LayoutMetric';

export interface PlaceNameContext {
  hasCameraNameRoom: boolean;
  mainRegion?: LayoutMainRegion;
  nameHeight: number;
}

// Place the name along the bottom of the camera, else the main content, else the aux content, if it fits
export const placeName = (
  { camera, contentAux, contentMain }: LayoutMetric,
  { hasCameraNameRoom, mainRegion, nameHeight }: PlaceNameContext,
): LayoutRegion | undefined => {
  let nameHost: LayoutRegion | undefined;

  if (camera && (mainRegion === 'camera' || hasCameraNameRoom)) {
    nameHost = camera;
  } else if (contentMain) {
    nameHost = contentMain;
  } else if (contentAux) {
    nameHost = contentAux;
  }

  if (!nameHost) return undefined;

  const nameFittedHeight = Math.min(nameHeight, nameHost.height);

  return Math.round(nameFittedHeight) > 0
    ? {
        x: nameHost.x,
        y: nameHost.y + nameHost.height - nameFittedHeight,
        width: nameHost.width,
        height: nameFittedHeight,
      }
    : undefined;
};

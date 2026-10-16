import type { LayoutMainRegion } from '@/types/LayoutMainRegion';
import type { LayoutMetric, LayoutRegion } from '@/types/LayoutMetric';

export interface PlaceNameContext {
  hasCameraNameRoom: boolean;
  mainRegion?: LayoutMainRegion;
  nameHeight: number;
}

/**
 * Place the name tag along the bottom of the region that hosts it.
 *
 * @param layoutMetric - Positioned regions of one participant, before rounding.
 * @param context - Whether a side camera is tall enough for the name, which region took the main column, and the
 *   name height.
 * @returns The name region, or `undefined` when no host is shown or the name would round to no height.
 */
export const placeName = (
  { camera, contentAux, contentMain }: LayoutMetric,
  { hasCameraNameRoom, mainRegion, nameHeight }: PlaceNameContext,
): LayoutRegion | undefined => {
  let nameHost: LayoutRegion | undefined;

  // Prefer the camera when it is the main region or a side camera with room, then the main content, then aux content
  if (camera && (mainRegion === 'camera' || hasCameraNameRoom)) {
    nameHost = camera;
  } else if (contentMain) {
    nameHost = contentMain;
  } else if (contentAux) {
    nameHost = contentAux;
  }

  if (!nameHost) return undefined;

  // The name never exceeds its host, and a name that rounds away is omitted rather than returned empty
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

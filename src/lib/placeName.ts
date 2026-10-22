import type { LayoutMainRegion } from '@/types/LayoutMainRegion';
import type { LayoutMetric, LayoutRegion } from '@/types/LayoutMetric';
import type { LayoutNamePosition } from '@/types/LayoutNamePosition';

export interface PlaceNameContext {
  hasCameraNameRoom: boolean;
  mainRegion?: LayoutMainRegion;
  nameHeightMax: number;
  nameHeightMin: number;
  namePosition: LayoutNamePosition;
}

/**
 * Place the name tag along the bottom, or the top, of the region that hosts it, as wide as that region and a third as
 * tall, capped at `nameHeightMax`, raised to `nameHeightMin`, and never taller than the host.
 *
 * @param layoutMetric - Positioned regions of one participant, before rounding.
 * @param context - Whether a side camera is tall enough for the name, which region took the main column, the name
 *   height bounds, and the edge of the host the name runs along.
 * @returns The name region, which has no border, or `undefined` when no host is shown or the name would round to no
 *   height.
 */
export const placeName = (
  { camera, contentAux, contentMain }: LayoutMetric,
  { hasCameraNameRoom, mainRegion, nameHeightMax, nameHeightMin, namePosition }: PlaceNameContext,
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

  // The host decides the size within the bounds; a name that rounds away is omitted rather than returned empty
  const nameHeight = Math.min(nameHost.height, Math.max(nameHeightMin, Math.min(nameHost.height / 3, nameHeightMax)));

  return Math.round(nameHeight) > 0
    ? {
        x: nameHost.x,
        y: namePosition === 'top' ? nameHost.y : nameHost.y + nameHost.height - nameHeight,
        width: nameHost.width,
        height: nameHeight,
        hasBorder: false,
      }
    : undefined;
};

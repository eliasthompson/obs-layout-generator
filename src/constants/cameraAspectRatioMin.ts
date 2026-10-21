import type { AspectRatio } from '@/types/AspectRatio';

/** The narrowest shape a side camera takes. A slot narrower than this shortens the camera instead of squeezing it. */
export const CAMERA_ASPECT_RATIO_MIN = '9:16' as const satisfies AspectRatio;

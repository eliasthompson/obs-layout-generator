import type { AspectRatio } from '@/types/AspectRatio';

/**
 * Turn a `'width:height'` aspect ratio into the number width / height.
 *
 * @param aspectRatio - Ratio string such as `'16:9'`.
 * @returns The numeric ratio, or `0` when either side is not a positive finite number, which callers treat as invalid.
 */
export const transformAspectRatio = (aspectRatio: AspectRatio) => {
  // Split on the colon and coerce both sides, so a missing or non-numeric side becomes NaN
  const [width, height] = aspectRatio.split(':').map(Number);
  const numericAspectRatio = width / height;

  // Only a ratio that is positive on both sides and finite is usable; everything else collapses to 0
  return width > 0 && height > 0 && Number.isFinite(numericAspectRatio) ? numericAspectRatio : 0;
};

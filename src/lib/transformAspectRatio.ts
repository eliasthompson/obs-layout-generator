import type { AspectRatio } from '@/types/AspectRatio';

// Returns 0 for ratios that are not positive and finite on both sides, which callers treat as invalid
export const transformAspectRatio = (aspectRatio: AspectRatio) => {
  const [width, height] = aspectRatio.split(':').map(Number);
  const numericAspectRatio = width / height;

  return width > 0 && height > 0 && Number.isFinite(numericAspectRatio) ? numericAspectRatio : 0;
};

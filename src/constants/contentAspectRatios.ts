import type { AspectRatio } from '@/types/AspectRatio';

export const CONTENT_ASPECT_RATIOS = Object.freeze([
  '16:9',
  '5:3',
  '3:2',
  '4:3',
  '8:7',
  '10:9',
  '16:15',
  '1:1',
  '5:6',
  '4:6',
  '9:16',
] as const satisfies readonly AspectRatio[]);

export type ContentAspectRatio = (typeof CONTENT_ASPECT_RATIOS)[number];

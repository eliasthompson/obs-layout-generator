import type { ContentAspectRatio } from '@/constants/contentAspectRatios';
import type { AspectRatio } from '@/types/AspectRatio';

export interface LayoutConfig {
  cameraMainAspectRatio?: AspectRatio;
  contentAuxAspectRatio?: ContentAspectRatio | null;
  contentMainAspectRatio?: ContentAspectRatio | null;
  hasCamera?: boolean;
  hasName?: boolean;
  infoAspectRatio?: 'auto' | AspectRatio | null;
}

export const LAYOUT_CONFIG_DEFAULT = Object.freeze({
  cameraMainAspectRatio: '16:9',
  contentAuxAspectRatio: null,
  contentMainAspectRatio: '16:9',
  hasCamera: true,
  hasName: false,
  infoAspectRatio: null,
} as const satisfies LayoutConfig);

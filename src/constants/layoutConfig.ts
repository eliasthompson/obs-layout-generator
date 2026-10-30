import type { ContentAspectRatio } from '@/constants/contentAspectRatios';
import type { AspectRatio } from '@/types/AspectRatio';

export interface CameraLayoutConfig {
  mainAspectRatio?: 'auto' | AspectRatio;
  isMainAttached?: boolean;
  isPreviousAttached?: boolean;
  isGreenScreen?: boolean;
}

export interface ContentMainLayoutConfig {
  aspectRatio?: ContentAspectRatio;
}

export interface ContentAuxLayoutConfig {
  aspectRatio?: ContentAspectRatio;
  isMainAttached?: boolean;
  isPreviousAttached?: boolean;
}

export interface InfoLayoutConfig {
  aspectRatio?: 'auto' | AspectRatio;
  isMainAttached?: boolean;
  isPreviousAttached?: boolean;
}

export interface LayoutConfig {
  camera?: CameraLayoutConfig | null;
  contentMain?: ContentMainLayoutConfig | null;
  contentAux?: ContentAuxLayoutConfig | null;
  info?: InfoLayoutConfig | null;
  hasName?: boolean;
}

export const CAMERA_LAYOUT_CONFIG_DEFAULT = Object.freeze({
  mainAspectRatio: 'auto',
  isMainAttached: false,
  isPreviousAttached: false,
  isGreenScreen: false,
} as const satisfies CameraLayoutConfig);

export const CONTENT_MAIN_LAYOUT_CONFIG_DEFAULT = Object.freeze({
  aspectRatio: '16:9',
} as const satisfies ContentMainLayoutConfig);

export const CONTENT_AUX_LAYOUT_CONFIG_DEFAULT = Object.freeze({
  aspectRatio: '4:3',
  isMainAttached: false,
  isPreviousAttached: false,
} as const satisfies ContentAuxLayoutConfig);

export const INFO_LAYOUT_CONFIG_DEFAULT = Object.freeze({
  aspectRatio: 'auto',
  isMainAttached: false,
  isPreviousAttached: false,
} as const satisfies InfoLayoutConfig);

export const LAYOUT_CONFIG_DEFAULT = Object.freeze({
  camera: CAMERA_LAYOUT_CONFIG_DEFAULT,
  contentMain: CONTENT_MAIN_LAYOUT_CONFIG_DEFAULT,
  contentAux: null,
  info: null,
  hasName: false,
} as const satisfies LayoutConfig);

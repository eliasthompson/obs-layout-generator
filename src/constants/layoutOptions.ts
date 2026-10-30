import type { AspectRatio } from '@/types/AspectRatio';
import type { LayoutNamePosition } from '@/types/LayoutNamePosition';
import type { LayoutOrientation } from '@/types/LayoutOrientation';

export interface LayoutOptions {
  canvasWidth?: number;
  canvasHeight?: number;
  orientation?: LayoutOrientation;
  canvasMarginTop?: number;
  canvasMarginBottom?: number;
  canvasMarginLeft?: number;
  canvasMarginRight?: number;
  canvasPadding?: number;
  canvasGap?: number;
  layoutGap?: number;
  layoutSideMin?: number;
  regionBorder?: number;
  cameraAspectRatioMin?: AspectRatio;
  cameraAspectRatioMax?: AspectRatio;
  cameraAspectRatioDefault?: AspectRatio;
  nameHeightMin?: number;
  nameHeightMax?: number;
  namePosition?: LayoutNamePosition;
}

/** The side camera ratio each orientation takes when `cameraAspectRatioDefault` is left out: 4:3 turned across it */
export const CAMERA_ASPECT_RATIO_DEFAULTS = Object.freeze({
  landscape: '3:4',
  portrait: '4:3',
} as const satisfies Record<Exclude<LayoutOrientation, 'auto'>, AspectRatio>);

export const LAYOUT_OPTIONS_DEFAULT = Object.freeze({
  canvasWidth: 1920,
  canvasHeight: 1080,
  orientation: 'auto',
  canvasMarginTop: 0,
  canvasMarginBottom: 0,
  canvasMarginLeft: 0,
  canvasMarginRight: 0,
  canvasPadding: 0,
  canvasGap: 0,
  layoutGap: undefined as number | undefined,
  layoutSideMin: 0,
  regionBorder: 0,
  cameraAspectRatioMin: '9:16',
  cameraAspectRatioMax: '16:9',
  cameraAspectRatioDefault: undefined as AspectRatio | undefined,
  nameHeightMin: 0,
  nameHeightMax: Infinity,
  namePosition: 'bottom',
} as const satisfies LayoutOptions);

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
  nameHeightMin?: number;
  namePosition?: LayoutNamePosition;
}

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
  nameHeightMin: 0,
  namePosition: 'bottom',
} as const satisfies LayoutOptions);

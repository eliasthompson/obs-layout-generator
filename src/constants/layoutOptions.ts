export interface LayoutOptions {
  canvasWidth?: number;
  canvasHeight?: number;
  canvasPadding?: number;
  canvasMarginTop?: number;
  canvasMarginBottom?: number;
  canvasMarginLeft?: number;
  canvasMarginRight?: number;
}

export const LAYOUT_OPTIONS_DEFAULT = Object.freeze({
  canvasWidth: 1920,
  canvasHeight: 1080,
  canvasPadding: 0,
  canvasMarginTop: 0,
  canvasMarginBottom: 0,
  canvasMarginLeft: 0,
  canvasMarginRight: 0,
} as const satisfies LayoutOptions);

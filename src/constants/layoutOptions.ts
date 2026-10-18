export interface LayoutOptions {
  canvasWidth?: number;
  canvasHeight?: number;
  canvasMarginTop?: number;
  canvasMarginBottom?: number;
  canvasMarginLeft?: number;
  canvasMarginRight?: number;
  canvasPadding?: number;
  canvasGap?: number;
  layoutGap?: number;
  regionBorder?: number;
  nameHeightMin?: number;
}

export const LAYOUT_OPTIONS_DEFAULT = Object.freeze({
  canvasWidth: 1920,
  canvasHeight: 1080,
  canvasMarginTop: 0,
  canvasMarginBottom: 0,
  canvasMarginLeft: 0,
  canvasMarginRight: 0,
  canvasPadding: 0,
  canvasGap: 0,
  layoutGap: undefined as number | undefined,
  regionBorder: 0,
  nameHeightMin: 0,
} as const satisfies LayoutOptions);

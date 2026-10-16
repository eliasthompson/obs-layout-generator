import type { LayoutMainRegion } from '@/types/LayoutMainRegion';

import { LAYOUT_CONFIG_DEFAULT, type LayoutConfig } from '@/constants/layoutConfig';
import { transformAspectRatio } from '@/lib/transformAspectRatio';

export interface ResolveLayoutConfigContext {
  canvasGridUnitNumericAspectRatio: number;
  hasSideRoom: boolean;
  layoutGap: number;
  layoutSideWidth: number;
}

export interface ResolvedLayoutConfig {
  hasName: boolean;
  hasSideCamera: boolean;
  hasSideInfo: boolean;
  mainNumericAspectRatio: number;
  mainRegion?: LayoutMainRegion;
  sideContentAuxNumericAspectRatio?: number;
  sideInfoNumericAspectRatio?: number;
  sideWidthTotal: number;
}

// Resolve the main column (main content, else camera, else aux content, else info) and what stays in the side column
export const resolveLayoutConfig = (
  {
    cameraMainAspectRatio = LAYOUT_CONFIG_DEFAULT.cameraMainAspectRatio,
    contentAuxAspectRatio = LAYOUT_CONFIG_DEFAULT.contentAuxAspectRatio,
    contentMainAspectRatio = LAYOUT_CONFIG_DEFAULT.contentMainAspectRatio,
    hasCamera = LAYOUT_CONFIG_DEFAULT.hasCamera,
    hasName = LAYOUT_CONFIG_DEFAULT.hasName,
    infoAspectRatio = LAYOUT_CONFIG_DEFAULT.infoAspectRatio,
  }: LayoutConfig,
  { canvasGridUnitNumericAspectRatio, hasSideRoom, layoutGap, layoutSideWidth }: ResolveLayoutConfigContext,
): ResolvedLayoutConfig => {
  // Invalid ratios transform to 0 and are treated as absent
  const contentMainNumericAspectRatio = contentMainAspectRatio ? transformAspectRatio(contentMainAspectRatio) : 0;
  const cameraMainNumericAspectRatio = hasCamera ? transformAspectRatio(cameraMainAspectRatio) : 0;
  const contentAuxNumericAspectRatio = contentAuxAspectRatio ? transformAspectRatio(contentAuxAspectRatio) : 0;
  const infoNumericAspectRatio =
    infoAspectRatio === 'auto'
      ? canvasGridUnitNumericAspectRatio
      : infoAspectRatio
        ? transformAspectRatio(infoAspectRatio)
        : 0;
  let mainRegion: LayoutMainRegion | undefined;
  let mainNumericAspectRatio = 0;

  if (contentMainNumericAspectRatio > 0) {
    mainRegion = 'contentMain';
    mainNumericAspectRatio = contentMainNumericAspectRatio;
  } else if (cameraMainNumericAspectRatio > 0) {
    mainRegion = 'camera';
    mainNumericAspectRatio = cameraMainNumericAspectRatio;
  } else if (contentAuxNumericAspectRatio > 0) {
    mainRegion = 'contentAux';
    mainNumericAspectRatio = contentAuxNumericAspectRatio;
  } else if (infoNumericAspectRatio > 0) {
    mainRegion = 'info';
    mainNumericAspectRatio = infoNumericAspectRatio;
  }

  const hasSideCamera = hasSideRoom && hasCamera && mainRegion !== 'camera';
  const hasSideContentAux = hasSideRoom && contentAuxNumericAspectRatio > 0 && mainRegion !== 'contentAux';
  const hasSideInfo = hasSideRoom && infoNumericAspectRatio > 0 && mainRegion !== 'info';

  return {
    hasName,
    hasSideCamera,
    hasSideInfo,
    mainNumericAspectRatio,
    mainRegion,
    sideContentAuxNumericAspectRatio: hasSideContentAux ? contentAuxNumericAspectRatio : undefined,
    sideInfoNumericAspectRatio: hasSideInfo && infoAspectRatio !== 'auto' ? infoNumericAspectRatio : undefined,
    sideWidthTotal: hasSideCamera || hasSideContentAux || hasSideInfo ? layoutGap + layoutSideWidth : 0,
  };
};

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

/**
 * Decide which region takes a participant's main column and which regions stay in the side column.
 *
 * @param layoutConfig - The participant's config; missing fields take their defaults.
 * @param context - The grid cell ratio for `'auto'` info, whether a side column exists, and its gap and width.
 * @returns The main region and its ratio, which regions sit in the side column with their ratios, and the total
 *   width the side column adds to the participant, `0` when nothing is in it.
 */
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
  // Turn each requested region into a numeric ratio; absent, disabled, and invalid ratios all become 0
  const contentMainNumericAspectRatio = contentMainAspectRatio ? transformAspectRatio(contentMainAspectRatio) : 0;
  const cameraMainNumericAspectRatio = hasCamera ? transformAspectRatio(cameraMainAspectRatio) : 0;
  const contentAuxNumericAspectRatio = contentAuxAspectRatio ? transformAspectRatio(contentAuxAspectRatio) : 0;
  // 'auto' info takes the grid cell's ratio so it fills the cell when it is the main region
  const infoNumericAspectRatio =
    infoAspectRatio === 'auto'
      ? canvasGridUnitNumericAspectRatio
      : infoAspectRatio
        ? transformAspectRatio(infoAspectRatio)
        : 0;
  let mainRegion: LayoutMainRegion | undefined;
  let mainNumericAspectRatio = 0;

  // The main column goes to the first region present, in this order: main content, camera, aux content, info
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

  // Every other requested region goes to the side column, when there is one
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
    // 'auto' info has no side ratio and fills whatever the side stack leaves
    sideInfoNumericAspectRatio: hasSideInfo && infoAspectRatio !== 'auto' ? infoNumericAspectRatio : undefined,
    // A used side column adds its width plus the gap between the columns to the participant's width
    sideWidthTotal: hasSideCamera || hasSideContentAux || hasSideInfo ? layoutGap + layoutSideWidth : 0,
  };
};

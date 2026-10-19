import type { LayoutMainRegion } from '@/types/LayoutMainRegion';

import {
  CAMERA_LAYOUT_CONFIG_DEFAULT,
  CONTENT_AUX_LAYOUT_CONFIG_DEFAULT,
  CONTENT_MAIN_LAYOUT_CONFIG_DEFAULT,
  INFO_LAYOUT_CONFIG_DEFAULT,
  LAYOUT_CONFIG_DEFAULT,
  type LayoutConfig,
} from '@/constants/layoutConfig';
import { transformAspectRatio } from '@/lib/transformAspectRatio';

export interface ResolveLayoutConfigContext {
  canvasGridUnitNumericAspectRatio: number;
  hasSideRoom: boolean;
  layoutGap: number;
  layoutSideWidth: number;
  regionBorder: number;
}

export interface ResolvedLayoutConfig {
  hasName: boolean;
  hasSideCamera: boolean;
  hasSideInfo: boolean;
  isCameraAboveAttached: boolean;
  isCameraGreenScreen: boolean;
  isInfoAboveAttached: boolean;
  mainNumericAspectRatio: number;
  mainRegion?: LayoutMainRegion;
  sideCameraWidth: number;
  sideContentAuxNumericAspectRatio?: number;
  sideContentAuxWidth: number;
  sideInfoNumericAspectRatio?: number;
  sideInfoWidth: number;
  sideWidthTotal: number;
}

/**
 * Decide which region takes a participant's main column and which regions stay in the side column.
 *
 * @param layoutConfig - The participant's config; a missing region takes its default and `null` turns it off.
 * @param context - The grid cell ratio for `'auto'` info, whether a side column exists, its gap and width, and the
 *   region border.
 * @returns The main region and its ratio, which regions sit in the side column with their ratios and widths, how
 *   they attach, and the total width the side column adds to the participant, `0` when nothing is in it.
 */
export const resolveLayoutConfig = (
  {
    camera = LAYOUT_CONFIG_DEFAULT.camera,
    contentMain = LAYOUT_CONFIG_DEFAULT.contentMain,
    contentAux = LAYOUT_CONFIG_DEFAULT.contentAux,
    info = LAYOUT_CONFIG_DEFAULT.info,
    hasName = LAYOUT_CONFIG_DEFAULT.hasName,
  }: LayoutConfig,
  {
    canvasGridUnitNumericAspectRatio,
    hasSideRoom,
    layoutGap,
    layoutSideWidth,
    regionBorder,
  }: ResolveLayoutConfigContext,
): ResolvedLayoutConfig => {
  // A missing field inside a region config takes that region's default
  const {
    mainAspectRatio: cameraMainAspectRatio = CAMERA_LAYOUT_CONFIG_DEFAULT.mainAspectRatio,
    isMainAttached: isCameraMainAttached = CAMERA_LAYOUT_CONFIG_DEFAULT.isMainAttached,
    isAboveAttached: isCameraAboveAttached = CAMERA_LAYOUT_CONFIG_DEFAULT.isAboveAttached,
    isGreenScreen: isCameraGreenScreen = CAMERA_LAYOUT_CONFIG_DEFAULT.isGreenScreen,
  } = camera ?? {};
  const { aspectRatio: contentMainAspectRatio = CONTENT_MAIN_LAYOUT_CONFIG_DEFAULT.aspectRatio } = contentMain ?? {};
  const {
    aspectRatio: contentAuxAspectRatio = CONTENT_AUX_LAYOUT_CONFIG_DEFAULT.aspectRatio,
    isMainAttached: isContentAuxMainAttached = CONTENT_AUX_LAYOUT_CONFIG_DEFAULT.isMainAttached,
  } = contentAux ?? {};
  const {
    aspectRatio: infoAspectRatio = INFO_LAYOUT_CONFIG_DEFAULT.aspectRatio,
    isMainAttached: isInfoMainAttached = INFO_LAYOUT_CONFIG_DEFAULT.isMainAttached,
    isAboveAttached: isInfoAboveAttached = INFO_LAYOUT_CONFIG_DEFAULT.isAboveAttached,
  } = info ?? {};
  // Turn each requested region into a numeric ratio; disabled and invalid ratios both become 0
  const contentMainNumericAspectRatio = contentMain ? transformAspectRatio(contentMainAspectRatio) : 0;
  const cameraMainNumericAspectRatio = camera ? transformAspectRatio(cameraMainAspectRatio) : 0;
  const contentAuxNumericAspectRatio = contentAux ? transformAspectRatio(contentAuxAspectRatio) : 0;
  // 'auto' info takes the grid cell's ratio so it fills the cell when it is the main region
  const infoNumericAspectRatio = !info
    ? 0
    : infoAspectRatio === 'auto'
      ? canvasGridUnitNumericAspectRatio
      : transformAspectRatio(infoAspectRatio);
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
  const hasSideCamera = hasSideRoom && camera !== null && mainRegion !== 'camera';
  const hasSideContentAux = hasSideRoom && contentAuxNumericAspectRatio > 0 && mainRegion !== 'contentAux';
  const hasSideInfo = hasSideRoom && infoNumericAspectRatio > 0 && mainRegion !== 'info';
  // A side region attached to the main region reaches across the gap to the main region's border and shares it. A
  // green screen camera fills the gaps on its own, so its attachments, and attachments to it, are ignored
  const hasMainRegion = mainRegion !== undefined && (mainRegion !== 'camera' || !isCameraGreenScreen);
  const sideAttachedWidth = layoutSideWidth + layoutGap - regionBorder;

  return {
    hasName,
    hasSideCamera,
    hasSideInfo,
    isCameraAboveAttached: isCameraAboveAttached && !isCameraGreenScreen,
    isCameraGreenScreen,
    isInfoAboveAttached,
    mainNumericAspectRatio,
    mainRegion,
    sideCameraWidth:
      isCameraMainAttached && !isCameraGreenScreen && hasMainRegion ? sideAttachedWidth : layoutSideWidth,
    sideContentAuxNumericAspectRatio: hasSideContentAux ? contentAuxNumericAspectRatio : undefined,
    sideContentAuxWidth: isContentAuxMainAttached && hasMainRegion ? sideAttachedWidth : layoutSideWidth,
    // 'auto' info has no side ratio and fills whatever the side stack leaves
    sideInfoNumericAspectRatio: hasSideInfo && infoAspectRatio !== 'auto' ? infoNumericAspectRatio : undefined,
    sideInfoWidth: isInfoMainAttached && hasMainRegion ? sideAttachedWidth : layoutSideWidth,
    // A used side column adds its width plus the gap between the columns to the participant's width
    sideWidthTotal: hasSideCamera || hasSideContentAux || hasSideInfo ? layoutGap + layoutSideWidth : 0,
  };
};

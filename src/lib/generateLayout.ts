import type { LayoutOptions } from '@/constants/layoutOptions';
import type { LayoutMetric } from '@/types/LayoutMetric';

import { LAYOUT_CONFIG_DEFAULT, type LayoutConfig } from '@/constants/layoutConfig';
import { calculateCameraHeights } from '@/lib/calculateCameraHeights';
import { calculateCanvasGrid } from '@/lib/calculateCanvasGrid';
import { calculateLayoutRegions } from '@/lib/calculateLayoutRegions';
import { calculateRowHeight } from '@/lib/calculateRowHeight';
import { calculateSideRegionHeights } from '@/lib/calculateSideRegionHeights';
import { distributeLayouts } from '@/lib/distributeLayouts';
import { findCollapsedSideIndexes } from '@/lib/findCollapsedSideIndexes';
import { placeName } from '@/lib/placeName';
import { resolveLayoutConfig } from '@/lib/resolveLayoutConfig';
import { roundLayoutMetric } from '@/lib/roundLayoutMetric';

/**
 * Lay out every participant on the canvas.
 *
 * @param layoutConfigs - One config per participant, in display order. Defaults to a single default participant.
 * @param layoutOptions - Canvas options; missing fields take their defaults.
 * @returns One layout metric per participant, in input order, with every region rounded to whole pixels.
 */
export const generateLayout = (
  layoutConfigs: LayoutConfig[] = [LAYOUT_CONFIG_DEFAULT],
  layoutOptions: LayoutOptions = {},
) => {
  if (!layoutConfigs.length) return [];

  // Split participants into rows and size the content area, gaps, and side column they all share
  const rows = distributeLayouts(layoutConfigs);
  const {
    canvasContentHeight,
    canvasContentWidth,
    canvasContentX,
    canvasContentY,
    canvasGap,
    canvasGridUnitNumericAspectRatio,
    hasSideRoom,
    layoutGap,
    layoutSideWidth,
  } = calculateCanvasGrid(layoutOptions, layoutConfigs.length);

  // Size rows, cameras, names, and side regions, without a side column for the layout configs in collapsedSideIndexes
  const calculateLayoutSizes = (collapsedSideIndexes: ReadonlySet<number> = new Set()) => {
    // Resolve each config's main and side regions, counting across rows so the collapsed indexes line up
    let layoutConfigIndex = 0;
    const resolvedRows = rows.map((rowLayoutConfigs) =>
      rowLayoutConfigs.map((layoutConfig) => {
        const resolvedLayoutConfig = resolveLayoutConfig(layoutConfig, {
          canvasGridUnitNumericAspectRatio,
          hasSideRoom: hasSideRoom && !collapsedSideIndexes.has(layoutConfigIndex),
          layoutGap,
          layoutSideWidth,
        });

        layoutConfigIndex += 1;

        return resolvedLayoutConfig;
      }),
    );
    // The row height, the shared camera and name heights, and each side stack all follow from the resolved rows
    const rowHeight = calculateRowHeight(resolvedRows, { canvasContentHeight, canvasContentWidth, canvasGap });
    const cameraHeights = calculateCameraHeights(resolvedRows.flat(), {
      hasSideRoom,
      layoutGap,
      layoutSideWidth,
      rowHeight,
    });
    const sideRegionHeightRows = resolvedRows.map((rowResolvedLayoutConfigs) =>
      rowResolvedLayoutConfigs.map((resolvedLayoutConfig) =>
        calculateSideRegionHeights(resolvedLayoutConfig, {
          cameraHeight: cameraHeights.cameraHeight,
          hasCameraRoom: cameraHeights.hasCameraRoom,
          layoutGap,
          layoutSideWidth,
          rowHeight,
        }),
      ),
    );

    return { ...cameraHeights, resolvedRows, rowHeight, sideRegionHeightRows };
  };

  // Size once, then drop the side column of layout configs whose side regions all collapsed and size again
  let layoutSizes = calculateLayoutSizes();
  const collapsedSideIndexes = findCollapsedSideIndexes(
    layoutSizes.resolvedRows.flat(),
    layoutSizes.sideRegionHeightRows.flat(),
  );

  if (collapsedSideIndexes.length) layoutSizes = calculateLayoutSizes(new Set(collapsedSideIndexes));

  const { cameraHeight, hasCameraNameRoom, nameHeight, resolvedRows, rowHeight, sideRegionHeightRows } = layoutSizes;

  // Center the rows vertically in the content area and each row's participants horizontally
  const layoutMetrics: LayoutMetric[] = [];
  const rowsTotal = resolvedRows.length;
  let rowY = canvasContentY + (canvasContentHeight - (rowHeight * rowsTotal + canvasGap * (rowsTotal - 1))) / 2;

  resolvedRows.forEach((rowResolvedLayoutConfigs, rowIndex) => {
    // Main widths follow from the row height; the row width adds the side columns and the gaps between participants
    const mainWidths = rowResolvedLayoutConfigs.map(({ mainNumericAspectRatio }) => mainNumericAspectRatio * rowHeight);
    const rowWidth = rowResolvedLayoutConfigs.reduce((acc, { sideWidthTotal }, rowLayoutConfigIndex) => {
      const gap = rowLayoutConfigIndex ? canvasGap : 0;
      return acc + gap + mainWidths[rowLayoutConfigIndex] + sideWidthTotal;
    }, 0);
    let mainX = canvasContentX + (canvasContentWidth - rowWidth) / 2;

    rowResolvedLayoutConfigs.forEach(({ hasName, mainRegion, sideWidthTotal }, rowLayoutConfigIndex) => {
      // Position the regions, place the name on its host, round, and step to the next participant
      const mainWidth = mainWidths[rowLayoutConfigIndex];
      const layoutMetric = calculateLayoutRegions(mainRegion, sideRegionHeightRows[rowIndex][rowLayoutConfigIndex], {
        cameraHeight,
        layoutGap,
        layoutSideWidth,
        mainWidth,
        mainX,
        rowHeight,
        rowY,
      });
      const name = hasName ? placeName(layoutMetric, { hasCameraNameRoom, mainRegion, nameHeight }) : undefined;

      if (name) layoutMetric.name = name;

      layoutMetrics.push(roundLayoutMetric(layoutMetric));
      mainX += mainWidth + sideWidthTotal + canvasGap;
    });

    // Step to the next row
    rowY += rowHeight + canvasGap;
  });

  return layoutMetrics;
};

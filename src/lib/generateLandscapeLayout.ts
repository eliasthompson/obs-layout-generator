import type { LayoutConfig } from '@/constants/layoutConfig';
import type { CanvasGrid } from '@/lib/calculateCanvasGrid';
import type { LayoutMetric } from '@/types/LayoutMetric';

import { calculateCameraHeights } from '@/lib/calculateCameraHeights';
import { calculateLayoutRegions } from '@/lib/calculateLayoutRegions';
import { calculateRowHeight } from '@/lib/calculateRowHeight';
import { calculateSideRegionHeights } from '@/lib/calculateSideRegionHeights';
import { distributeLayouts } from '@/lib/distributeLayouts';
import { expandGreenScreenCamera, outerNeighbor } from '@/lib/expandGreenScreenCamera';
import { findCollapsedSideIndexes } from '@/lib/findCollapsedSideIndexes';
import { placeName } from '@/lib/placeName';
import { resolveLayoutConfig } from '@/lib/resolveLayoutConfig';
import { roundLayoutMetric } from '@/lib/roundLayoutMetric';

/**
 * Lay out every participant on a landscape canvas: rows of cells, each with its main column and a side column to
 * its right.
 *
 * @param layoutConfigs - One config per participant, in display order.
 * @param canvasGrid - The canvas grid for these participants, with the resolved options it carries.
 * @returns One layout metric per participant, in input order, with every region rounded to whole pixels.
 */
export const generateLandscapeLayout = (
  layoutConfigs: LayoutConfig[],
  {
    cameraNumericAspectRatioMax,
    cameraNumericAspectRatioMin,
    canvasContentHeight,
    canvasContentWidth,
    canvasContentX,
    canvasContentY,
    canvasGap,
    canvasGridUnitNumericAspectRatio,
    canvasLayoutHeight,
    canvasLayoutWidth,
    canvasLayoutX,
    canvasLayoutY,
    canvasPadding,
    hasSideRoom,
    layoutGap,
    layoutSideWidth,
    nameHeightMin,
    namePosition,
    regionBorder,
  }: CanvasGrid,
): LayoutMetric[] => {
  // Split participants into rows
  const rows = distributeLayouts(layoutConfigs);

  // Size rows, cameras, names, and side regions, without a side column for the layout configs in collapsedSideIndexes
  const calculateLayoutSizes = (collapsedSideIndexes: ReadonlySet<number> = new Set()) => {
    // Resolve each config's main and side regions, counting across rows so the collapsed indexes line up
    let layoutConfigIndex = 0;
    const resolvedRows = rows.map((rowLayoutConfigs) =>
      rowLayoutConfigs.map((layoutConfig) => {
        const resolvedLayoutConfig = resolveLayoutConfig(layoutConfig, {
          cameraNumericAspectRatioMax,
          cameraNumericAspectRatioMin,
          canvasGridUnitNumericAspectRatio,
          hasSideRoom: hasSideRoom && !collapsedSideIndexes.has(layoutConfigIndex),
          layoutGap,
          layoutSideWidth,
          regionBorder,
        });

        layoutConfigIndex += 1;

        return resolvedLayoutConfig;
      }),
    );
    // The row height, the shared camera and name heights, and each side stack all follow from the resolved rows
    const rowHeight = calculateRowHeight(resolvedRows, { canvasContentHeight, canvasContentWidth, canvasGap });
    const cameraHeights = calculateCameraHeights(resolvedRows.flat(), {
      cameraNumericAspectRatioMin,
      hasSideRoom,
      layoutGap,
      rowHeight,
    });
    const sideRegionHeightRows = resolvedRows.map((rowResolvedLayoutConfigs) =>
      rowResolvedLayoutConfigs.map((resolvedLayoutConfig) =>
        calculateSideRegionHeights(resolvedLayoutConfig, {
          cameraHeight: cameraHeights.cameraHeight,
          hasCameraRoom: cameraHeights.hasCameraRoom,
          layoutGap,
          regionBorder,
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

  const { cameraHeight, hasCameraNameRoom, nameHeightMax, resolvedRows, rowHeight, sideRegionHeightRows } = layoutSizes;

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

    rowResolvedLayoutConfigs.forEach((resolvedLayoutConfig, rowLayoutConfigIndex) => {
      // Position the regions, expand a green screen camera, place the name on its host, round, and step on
      const { hasName, isCameraGreenScreen, mainRegion, sideWidthTotal } = resolvedLayoutConfig;
      const mainWidth = mainWidths[rowLayoutConfigIndex];
      const layoutMetric = calculateLayoutRegions(
        resolvedLayoutConfig,
        sideRegionHeightRows[rowIndex][rowLayoutConfigIndex],
        {
          cameraHeight,
          cameraNumericAspectRatioMin,
          layoutGap,
          layoutSideWidth,
          mainWidth,
          mainX,
          regionBorder,
          rowHeight,
          rowY,
        },
      );

      if (layoutMetric.camera && isCameraGreenScreen) {
        // A side camera faces the main column and whatever stacks above it across the layout gap, and a main
        // camera faces its side column; every other edge faces another participant or row, or the margin
        const isMainCamera = mainRegion === 'camera';
        const isLastInRow = rowLayoutConfigIndex === rowResolvedLayoutConfigs.length - 1;

        layoutMetric.camera = expandGreenScreenCamera(layoutMetric.camera, {
          canvasGap,
          canvasLayoutHeight,
          canvasLayoutWidth,
          canvasLayoutX,
          canvasLayoutY,
          canvasPadding,
          layoutGap,
          neighbors: {
            left: isMainCamera ? outerNeighbor(rowLayoutConfigIndex === 0) : 'layout',
            top: isMainCamera ? outerNeighbor(rowIndex === 0) : 'layout',
            right: isMainCamera && sideWidthTotal > 0 ? 'layout' : outerNeighbor(isLastInRow),
            bottom: outerNeighbor(rowIndex === rowsTotal - 1),
          },
          regionBorder,
        });
      }

      const name = hasName
        ? placeName(layoutMetric, { hasCameraNameRoom, mainRegion, nameHeightMax, nameHeightMin, namePosition })
        : undefined;

      if (name) layoutMetric.name = name;

      layoutMetrics.push(roundLayoutMetric(layoutMetric));
      mainX += mainWidth + sideWidthTotal + canvasGap;
    });

    // Step to the next row
    rowY += rowHeight + canvasGap;
  });

  return layoutMetrics;
};

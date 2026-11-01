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
    cameraNumericAspectRatioDefault,
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
    nameHeightMax,
    nameHeightMin,
    namePosition,
    regionBorder,
  }: CanvasGrid,
): LayoutMetric[] => {
  // Split participants into rows
  const rows = distributeLayouts(layoutConfigs);

  // Size rows, cameras, and side regions, without a side column for the layout configs in collapsedSideIndexes
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
    // The row height, the shared camera height, and each side stack all follow from the resolved rows
    const rowHeight = calculateRowHeight(resolvedRows, { canvasContentHeight, canvasContentWidth, canvasGap });
    // Main widths follow from the row height. A main region that may grow taller, an 'auto' main camera, keeps its
    // width and grows into the height the row's even share of the content area leaves, down to its narrowest ratio,
    // and its side column takes that height too
    const rowHeightEven = (canvasContentHeight + canvasGap) / rows.length - canvasGap;
    const mainWidthRows = resolvedRows.map((rowResolvedLayoutConfigs) =>
      rowResolvedLayoutConfigs.map(({ mainNumericAspectRatio }) => mainNumericAspectRatio * rowHeight),
    );
    const heightRows = resolvedRows.map((rowResolvedLayoutConfigs, rowIndex) =>
      rowResolvedLayoutConfigs.map(({ mainNumericAspectRatioMin }, rowLayoutConfigIndex) =>
        mainNumericAspectRatioMin === undefined
          ? rowHeight
          : Math.max(
              rowHeight,
              Math.min(rowHeightEven, mainWidthRows[rowIndex][rowLayoutConfigIndex] / mainNumericAspectRatioMin),
            ),
      ),
    );
    const cameraHeights = calculateCameraHeights(resolvedRows.flat(), {
      cameraNumericAspectRatioDefault,
      cameraNumericAspectRatioMax,
      cameraNumericAspectRatioMin,
      hasSideRoom,
      layoutGap,
      regionBorder,
      rowHeight,
    });
    const sideRegionHeightRows = resolvedRows.map((rowResolvedLayoutConfigs, rowIndex) =>
      rowResolvedLayoutConfigs.map((resolvedLayoutConfig, rowLayoutConfigIndex) =>
        calculateSideRegionHeights(resolvedLayoutConfig, {
          cameraHeight: cameraHeights.cameraHeight,
          hasCameraRoom: cameraHeights.hasCameraRoom,
          layoutGap,
          regionBorder,
          rowHeight: heightRows[rowIndex][rowLayoutConfigIndex],
        }),
      ),
    );

    return { ...cameraHeights, heightRows, mainWidthRows, resolvedRows, sideRegionHeightRows };
  };

  // Size once, then drop the side column of layout configs whose side regions all collapsed and size again
  let layoutSizes = calculateLayoutSizes();
  const collapsedSideIndexes = findCollapsedSideIndexes(
    layoutSizes.resolvedRows.flat(),
    layoutSizes.sideRegionHeightRows.flat(),
  );

  if (collapsedSideIndexes.length) layoutSizes = calculateLayoutSizes(new Set(collapsedSideIndexes));

  const { cameraHeight, heightRows, mainWidthRows, resolvedRows, sideRegionHeightRows } = layoutSizes;

  // Center the rows vertically in the content area, each as tall as its tallest participant, and each row's
  // participants horizontally, and vertically within the row
  const layoutMetrics: LayoutMetric[] = [];
  const rowsTotal = resolvedRows.length;
  const rowHeights = heightRows.map((heights) => Math.max(...heights));
  const rowsHeight = rowHeights.reduce((total, height) => total + height, 0) + canvasGap * (rowsTotal - 1);
  let rowY = canvasContentY + (canvasContentHeight - rowsHeight) / 2;

  resolvedRows.forEach((rowResolvedLayoutConfigs, rowIndex) => {
    // The row width adds the side columns and the gaps between participants to the main widths
    const mainWidths = mainWidthRows[rowIndex];
    const rowWidth = rowResolvedLayoutConfigs.reduce((acc, { sideWidthTotal }, rowLayoutConfigIndex) => {
      const gap = rowLayoutConfigIndex ? canvasGap : 0;
      return acc + gap + mainWidths[rowLayoutConfigIndex] + sideWidthTotal;
    }, 0);
    let mainX = canvasContentX + (canvasContentWidth - rowWidth) / 2;

    rowResolvedLayoutConfigs.forEach((resolvedLayoutConfig, rowLayoutConfigIndex) => {
      // Position the regions, expand a green screen camera, place the name on its host, round, and step on
      const { hasName, isCameraGreenScreen, mainRegion, sideWidthTotal } = resolvedLayoutConfig;
      const mainWidth = mainWidths[rowLayoutConfigIndex];
      const height = heightRows[rowIndex][rowLayoutConfigIndex];
      const y = rowY + (rowHeights[rowIndex] - height) / 2;
      const layoutMetric = calculateLayoutRegions(
        resolvedLayoutConfig,
        sideRegionHeightRows[rowIndex][rowLayoutConfigIndex],
        {
          cameraHeight,
          cameraNumericAspectRatioMax,
          cameraNumericAspectRatioMin,
          layoutGap,
          layoutSideWidth,
          mainWidth,
          mainX,
          regionBorder,
          rowHeight: height,
          rowY: y,
        },
      );

      if (layoutMetric.camera && isCameraGreenScreen) {
        // A side camera faces the main column and whatever stacks above it across the layout gap, unless it reaches
        // within a layout gap of the row top, where it faces what the row does; a main camera faces its side column.
        // Every other edge faces another participant or row, or the margin
        const isMainCamera = mainRegion === 'camera';
        const isLastInRow = rowLayoutConfigIndex === rowResolvedLayoutConfigs.length - 1;
        const isCameraAtRowTop = isMainCamera || layoutMetric.camera.y - y < layoutGap;

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
            top: isCameraAtRowTop ? outerNeighbor(rowIndex === 0) : 'layout',
            right: isMainCamera && sideWidthTotal > 0 ? 'layout' : outerNeighbor(isLastInRow),
            bottom: outerNeighbor(rowIndex === rowsTotal - 1),
          },
          regionBorder,
        });
      }

      const name = hasName
        ? placeName(layoutMetric, { mainRegion, nameHeightMax, nameHeightMin, namePosition })
        : undefined;

      if (name) layoutMetric.name = name;

      layoutMetrics.push(roundLayoutMetric(layoutMetric));
      mainX += mainWidth + sideWidthTotal + canvasGap;
    });

    // Step to the next row
    rowY += rowHeights[rowIndex] + canvasGap;
  });

  return layoutMetrics;
};

import type { LayoutConfig } from '@/constants/layoutConfig';
import type { CanvasGrid } from '@/lib/calculateCanvasGrid';
import type { LayoutMetric } from '@/types/LayoutMetric';

import { calculateColumnWidth } from '@/lib/calculateColumnWidth';
import { calculatePortraitLayoutRegions } from '@/lib/calculatePortraitLayoutRegions';
import { calculateSideRowHeight } from '@/lib/calculateSideRowHeight';
import { calculateSideRowSizes } from '@/lib/calculateSideRowSizes';
import { distributeLayouts } from '@/lib/distributeLayouts';
import { expandGreenScreenCamera, outerNeighbor } from '@/lib/expandGreenScreenCamera';
import { placeName } from '@/lib/placeName';
import { resolveLayoutConfig } from '@/lib/resolveLayoutConfig';
import { roundLayoutMetric } from '@/lib/roundLayoutMetric';

/**
 * Lay out every participant on a portrait canvas: columns of cells, each with its main region at the top and a side
 * row beneath it.
 *
 * @param layoutConfigs - One config per participant, in display order.
 * @param canvasGrid - The canvas grid for these participants.
 * @param nameHeightMin - The smallest name tag height.
 * @returns One layout metric per participant, in input order, with every region rounded to whole pixels.
 */
export const generatePortraitLayout = (
  layoutConfigs: LayoutConfig[],
  {
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
    layoutGap,
    layoutSideMin,
    regionBorder,
  }: CanvasGrid,
  nameHeightMin: number,
): LayoutMetric[] => {
  // The balanced rows read as columns: the first columns take any extra participants, filled top to bottom
  const columns = distributeLayouts(layoutConfigs);
  // Every participant may have a side row, so there is always side room; the side column width is landscape-only
  const resolvedColumns = columns.map((columnLayoutConfigs) =>
    columnLayoutConfigs.map((layoutConfig) =>
      resolveLayoutConfig(layoutConfig, {
        canvasGridUnitNumericAspectRatio,
        hasSideRoom: true,
        layoutGap,
        layoutSideWidth: 0,
        regionBorder,
      }),
    ),
  );
  // The column width and cell height, then the shared side row height and name cap, follow from the resolved columns
  const { cellHeight, columnWidth } = calculateColumnWidth(resolvedColumns, {
    canvasContentHeight,
    canvasContentWidth,
    canvasGap,
    layoutGap,
    layoutSideMin,
  });
  const { nameHeightMax, sharedHeight } = calculateSideRowHeight(resolvedColumns.flat(), {
    cellHeight,
    columnWidth,
    layoutGap,
    regionBorder,
  });

  // Center the columns horizontally in the content area and each column's cells vertically
  const layoutMetrics: LayoutMetric[] = [];
  const columnsTotal = resolvedColumns.length;
  let cellX = canvasContentX + (canvasContentWidth - (columnWidth * columnsTotal + canvasGap * (columnsTotal - 1))) / 2;

  resolvedColumns.forEach((columnResolvedLayoutConfigs, columnIndex) => {
    const cellsTotal = columnResolvedLayoutConfigs.length;
    let cellY = canvasContentY + (canvasContentHeight - (cellHeight * cellsTotal + canvasGap * (cellsTotal - 1))) / 2;

    columnResolvedLayoutConfigs.forEach((resolvedLayoutConfig, cellIndex) => {
      // Size and position the regions, expand a green screen camera, place the name on its host, round, and step on
      const { hasName, isCameraGreenScreen, mainRegion } = resolvedLayoutConfig;
      const sideRowSizes = calculateSideRowSizes(resolvedLayoutConfig, {
        cellHeight,
        columnWidth,
        layoutGap,
        regionBorder,
        sharedHeight,
      });
      // The main region and its side row are centered vertically in the cell; a shown side region claims the gap
      // even when the row below the gap has no height, as an attached camera that fits inside the gap does
      const { mainHeight, sideRowHeight, cameraWidth, contentAuxWidth, infoWidth } = sideRowSizes;
      const hasSideRegion = cameraWidth > 0 || contentAuxWidth > 0 || infoWidth > 0;
      const usedHeight = mainHeight + (hasSideRegion ? layoutGap + sideRowHeight : 0);
      const layoutMetric = calculatePortraitLayoutRegions(resolvedLayoutConfig, sideRowSizes, {
        cellX,
        cellY: cellY + (cellHeight - usedHeight) / 2,
        columnWidth,
        layoutGap,
        regionBorder,
      });

      if (layoutMetric.camera && isCameraGreenScreen) {
        // A side camera faces its main region above and any side region to its left across the layout gap, and a
        // main camera faces its side row below; every other edge faces another participant or column, or the margin
        const isMainCamera = mainRegion === 'camera';
        const hasSideRegions = Boolean(layoutMetric.contentAux ?? layoutMetric.info);
        const isFirstColumn = columnIndex === 0;
        const isLastColumn = columnIndex === columnsTotal - 1;
        const isFirstCell = cellIndex === 0;
        const isLastCell = cellIndex === cellsTotal - 1;

        layoutMetric.camera = expandGreenScreenCamera(layoutMetric.camera, {
          canvasGap,
          canvasLayoutHeight,
          canvasLayoutWidth,
          canvasLayoutX,
          canvasLayoutY,
          layoutGap,
          neighbors: {
            left: !isMainCamera && hasSideRegions ? 'layout' : outerNeighbor(isFirstColumn),
            top: isMainCamera ? outerNeighbor(isFirstCell) : 'layout',
            right: outerNeighbor(isLastColumn),
            bottom: isMainCamera && hasSideRegions ? 'layout' : outerNeighbor(isLastCell),
          },
          regionBorder,
        });
      }

      const name = hasName
        ? placeName(layoutMetric, {
            hasCameraNameRoom: sideRowSizes.cameraHeight >= nameHeightMax,
            mainRegion,
            nameHeightMax,
            nameHeightMin,
          })
        : undefined;

      if (name) layoutMetric.name = name;

      layoutMetrics.push(roundLayoutMetric(layoutMetric));
      cellY += cellHeight + canvasGap;
    });

    cellX += columnWidth + canvasGap;
  });

  return layoutMetrics;
};

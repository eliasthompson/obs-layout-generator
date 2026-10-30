import type { LayoutConfig } from '@/constants/layoutConfig';
import type { CanvasGrid } from '@/lib/calculateCanvasGrid';
import type { SideRowSizes } from '@/lib/calculateSideRowSizes';
import type { LayoutMetric } from '@/types/LayoutMetric';

import { calculateColumnWidth } from '@/lib/calculateColumnWidth';
import { calculatePortraitLayoutRegions } from '@/lib/calculatePortraitLayoutRegions';
import { calculateSideRowHeight } from '@/lib/calculateSideRowHeight';
import { calculateSideRowSizes, canSplitInfoRow } from '@/lib/calculateSideRowSizes';
import { distributeLayouts } from '@/lib/distributeLayouts';
import { expandGreenScreenCamera, outerNeighbor } from '@/lib/expandGreenScreenCamera';
import { placeName } from '@/lib/placeName';
import { resolveLayoutConfig } from '@/lib/resolveLayoutConfig';
import { roundLayoutMetric } from '@/lib/roundLayoutMetric';

/**
 * Lay out every participant on a portrait canvas: columns of cells, each with its main region at the top and a side
 * row beneath it. The participants split into whichever number of columns gives the widest columns, and ratio info
 * takes a row of its own between the two, in columns narrowed to fit it, when that leaves the smallest region larger.
 *
 * @param layoutConfigs - One config per participant, in display order.
 * @param canvasGrid - The canvas grid for these participants, with the resolved options it carries.
 * @returns One layout metric per participant, in input order, with every region rounded to whole pixels.
 */
export const generatePortraitLayout = (
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
    canvasLayoutHeight,
    canvasLayoutWidth,
    canvasLayoutX,
    canvasLayoutY,
    canvasPadding,
    layoutGap,
    layoutSideMin,
    nameHeightMax,
    nameHeightMin,
    namePosition,
    regionBorder,
  }: CanvasGrid,
): LayoutMetric[] => {
  if (!layoutConfigs.length) return [];

  // Split the participants into a number of columns, the first columns taking any extra participants, filled top to
  // bottom, and size the columns and cells that split gives, with ratio info in the side row or in a row of its own
  const arrangeColumns = (columnsTotal: number, isInfoRowSplit: boolean) => {
    const columns = distributeLayouts(layoutConfigs, columnsTotal);
    // 'auto' info fills the cell this split gives it
    const cellWidth = (canvasContentWidth + canvasGap) / columns.length - canvasGap;
    const cellHeightEven = (canvasContentHeight + canvasGap) / columns[0].length - canvasGap;
    // Every participant may have a side row, so there is always side room; the side column width is landscape-only
    const resolvedColumns = columns.map((columnLayoutConfigs) =>
      columnLayoutConfigs.map((layoutConfig) =>
        resolveLayoutConfig(layoutConfig, {
          cameraNumericAspectRatioMax,
          cameraNumericAspectRatioMin,
          canvasGridUnitNumericAspectRatio: cellHeightEven > 0 ? cellWidth / cellHeightEven : 0,
          hasSideRoom: true,
          layoutGap,
          layoutSideWidth: 0,
          regionBorder,
        }),
      ),
    );

    return {
      ...calculateColumnWidth(resolvedColumns, {
        cameraNumericAspectRatioMax,
        canvasContentHeight,
        canvasContentWidth,
        canvasGap,
        isInfoRowSplit,
        layoutGap,
        layoutSideMin,
        regionBorder,
      }),
      resolvedColumns,
    };
  };

  // Keep the split with the widest columns, so the main regions are as large as the content area allows: participants
  // stack where the canvas is tall enough for their side rows, and sit side by side where not. Ties keep fewer
  // columns. Then size every participant's side row in those columns, the shared side row height following from them
  const arrangeLayout = (isInfoRowSplit: boolean) => {
    let columnLayout = arrangeColumns(1, isInfoRowSplit);

    for (let columnsTotal = 2; columnsTotal <= layoutConfigs.length; columnsTotal += 1) {
      const candidateColumnLayout = arrangeColumns(columnsTotal, isInfoRowSplit);

      if (candidateColumnLayout.columnWidth > columnLayout.columnWidth) columnLayout = candidateColumnLayout;
    }

    const { cellHeight, columnWidth, resolvedColumns } = columnLayout;
    const { sharedHeight } = calculateSideRowHeight(resolvedColumns.flat(), {
      cameraNumericAspectRatioMax,
      cameraNumericAspectRatioMin,
      cellHeight,
      columnWidth,
      isInfoRowSplit,
      layoutGap,
      regionBorder,
    });
    const columnsSideRowSizes = resolvedColumns.map((columnResolvedLayoutConfigs) =>
      columnResolvedLayoutConfigs.map((resolvedLayoutConfig) =>
        calculateSideRowSizes(resolvedLayoutConfig, {
          cameraNumericAspectRatioDefault,
          cameraNumericAspectRatioMax,
          cameraNumericAspectRatioMin,
          cellHeight,
          columnWidth,
          isInfoRowSplit,
          layoutGap,
          regionBorder,
          sharedHeight,
        }),
      ),
    );

    return { ...columnLayout, columnsSideRowSizes };
  };
  // Every main and side region's area, smallest first, a region that did not fit counting as nothing
  const sortRegionAreas = ({
    columnWidth,
    columnsSideRowSizes,
  }: {
    columnWidth: number;
    columnsSideRowSizes: SideRowSizes[][];
  }) =>
    columnsSideRowSizes
      .flat()
      .flatMap(
        ({ mainHeight, contentAuxWidth, contentAuxHeight, infoWidth, infoHeight, cameraWidth, cameraHeight }) => [
          columnWidth * mainHeight,
          contentAuxWidth * contentAuxHeight,
          infoWidth * infoHeight,
          cameraWidth * cameraHeight,
        ],
      )
      .sort((area, otherArea) => area - otherArea);

  // Split the info rows when that makes the smallest region larger, the columns narrowed for the info rows, comparing
  // the next smallest on a tie to the whole pixel, and keep the info in the side rows when every area ties
  let layout = arrangeLayout(false);

  if (
    layout.resolvedColumns
      .flat()
      .some((resolvedLayoutConfig) => canSplitInfoRow(resolvedLayoutConfig, cameraNumericAspectRatioMax))
  ) {
    const splitLayout = arrangeLayout(true);
    const areas = sortRegionAreas(layout);
    const splitAreas = sortRegionAreas(splitLayout);
    const areaIndex = areas.findIndex((area, index) => Math.round(area) !== Math.round(splitAreas[index]));

    if (areaIndex >= 0 && splitAreas[areaIndex] > areas[areaIndex]) layout = splitLayout;
  }

  const { columnWidth, columnsSideRowSizes, resolvedColumns } = layout;

  // Center the columns horizontally in the content area
  const layoutMetrics: LayoutMetric[] = [];
  const columnsTotal = resolvedColumns.length;
  let cellX = canvasContentX + (canvasContentWidth - (columnWidth * columnsTotal + canvasGap * (columnsTotal - 1))) / 2;

  resolvedColumns.forEach((columnResolvedLayoutConfigs, columnIndex) => {
    // Stack the column's participants a canvas gap apart and center the stack vertically, so a participant shorter
    // than its cell leaves the room at the ends of the column rather than between participants. An info row claims
    // its gap, and a shown side region claims the gap even when the row below the gap has no height, as an attached
    // camera that fits inside the gap does
    const cellsTotal = columnResolvedLayoutConfigs.length;
    const columnSideRowSizes = columnsSideRowSizes[columnIndex];
    const usedHeights = columnSideRowSizes.map(
      ({ mainHeight, infoRowHeight, sideRowHeight, cameraWidth, contentAuxWidth, infoWidth }) =>
        mainHeight +
        (infoRowHeight ? layoutGap + infoRowHeight : 0) +
        (cameraWidth > 0 || contentAuxWidth > 0 || (infoWidth > 0 && !infoRowHeight) ? layoutGap + sideRowHeight : 0),
    );
    const columnHeight =
      usedHeights.reduce((total, usedHeight) => total + usedHeight, 0) + canvasGap * (cellsTotal - 1);
    let cellY = canvasContentY + (canvasContentHeight - columnHeight) / 2;

    columnResolvedLayoutConfigs.forEach((resolvedLayoutConfig, cellIndex) => {
      // Position the regions, expand a green screen camera, place the name on its host, round, and step on
      const { hasName, isCameraGreenScreen, mainRegion } = resolvedLayoutConfig;
      const sideRowSizes = columnSideRowSizes[cellIndex];
      const layoutMetric = calculatePortraitLayoutRegions(resolvedLayoutConfig, sideRowSizes, {
        cellX,
        cellY,
        columnWidth,
        layoutGap,
        regionBorder,
      });

      if (layoutMetric.camera && isCameraGreenScreen) {
        // A side camera faces the region above it and any side region to its left in its row across the layout gap,
        // and a main camera faces the rows below; every other edge faces another participant or column, or the margin
        const isMainCamera = mainRegion === 'camera';
        const hasSideRegions = Boolean(layoutMetric.contentAux ?? layoutMetric.info);
        const hasRowRegions = Boolean(
          layoutMetric.contentAux ?? (sideRowSizes.infoRowHeight ? undefined : layoutMetric.info),
        );
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
          canvasPadding,
          layoutGap,
          neighbors: {
            left: !isMainCamera && hasRowRegions ? 'layout' : outerNeighbor(isFirstColumn),
            top: isMainCamera ? outerNeighbor(isFirstCell) : 'layout',
            right: outerNeighbor(isLastColumn),
            bottom: isMainCamera && hasSideRegions ? 'layout' : outerNeighbor(isLastCell),
          },
          regionBorder,
        });
      }

      const name = hasName
        ? placeName(layoutMetric, { mainRegion, nameHeightMax, nameHeightMin, namePosition })
        : undefined;

      if (name) layoutMetric.name = name;

      layoutMetrics.push(roundLayoutMetric(layoutMetric));
      cellY += usedHeights[cellIndex] + canvasGap;
    });

    cellX += columnWidth + canvasGap;
  });

  return layoutMetrics;
};

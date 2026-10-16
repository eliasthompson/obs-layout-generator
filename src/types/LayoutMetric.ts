export interface LayoutMetricItem {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutMetric {
  camera?: LayoutMetricItem;
  contentMain?: LayoutMetricItem;
  contentAux?: LayoutMetricItem;
  info?: LayoutMetricItem;
  name?: LayoutMetricItem;
}

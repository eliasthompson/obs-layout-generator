export interface LayoutRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutMetric {
  camera?: LayoutRegion;
  contentMain?: LayoutRegion;
  contentAux?: LayoutRegion;
  info?: LayoutRegion;
  name?: LayoutRegion;
}

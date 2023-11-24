// TileGrid
export type TileRef = [number, number, number];

export interface MapTile {
  ref: TileRef;
  tileId: string;
  featureSet: any[];
}

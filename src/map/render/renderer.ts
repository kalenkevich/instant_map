import { MapTile } from '../tile/tile';
import { MapState } from '../map_state';
import { GlideMap } from '../map';
import { DataTileStyles } from '../styles/styles';

export enum MapRendererType {
  webgl = 'webgl',
  threejs = 'threejs',
  png = 'png',
  // svg = 'svg', // not supported yet.
  // webgl2 = 'webgl2', // not supported yet.
  // webgpu = 'webgpu', // not supported yet.
}

export interface RenderingCache {}

export abstract class MapRenderer {
  constructor(protected readonly map: GlideMap, protected readonly devicePixelRatio: number) {}

  public abstract init(): void;

  public abstract renderTiles(tiles: MapTile[], styles: DataTileStyles, mapState: MapState): void;

  public abstract preheatTiles(tiles: MapTile[], styles: DataTileStyles, mapState: MapState): void;

  public abstract stopRender(): void;

  public abstract destroy(): void;

  protected getTileScale(mapState: MapState): number {
    const tileZoom = this.getTileZoom(mapState);

    return this.map.getZoomScale(mapState.zoom, tileZoom);
  }

  protected getTileZoom(mapState: MapState): number | undefined {
    let tileZoom = Math.round(mapState.zoom);

    if (tileZoom > this.map.getMaxZoom() || tileZoom < this.map.getMinZoom()) {
      return undefined;
    }

    return this.clampZoom(tileZoom);
  }

  protected clampZoom(zoom: number) {
    const minZoom = this.map.getMinZoom();
    const maxZoom = this.map.getMaxZoom();

    if (zoom < minZoom) {
      return minZoom;
    }

    if (maxZoom < zoom) {
      return maxZoom;
    }

    return zoom;
  }
}

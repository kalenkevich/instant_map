import { MapTile } from '../tile/tile';
import { MapState } from '../map_state';
import { GlideMap } from '../map';
import { DataTileStyles } from '../styles/styles';

export enum MapRendererType {
  webgl = 'webgl',
  png = 'png',
  // svg = 'svg', // not supported yet.
  // webgpu = 'webgpu', // not supported yet.
}

export interface RenderingCache {}

export interface RenderStats {
  timeInMs: number;
  tiles: number;
}

export abstract class MapRenderer {
  constructor(protected readonly map: GlideMap, protected readonly devicePixelRatio: number) {}

  public abstract init(): void;

  public abstract renderTiles(tiles: MapTile[], styles: DataTileStyles, mapState: MapState): RenderStats;

  public abstract preheatTiles(tiles: MapTile[], styles: DataTileStyles, mapState: MapState): RenderStats;

  public abstract stopRender(): void;

  public abstract destroy(): void;

  protected getTileScale(tileSize: number, mapState: MapState): number {
    const tileZoom = this.getTileZoom(mapState);

    return this.map.getZoomScale(mapState.zoom, tileZoom, tileSize);
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

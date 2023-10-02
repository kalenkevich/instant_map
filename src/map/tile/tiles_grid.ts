import { MapState } from '../map_state';
import { MapTilesMeta } from '../types';
import { MapTile, MapTileFormatType, MapTileOptions, MapTileId, TileCoordinate, DEFAULT_TILE_SIZE } from './tile';
import { Point } from '../geometry/point';
import { Bounds } from '../geometry/bounds';
import { GlideMap } from '../map';
import { LatLngBounds } from '../geo/lat_lng_bounds';
import { PbfMapTile } from './pbf_tile';
import { PngMapTile } from './png_tile';

export interface TilesGridOptions {
  tilesMeta: MapTilesMeta;
  tileFormatType: MapTileFormatType;
  devicePixelRatio?: number;
}

/**
 * This class suppouse to handle all actions with tiles: load, unload, etc.
 */
export class TilesGrid {
  map: GlideMap;
  tileFormatType: MapTileFormatType;
  tilesCache: Map<MapTileId, MapTile>;
  renderedTiles: Array<MapTile> = [];
  tilesMeta: MapTilesMeta;
  devicePixelRatio: number;

  defaultTileSize: number;
  tileZoom: number;

  fetchInProgress = false;
  fetchingTilesMap: Map<string, AbortController> = new Map();

  constructor(map: GlideMap, options: TilesGridOptions) {
    this.map = map;
    this.tilesMeta = options.tilesMeta;
    this.tileFormatType = options.tileFormatType;
    this.devicePixelRatio = options.devicePixelRatio || window.devicePixelRatio || 1;
    this.tilesCache = new Map<MapTileId, MapTile>();
  }

  public async init(mapState: MapState) {
    this.defaultTileSize = DEFAULT_TILE_SIZE;
  }

  getTileRange(tileZoom: number, mapState: MapState) {
    const bounds = this.map.getPixelWorldBounds(tileZoom);

    return this.pxBoundsToTileRange(bounds, mapState);
  }

  public async update(mapState: MapState): Promise<MapTile[]> {
    const tilesToRender = this.getTilesToRender(mapState);

    return this.fetchTiles(tilesToRender);
  }

  private async fetchTiles(tilesToRender: MapTile[]): Promise<MapTile[]> {
    if (!this.tilesMeta) {
      throw new Error('Tiles meta is not defined.');
    }

    const tilesPromises: Promise<MapTile>[] = [];

    this.fetchInProgress = true;

    for (const alreadyFetchingTileId of this.fetchingTilesMap.keys()) {
      const tileToFetch = tilesToRender.find(tile => tile.id === alreadyFetchingTileId);

      if (!tileToFetch) {
        this.fetchingTilesMap.get(alreadyFetchingTileId).abort();
        this.fetchingTilesMap.delete(alreadyFetchingTileId);
        this.tilesCache.delete(alreadyFetchingTileId);
      }
    }

    for (const tile of tilesToRender) {
      if (this.tilesCache.has(tile.id) || this.fetchingTilesMap.has(tile.id)) {
        continue;
      }

      const abortController = new AbortController();

      this.fetchingTilesMap.set(tile.id, abortController);

      tilesPromises.push(
        tile
          .fetchTileData(abortController.signal)
          .then(() => {
            this.tilesCache.set(tile.id, tile);

            return tile;
          })
          .finally(() => this.fetchingTilesMap.delete(tile.id))
      );
    }

    try {
      await Promise.all(tilesPromises);

      this.fetchInProgress = false;

      return tilesToRender.map(ttr => {
        const tile = this.tilesCache.get(ttr.id);

        tile.resetState(ttr);

        return tile;
      });
    } catch (e) {
      this.fetchInProgress = false;

      return [];
    }
  }

  getTileZoom(mapState: MapState): number | undefined {
    return this.clampZoom(Math.round(mapState.zoom));
  }

  clampZoom(zoom: number) {
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

  private getTilesToRender(mapState: MapState): MapTile[] {
    const tileSize = (parseInt(this.tilesMeta.pixel_scale) || DEFAULT_TILE_SIZE);
    const tileZoom = this.getTileZoom(mapState);
    const pixelBounds = this.getTiledPixelBounds(mapState);
    const tileRange = this.pxBoundsToTileRange(pixelBounds, mapState);

    // const dx = tileRange.max.x - tileRange.min.x;
    // const dy = tileRange.max.y - tileRange.min.y;
    // tileRange.max.x += dx * (this.devicePixelRatio - 1);
    // tileRange.max.y += dy * (this.devicePixelRatio - 1);

    const tilesCoords: TileCoordinate[] = [];
    for (let j = tileRange.min.y; j <= tileRange.max.y; j++) {
      for (let i = tileRange.min.x; i <= tileRange.max.x; i++) {
        const coords: TileCoordinate = {
          x: i,
          y: j,
          z: tileZoom,
        };

        if (!this.isValidTile(coords, tileZoom, mapState)) {
          continue;
        }

        tilesCoords.push(coords);
      }
    }
    const minXTileCoord = Math.min(...tilesCoords.map(t => t.x));
    const minYTileCoord = Math.min(...tilesCoords.map(t => t.y));

    return tilesCoords.map(tileCoords =>
      this.getMapTile({
        id: getTileId(tileCoords),
        formatType: this.tileFormatType,
        x: (tileCoords.x - minXTileCoord) * tileSize,
        y: (tileCoords.y - minYTileCoord) * tileSize,
        width: tileSize,
        height: tileSize,
        mapWidth: this.map.getWidth(),
        mapHeight: this.map.getHeight(),
        tileCoords: {
          x: tileCoords.x,
          y: tileCoords.y,
          z: tileCoords.z,
        },
        pixelRatio: this.devicePixelRatio,
        tilesMeta: this.tilesMeta,
      })
    );
  }

  private getMapTile(createOptions: MapTileOptions): MapTile {
    switch (createOptions.formatType) {
      case MapTileFormatType.pbf:
        return new PbfMapTile(createOptions);

      case MapTileFormatType.png:
        return new PngMapTile(createOptions);
    }
  }

  isValidTile(coords: TileCoordinate, tileZoom: number, mapState: MapState): boolean {
    const crs = this.map.crs;

    if (!crs.infinite) {
      // don't load tile if it's out of bounds and not wrapped
      const bounds = this.getTileRange(tileZoom, mapState);
      if ((!crs.wrapLng && (coords.x < bounds.min.x || coords.x > bounds.max.x)) || (!crs.wrapLat && (coords.y < bounds.min.y || coords.y > bounds.max.y))) {
        return false;
      }
    }

    // const bounds = this.map.getPixelWorldBounds(tileZoom);

    const bounds = this.map.bounds;

    if (!bounds) {
      return true;
    }

    const tileBounds = this.tileCoordsToBounds(coords, mapState);

    // don't load tile if it doesn't intersect the bounds in options
    return bounds.overlaps(tileBounds);
  }

  tileCoordsToBounds(tileCoords: TileCoordinate, mapState: MapState) {
    const bounds = this.tileCoordsToNwSe(tileCoords, mapState);

    return this.map.wrapLatLngBounds(bounds);
  }

  tileCoordsToNwSe(tileCoords: TileCoordinate, mapState: MapState): LatLngBounds {
    const map = this.map;
    const coords = new Point(tileCoords.x, tileCoords.y);
    const tileSize = this.getTileSize(mapState);
    const tileSizePoint = new Point(tileSize, tileSize);
    const nwPoint = coords.scaleBy(tileSizePoint);
    const sePoint = nwPoint.add(tileSizePoint);
    const nw = map.unproject(nwPoint, tileCoords.z);
    const se = map.unproject(sePoint, tileCoords.z);

    return new LatLngBounds(nw, se);
  }

  pxBoundsToTileRange(bounds: Bounds, mapState: MapState): Bounds {
    const tileSize = this.defaultTileSize;
    const tileSizePoint = new Point(tileSize, tileSize);

    return new Bounds(
      bounds.min.unscaleBy(tileSizePoint).floor(),
      bounds.max.unscaleBy(tileSizePoint).ceil().subtract(new Point(1, 1)),
    );
  }

  getTileSize({ zoom }: MapState): number {
    const tileSize = (parseInt(this.tilesMeta.pixel_scale) || this.defaultTileSize);

    if (zoom > 1) {
      return tileSize;
    }

    if (zoom === 1) {
      return tileSize * 2;
    }

    return tileSize * 4;
  }

  getTiledPixelBounds(mapState: MapState): Bounds {
    const tileZoom = this.getTileZoom(mapState);
    const scale = this.map.getZoomScale(mapState.zoom, tileZoom);
    const pixelCenter = this.map.project(mapState.center, tileZoom).floor();
    const halfSize = this.map.getSize().divideBy(scale * 2);

    return new Bounds(pixelCenter.subtract(halfSize), pixelCenter.add(halfSize));
  }
}

// TODO use number instead of string. Number easier to operate.
export const getTileId = (tileCoords: TileCoordinate): MapTileId => `${tileCoords.z}:${tileCoords.x}:${tileCoords.y}`;

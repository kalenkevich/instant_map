import { MapState } from '../map_state';
import { MapTilesMeta } from '../types';
import { MapTile, MapTileFormatType, MapTileOptions, MapTileId, TileCoordinate, DEFAULT_TILE_SIZE } from './tile';
import { Point } from '../geometry/point';
import { Bounds } from '../geometry/bounds';
import { GlideMap } from '../map';
import { LatLngBounds } from '../geo/lat_lng_bounds';
import { PbfMapTile } from './pbf_tile';

export interface TilesGridOptions {
  tilesMeta: MapTilesMeta;
  tileFormatType: MapTileFormatType;
  mapWidth: number;
  mapHeight: number;
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
  tileCoords: Array<[number, number]>;
  mapWidth: number;
  mapHeight: number;
  tileZoom: number;

  globalTileRange: Bounds;

  fetchInProgress = false;
  fetchingTilesMap: Map<string, AbortController> = new Map();

  constructor(map: GlideMap, options: TilesGridOptions) {
    this.map = map;
    this.tilesMeta = options.tilesMeta;
    this.mapWidth = options.mapWidth;
    this.mapHeight = options.mapHeight;
    this.tileFormatType = options.tileFormatType;
    this.devicePixelRatio = options.devicePixelRatio || window.devicePixelRatio || 1;
    this.tilesCache = new Map<MapTileId, MapTile>();
  }

  public async init(mapState: MapState) {
    this.defaultTileSize = (this.tilesMeta.pixel_scale || DEFAULT_TILE_SIZE) * this.devicePixelRatio;
    this.tileCoords = [
      [0, 0],
      [this.defaultTileSize, 0],
      [0, this.defaultTileSize],
      [this.defaultTileSize, this.defaultTileSize],
    ];

    this.resetGrid(mapState);
  }

  resetGrid(mapState: MapState) {
    const tileZoom = this.getTileZoom(this.map.getZoom());

    const bounds = this.map.getPixelWorldBounds(tileZoom);
    if (bounds) {
      this.globalTileRange = this.pxBoundsToTileRange(bounds, mapState);
    }
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

      this.tilesCache.set(tile.id, tile);
      this.fetchingTilesMap.set(tile.id, abortController);

      tilesPromises.push(
        tile
          .fetchTileData(abortController.signal)
          .then(() => tile)
          .finally(() => this.fetchingTilesMap.delete(tile.id))
      );
    }

    try {
      await Promise.all(tilesPromises);

      this.fetchInProgress = false;

      return tilesToRender.map(ttr => this.tilesCache.get(ttr.id));
    } catch (e) {
      this.fetchInProgress = false;

      return [];
    }
  }

  getTileZoom(mapZoom: number): number | undefined {
    let tileZoom = Math.round(mapZoom);

    if (tileZoom > this.map.getMaxZoom() || tileZoom < this.map.getMinZoom()) {
      return undefined;
    }

    return this.clampZoom(tileZoom);
  }

  clampZoom(zoom: number) {
    const minZoom = this.map.getMinZoom();
    const maxZoom = this.map.getMaxZoom();

    if (zoom < minZoom) {
      return zoom;
    }

    if (maxZoom < zoom) {
      return maxZoom;
    }

    return zoom;
  }

  private getTilesToRender(state: MapState): MapTile[] {
    const tileSize = this.getTileSize(state);
    const tileZoom = this.getTileZoom(state.zoom);
    const pixelBounds = this.getTiledPixelBounds(state);
    const tileRange = this.pxBoundsToTileRange(pixelBounds, state);

    const tilesCoords: TileCoordinate[] = [];
    for (let j = tileRange.min.y; j <= tileRange.max.y; j++) {
      for (let i = tileRange.min.x; i <= tileRange.max.x; i++) {
        const coords: TileCoordinate = {
          x: i,
          y: j,
          z: tileZoom,
        };

        if (!this.isValidTile(coords, state)) {
          continue;
        }

        tilesCoords.push(coords);
      }
    }
    const minXTileCoord = Math.min(...tilesCoords.map(t => t.x));
    const minYTileCoord = Math.min(...tilesCoords.map(t => t.y));

    return tilesCoords.map(tileCoords => this.getMapTile({
      id: getTileId(tileCoords),
      formatType: this.tileFormatType,
      x: (tileCoords.x - minXTileCoord) * tileSize,
      y: (tileCoords.y - minYTileCoord) * tileSize,
      width: tileSize,
      height: tileSize,
      mapWidth: this.mapWidth,
      mapHeight: this.mapHeight,
      tileCoords: {
        ...tileCoords,
        z: tileCoords.z - 1, // TODO fix zoom-1 issue.
      },
      pixelRatio: this.devicePixelRatio,
    }));
  }

  private getMapTile(createOptions: MapTileOptions): MapTile {
    switch (createOptions.formatType) {
      case MapTileFormatType.pbf: return new PbfMapTile({
        ...createOptions,
        tilesMeta: this.tilesMeta,
      });
    }
  }

  isValidTile(coords: TileCoordinate, mapState: MapState): boolean {
    const crs = this.map.crs;

    if (!crs.infinite) {
      // don't load tile if it's out of bounds and not wrapped
      const bounds = this.globalTileRange;
      if ((!crs.wrapLng && (coords.x < bounds.min.x || coords.x > bounds.max.x)) || (!crs.wrapLat && (coords.y < bounds.min.y || coords.y > bounds.max.y))) {
        return false;
      }
    }

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

  pxBoundsToTileRange(bounds: Bounds, mapState: MapState) {
    const tileSize = this.getTileSize(mapState);
    const tileSizePoint = new Point(tileSize, tileSize);

    return new Bounds(
      bounds.min.unscaleBy(tileSizePoint).floor(),
      bounds.max.unscaleBy(tileSizePoint).ceil().subtract(new Point(1, 1)),
    );
  }

  getTileSize({ zoom }: MapState): number {
    if (zoom > 1) {
      return this.defaultTileSize;
    }

    if (zoom === 1) {
      return this.defaultTileSize * 2;
    }

    return this.defaultTileSize * 4;
  }

  getTiledPixelBounds({ zoom, center }: MapState): Bounds {
    const tileZoom = this.getTileZoom(zoom);
    const scale = this.map.getZoomScale(zoom, tileZoom);
    const pixelCenter = this.map.project(center, tileZoom).floor();
    const halfSize = this.map.getSize().divideBy(scale * 2);

    return new Bounds(pixelCenter.subtract(halfSize), pixelCenter.add(halfSize));
  }
}

// TODO use number instead of string. Number easier to operate.
export const getTileId = (tileCoords: TileCoordinate): MapTileId => `${tileCoords.z}:${tileCoords.x}:${tileCoords.y}`;
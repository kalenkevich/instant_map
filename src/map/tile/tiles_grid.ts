import { MapState } from '../map_state';
import { MapTilesMeta } from '../types';
import { MapTile, MapTileId, TileCoordinate, DEFAULT_TILE_SIZE } from './tile';
import { PbfMapTile } from './pbf_tile';
import { Point } from '../geometry/point';
import { Bounds } from '../geometry/bounds';
import { GlideMap } from '../map';
import { LatLngBounds } from '../geo/lat_lng_bounds';

export interface RenderTileInfo {
  tileId: MapTileId;
  tileCoords: TileCoordinate;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TilesGridOptions {
  tilesMeta: MapTilesMeta;
  mapWidth: number;
  mapHeight: number;
  devicePixelRatio?: number;
}

/**
 * This class suppouse to handle all actions with tiles: load, unload, etc.
 */
export class TilesGrid {
  map: GlideMap;
  tilesCache: Map<MapTileId, MapTile>;
  tilesMeta: MapTilesMeta;
  devicePixelRatio: number;

  tileSize: number;
  tileCoords: Array<[number, number]>;
  mapWidth: number;
  mapHeight: number;
  renderedTiles: Array<RenderTileInfo> = [];
  tileZoom: number;

  globalTileRange: Bounds;
  // wrapX: Point;
  // wrapY: Point;

  fetchInProgress = false;
  fetchingTilesMap: Map<string, AbortController> = new Map();

  constructor(map: GlideMap, options: TilesGridOptions) {
    this.map = map;
    this.tilesMeta = options.tilesMeta;
    this.mapWidth = options.mapWidth;
    this.mapHeight = options.mapHeight;
    this.devicePixelRatio = options.devicePixelRatio || 1;
    this.tilesCache = new Map<MapTileId, MapTile>();
  }

  public async init() {
    this.tileSize = (this.tilesMeta.pixel_scale || DEFAULT_TILE_SIZE) * this.devicePixelRatio;
    this.tileCoords = [
      [0, 0],
      [this.tileSize, 0],
      [0, this.tileSize],
      [this.tileSize, this.tileSize],
    ];

    this.resetGrid();
  }

  resetGrid() {
    const crs = this.map.crs;
    const tileZoom = this.getTileZoom(this.map.getZoom());
    const tileSize = this.getTileSize();

    const bounds = this.map.getPixelWorldBounds(tileZoom);
    if (bounds) {
      this.globalTileRange = this.pxBoundsToTileRange(bounds);
    }
  }

  public async update(mapState: MapState): Promise<MapTile[]> {
    const tilesToRender = this.getTilesToRender(mapState);

    return this.fetchTiles(tilesToRender);
  }

  private async fetchTiles(tilesToRender: Array<RenderTileInfo>): Promise<MapTile[]> {
    if (!this.tilesMeta) {
      throw new Error('Tiles meta is not defined.');
    }

    const tilesPromises: Promise<MapTile>[] = [];

    this.fetchInProgress = true;

    for (const alreadyFetchingTileId of this.fetchingTilesMap.keys()) {
      const tileToFetch = tilesToRender.find(tile => tile.tileId === alreadyFetchingTileId);

      if (!tileToFetch) {
        this.fetchingTilesMap.get(alreadyFetchingTileId).abort();
        this.fetchingTilesMap.delete(alreadyFetchingTileId);
        this.tilesCache.delete(alreadyFetchingTileId);
      }
    }

    let invokeRerender = false;

    for (const tile of tilesToRender) {
      if (this.tilesCache.has(tile.tileId) || this.fetchingTilesMap.has(tile.tileId)) {
        invokeRerender = true;
        continue;
      }

      const pbfTile = new PbfMapTile({
        id: tile.tileId,
        tileCoords: tile.tileCoords,
        tilesMeta: this.tilesMeta!,
        renderOptions: {
          x: tile.x,
          y: tile.y,
          width: tile.width,
          height: tile.height,
          mapWidth: this.mapWidth,
          mapHeight: this.mapHeight,
        },
      });

      const abortController = new AbortController();

      this.tilesCache.set(tile.tileId, pbfTile);
      this.fetchingTilesMap.set(tile.tileId, abortController);

      tilesPromises.push(
        pbfTile
          .fetchTileData(abortController.signal)
          .then(() => pbfTile)
          .finally(() => this.fetchingTilesMap.delete(tile.tileId))
      );
    }

    try {
      const tiles = await Promise.all(tilesPromises);

      this.fetchInProgress = false;

      return tiles;
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

  private getTilesToRender(state: MapState): RenderTileInfo[] {
    const tileZoom = this.getTileZoom(state.zoom);
    const pixelBounds = this.getTiledPixelBounds(state);
    const tileRange = this.pxBoundsToTileRange(pixelBounds);
    const tileCenter = tileRange.getCenter();

    const tilesCoords: TileCoordinate[] = [];
    for (let j = tileRange.min.y; j <= tileRange.max.y; j++) {
      for (let i = tileRange.min.x; i <= tileRange.max.x; i++) {
        const coords = new TileCoordinate(i, j, tileZoom);

        if (!this.isValidTile(coords)) {
          continue;
        }

        tilesCoords.push(coords);
      }
    }
    const minXTileCoord = Math.min(...tilesCoords.map(t => t.x));
    const minYTileCoord = Math.min(...tilesCoords.map(t => t.y));

    const res = tilesCoords.map(tileCoords => ({
      tileId: getTileId(tileCoords),
      x: (tileCoords.x - minXTileCoord) * this.tileSize,
      y: (tileCoords.y - minYTileCoord) * this.tileSize,
      width: this.tileSize,
      height: this.tileSize,
      tileCoords: new TileCoordinate(tileCoords.x, tileCoords.y, tileCoords.z - 1),
    }));

    console.log(res);

    return res;
  }

  isValidTile(coords: TileCoordinate): boolean {
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

    const tileBounds = this.tileCoordsToBounds(coords);

    // don't load tile if it doesn't intersect the bounds in options
    return bounds.overlaps(tileBounds);
  }

  tileCoordsToBounds(tileCoords: TileCoordinate) {
    const bounds = this.tileCoordsToNwSe(tileCoords);

    return this.map.wrapLatLngBounds(bounds);
  }

  tileCoordsToNwSe(tileCoords: TileCoordinate): LatLngBounds {
    const map = this.map;
    const coords = new Point(tileCoords.x, tileCoords.y);
    const tileSize = this.getTileSize();
    const nwPoint = coords.scaleBy(tileSize);
    const sePoint = nwPoint.add(tileSize);
    const nw = map.unproject(nwPoint, tileCoords.z);
    const se = map.unproject(sePoint, tileCoords.z);

    return new LatLngBounds(nw, se);
  }

  pxBoundsToTileRange(bounds: Bounds) {
    const tileSize = this.getTileSize();

    return new Bounds(bounds.min.unscaleBy(tileSize).floor(), bounds.max.unscaleBy(tileSize).ceil().subtract(new Point(1, 1)));
  }

  getTileSize(): Point {
    return new Point(this.tileSize, this.tileSize);
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

import { MapState } from '../map_state';
import { MapTilesMeta } from '../types';
import { MapTile, MapTileFormatType, MapTileOptions, MapTileId, TileCoordinate } from './tile';
import { Point } from '../geometry/point';
import { Bounds } from '../geometry/bounds';
import { GlideMap } from '../map';
import { LatLngBounds } from '../geo/lat_lng_bounds';
import { PbfMapTile } from './pbf/pbf_tile';
import { PngMapTile } from './png/png_tile';
import { LRUCache } from '../utils/lru_cache';
import { DataTileStyles } from '../styles/styles';

export interface TilesGridOptions {
  tilesMeta: MapTilesMeta;
  tileStyles: DataTileStyles;
  tileFormatType: MapTileFormatType;
  devicePixelRatio: number;
  preheatTiles?: boolean;
}

/**
 * This class suppouse to handle all actions with tiles: load, unload, etc.
 */
export class TilesGrid {
  map: GlideMap;
  tileFormatType: MapTileFormatType;
  tilesCache: LRUCache<MapTileId, MapTile> = new LRUCache<MapTileId, MapTile>(64);
  renderedTiles: Array<MapTile> = [];
  tilesMeta: MapTilesMeta;
  devicePixelRatio: number;

  defaultTileSize: number;
  tileZoom: number;

  fetchInProgress = false;
  fetchingTilesMap: Map<string, AbortController> = new Map();

  tileStyles?: DataTileStyles;
  tileSize: number;

  constructor(map: GlideMap, options: TilesGridOptions) {
    this.map = map;
    this.tilesMeta = options.tilesMeta;
    this.tileStyles = options.tileStyles;
    this.tileSize = options.tileStyles.tileSize;
    this.tileFormatType = options.tileFormatType;
    this.devicePixelRatio = options.devicePixelRatio;
  }

  public async init(mapState: MapState) {}

  public async update(mapState: MapState): Promise<MapTile[]> {
    const tilesToRender = this.getTilesToRender(mapState);
    this.renderedTiles = tilesToRender;

    return this.fetchTiles(tilesToRender);
  }

  public async getTilesToPreheat(mapState: MapState): Promise<MapTile[]> {
    const mapPanePos = this.map.getMapPanePos();
    const up = this.map.getLatLngFromPoint(mapPanePos.add(new Point(0, -512)));
    const down = this.map.getLatLngFromPoint(mapPanePos.add(new Point(0, 512)));
    const right = this.map.getLatLngFromPoint(mapPanePos.add(new Point(512, 0)));
    const left = this.map.getLatLngFromPoint(mapPanePos.add(new Point(-512, 0)));

    const tilesToPreheat = [
      ...this.getTilesToRender({ ...mapState, zoom: mapState.zoom - 1 }),
      ...this.getTilesToRender({ ...mapState, zoom: mapState.zoom + 1 }),
      ...this.getTilesToRender({ ...mapState, center: up }),
      ...this.getTilesToRender({ ...mapState, center: down }),
      ...this.getTilesToRender({ ...mapState, center: right }),
      ...this.getTilesToRender({ ...mapState, center: left }),
    ];

    return this.fetchTiles(tilesToPreheat);
  }

  public async downloadTiles(): Promise<void> {
    await Promise.all(this.renderedTiles.map(tile => tile.download()));
  }

  private async fetchTiles(tilesToRender: MapTile[]): Promise<MapTile[]> {
    if (!this.tilesMeta) {
      throw new Error('Tiles meta is not defined.');
    }

    const tilesPromises: Promise<MapTile>[] = [];

    this.fetchInProgress = true;

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

        if (tile) {
          tile.resetState(ttr);
        }

        return tile;
      });
    } finally {
      this.fetchInProgress = false;
    }
  }

  private getTileZoom(mapState: MapState): number | undefined {
    return this.clampZoom(Math.round(mapState.zoom));
  }

  private clampZoom(zoom: number) {
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
    const tileZoom = this.getTileZoom(mapState);
    const pixelBounds = this.getTiledPixelBounds(this.tileSize, mapState);
    const tileRange = this.pxBoundsToTileRange(pixelBounds, this.tileSize);

    if (tileRange.min.x < 0) {
      const delta = -tileRange.min.x;

      tileRange.min.x += delta;
      tileRange.max.x += delta;
    }

    if (tileRange.min.y < 0) {
      const delta = -tileRange.min.y;

      tileRange.min.y += delta;
      tileRange.max.y += delta;
    }

    const tilesCoords: TileCoordinate[] = [];
    for (let j = tileRange.min.y; j <= tileRange.max.y; j++) {
      for (let i = tileRange.min.x; i <= tileRange.max.x; i++) {
        const coords: TileCoordinate = {
          x: i,
          y: j,
          z: tileZoom,
        };

        if (!this.isValidTile(coords, tileZoom, this.tileSize, mapState)) {
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
        x: (tileCoords.x - minXTileCoord) * this.tileSize,
        y: (tileCoords.y - minYTileCoord) * this.tileSize,
        width: this.tileSize,
        height: this.tileSize,
        mapWidth: this.map.getWidth(),
        mapHeight: this.map.getHeight(),
        tileCoords: {
          x: tileCoords.x,
          y: tileCoords.y,
          z: tileCoords.z,
        },
        devicePixelRatio: this.devicePixelRatio,
        tilesMeta: this.tilesMeta,
        tileStyles: this.tileStyles,
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

  private isValidTile(coords: TileCoordinate, tileZoom: number, tileSize: number, mapState: MapState): boolean {
    const crs = this.map.crs;

    if (!crs.infinite) {
      const bounds = this.getTileRange(tileZoom, tileSize);

      if (
        (!crs.wrapLng && (coords.x < bounds.min.x || coords.x > bounds.max.x)) ||
        (!crs.wrapLat && (coords.y < bounds.min.y || coords.y > bounds.max.y))
      ) {
        return false;
      }
    }

    // const bounds = this.map.getPixelWorldBounds(tileZoom);

    const bounds = this.map.bounds;

    if (!bounds) {
      return true;
    }

    const tileBounds = this.tileCoordsToBounds(coords, tileSize, mapState);

    // don't load tile if it doesn't intersect the bounds in options
    return bounds.overlaps(tileBounds);
  }

  private getTileRange(tileZoom: number, tileSize: number) {
    const bounds = this.map.getPixelWorldBounds(tileZoom, tileSize);

    return this.pxBoundsToTileRange(bounds, tileZoom);
  }

  private tileCoordsToBounds(tileCoords: TileCoordinate, tileSize: number, mapState: MapState) {
    const bounds = this.tileCoordsToNwSe(tileCoords, tileSize, mapState);

    return this.map.wrapLatLngBounds(bounds);
  }

  private tileCoordsToNwSe(tileCoords: TileCoordinate, tileSize: number, mapState: MapState): LatLngBounds {
    const map = this.map;
    const coords = new Point(tileCoords.x, tileCoords.y);
    const tileSizePoint = new Point(tileSize, tileSize);
    const nwPoint = coords.scaleBy(tileSizePoint);
    const sePoint = nwPoint.add(tileSizePoint);
    const nw = map.unproject(nwPoint, tileCoords.z, tileSize);
    const se = map.unproject(sePoint, tileCoords.z, tileSize);

    return new LatLngBounds(nw, se);
  }

  private pxBoundsToTileRange(bounds: Bounds, tileSize: number): Bounds {
    const tileSizePoint = new Point(tileSize, tileSize);

    return new Bounds(
      bounds.min.unscaleBy(tileSizePoint).floor(),
      bounds.max.unscaleBy(tileSizePoint).ceil().subtract(new Point(1, 1))
    );
  }

  private getTiledPixelBounds(tileSize: number, mapState: MapState): Bounds {
    const tileZoom = this.getTileZoom(mapState);
    const scale = this.map.getZoomScale(mapState.zoom, tileZoom, tileSize);
    const pixelCenter = this.map.project(mapState.center, tileZoom, tileSize).floor();
    const halfSize = this.map.getSize().divideBy(scale * 2);

    return new Bounds(pixelCenter.subtract(halfSize), pixelCenter.add(halfSize));
  }
}

// TODO use number instead of string. Number easier to operate.
export const getTileId = (tileCoords: TileCoordinate): MapTileId => `${tileCoords.z}:${tileCoords.x}:${tileCoords.y}`;

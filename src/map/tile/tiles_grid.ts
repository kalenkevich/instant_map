import { MapState } from '../map_state';
import { MapTilesMeta } from '../types';
import { MapTile, MapTileId, TileCoords, DEFAULT_TILE_WIDTH, DEFAULT_TILE_HEIGHT } from './tile';
import { PbfMapTile } from './pbf_tile';

export interface RenderTileInfo {
  tileId: MapTileId;
  tileCoords: TileCoords;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TilesGridOptions {
  tilesMetaUrl: string;
  mapWidth: number;
  mapHeight: number;
}

/**
 * This class suppouse to handle all actions with tiles: load, unload, etc.
 */
export class TilesGrid {
  tilesCache: Map<MapTileId, MapTile>;
  tilesMetaUrl: string;
  tilesMeta?: MapTilesMeta;
  devicePixelRatio: number;

  tileWidth: number;
  tileHeight: number;
  tileCoords: Array<[number, number]>;
  mapWidth: number;
  mapHeight: number;
  renderedTiles: Array<RenderTileInfo> = [];

  fetchInProgress = false;
  fetchingTilesMap: Map<string, AbortController> = new Map();

  constructor(options: TilesGridOptions) {
    this.tilesMetaUrl = options.tilesMetaUrl;
    this.mapWidth = options.mapWidth;
    this.mapHeight = options.mapHeight;
    this.tilesCache = new Map<MapTileId, MapTile>();
  }

  public async init(): Promise<void> {
    await this.fetchTilesMeta();
  }

  public async update(mapState: MapState): Promise<MapTile[]> {
    const tilesToRender = this.getTilesToRender(mapState);

    return this.fetchTiles(tilesToRender);
  }

  private async fetchTilesMeta() {
    try {
      this.tilesMeta = (await fetch(this.tilesMetaUrl).then(data => data.json())) as MapTilesMeta;

      this.tileWidth = this.tilesMeta.pixel_scale || DEFAULT_TILE_WIDTH;
      this.tileHeight = this.tilesMeta.pixel_scale || DEFAULT_TILE_HEIGHT;
      this.tileCoords = [
        [0, 0],
        [this.tileWidth, 0],
        [0, this.tileHeight],
        [this.tileWidth, this.tileHeight],
      ];
    } catch (e) {
      console.log(e);
    }
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
    }
  }

  private getTilesToRender(mapState: MapState): Array<RenderTileInfo> {
    const nextTiles: RenderTileInfo[] = [];
    const tilesCoords: TileCoords[] = [
      [0, 0, 0],
      // [12, 2335, 1332],
      // [12, 2336, 1332],
      // [12, 2335, 1333],
      // [12, 2336, 1333],
      // [14, 9343, 5330],
      // [14, 9344, 5330],
      // [14, 9343, 5331],
      // [14, 9344, 5331],
    ];

    let i = 0;
    for (const tileCoords of tilesCoords) {
      nextTiles.push({
        tileId: getTileId(tileCoords),
        x: this.tileCoords[i][0],
        y: this.tileCoords[i][1],
        width: this.tileWidth,
        height: this.tileHeight,
        tileCoords,
      });
      i++;
    }

    return nextTiles;
  }
}

// TODO use number instead of string. Number easier to operate.
export const getTileId = (tileCoords: TileCoords): MapTileId => {
  const [z, x, y] = tileCoords;

  return `${z}-${x}-${y}`;
};

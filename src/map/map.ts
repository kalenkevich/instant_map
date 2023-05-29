import { WebGlPainter } from '../webgl';

import { MapPbfTile } from './tile/pbf_tile';
import { Pan } from './pan';
import { MapState } from './map_state';
import { RenderTileInfo, TileCacheKey, MapTilesMeta, MapOptions, ZXY, MapRendererType, MapRendererOptions, MapRenderer } from './types';

export const getTileKey = ({ tileZXY }: { tileZXY: ZXY }) => {
  const [z, x, y] = tileZXY;

  return `${z}-${x}-${y}`;
};

export const getRenderer = (renderer: MapRendererType | MapRendererOptions, canvasEl: HTMLCanvasElement): MapRenderer => {
  if ((renderer as MapRendererOptions).renderer) {
    return (renderer as MapRendererOptions).renderer;
  }

  const type = renderer as MapRendererType;

  if (type === MapRendererType.webgl) {
    const gl = canvasEl.getContext('webgl', {
      powerPreference: 'high-performance',
    });

    return new WebGlPainter(gl, []);
  }

  throw new Error(`Renderer ${type} is not supported.`);
};

/**
 * Visual Map class
 * Core of the map. Controls user events like mousemove, click, drag, wheel and converts it to the maps events like drag, zoom, move.
 * Based on center and zoom fetch tiles.
 *
 * TODO: should support combination of the webgl (development), webgl2, webgpu as render engine and vector, xml, json as a data source format.
 */
export class GlideMap extends Pan {
  renderer: MapRenderer;
  tilesCache: Map<TileCacheKey, MapPbfTile>;
  tilesMetaUrl: string;
  tilesMeta?: MapTilesMeta;
  devicePixelRatio: number;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  tileCoords: Array<[number, number]>;
  renderedTiles: Array<RenderTileInfo> = [];

  constructor(options: MapOptions) {
    super(options.el);

    this.renderer = getRenderer(options.renderer || MapRendererType.webgl, options.el as HTMLCanvasElement);
    this.tilesMetaUrl = options.tilesMetaUrl;
    this.devicePixelRatio = options.devicePixelRatio || window.devicePixelRatio || 1;
    this.tilesCache = new Map<TileCacheKey, MapPbfTile>();
    this.width = (this.el as HTMLCanvasElement).width;
    this.height = (this.el as HTMLCanvasElement).height;
    this.tileWidth = this.width / 2;
    this.tileHeight = this.height / 2;
    this.tileCoords = [
      [0, 0],
      [this.tileWidth, 0],
      [0, this.tileHeight],
      [this.tileWidth, this.tileHeight],
    ];
    this.state = this.prevState = {
      zoom: options.zoom || 0,
      center: options.center || ([this.tileWidth, this.tileHeight] as [number, number]),
    };

    this.init();
  }

  init() {
    super.init();
    this.renderer.init();

    this.fetchTilesMeta().then(() => {
      const tilesToRender = this.getTilesToRender(this.state);

      this.fetchTiles(tilesToRender);
    });
  }

  onMapStateChange(newState: MapState) {
    this.prevState = this.state;
    this.state = newState;

    this.fetchTiles(this.getTilesToRender(this.state));
  }

  getTilesToRender(state: MapState): Array<RenderTileInfo> {
    const z = Math.floor(state.zoom);
    const tileBound = (1 << z) - 1;
    const x = Math.max(Math.min(Math.abs(state.center[0] / this.tileWidth) << z, tileBound), 0);
    const y = Math.max(Math.min(Math.abs(state.center[1] / this.tileHeight) << z, tileBound), 0);
    const nextTiles: RenderTileInfo[] = [];

    if (z === 0) {
      const tileZXY = [z, 0, 0] as ZXY;

      return [
        {
          tileId: getTileKey({ tileZXY }),
          x: 0,
          y: 0,
          // Use map width and height for root tile
          width: this.width,
          height: this.height,
          tileZXY,
        },
      ];
    }

    for (let i = 0; i < 4; i++) {
      const childX = Math.max(Math.min((x << 1) + (i % 2), tileBound), 0);
      const childY = Math.max(Math.min((y << 1) + (i >> 1), tileBound), 0);
      const tileZXY = [z, childX, childY] as ZXY;

      nextTiles.push({
        tileId: getTileKey({ tileZXY }),
        x: this.tileCoords[i][0],
        y: this.tileCoords[i][1],
        width: this.tileWidth,
        height: this.tileHeight,
        tileZXY,
      });
    }

    return nextTiles;
  }

  async fetchTilesMeta() {
    try {
      this.tilesMeta = (await fetch(this.tilesMetaUrl).then(data => data.json())) as MapTilesMeta;
    } catch (e) {
      console.log(e);
    }
  }

  fetchInProgress = false;
  fetchingTilesMap: Map<string, AbortController> = new Map();

  fetchTiles(tilesToRender: Array<RenderTileInfo>) {
    if (!this.tilesMeta) {
      throw new Error('Tiles meta is not defined.');
    }

    const tilesPromises: Promise<void>[] = [];

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

      const pbfTile = new MapPbfTile({
        x: tile.x,
        y: tile.y,
        width: tile.width,
        height: tile.height,
        mapWidth: this.width,
        mapHeight: this.height,
        tileZXY: tile.tileZXY,
        tilesMeta: this.tilesMeta!,
        blank: tile.blank,
      });

      const abortController = new AbortController();

      this.tilesCache.set(tile.tileId, pbfTile);
      this.fetchingTilesMap.set(tile.tileId, abortController);

      tilesPromises.push(
        pbfTile.fetchTileData(abortController.signal).finally(() => {
          this.fetchingTilesMap.delete(tile.tileId);
        })
      );
    }

    if (tilesPromises.length) {
      Promise.all(tilesPromises)
        .then(() => {
          this.fetchInProgress = false;
          this.rerenderMap(tilesToRender);
        })
        .catch(() => {
          this.fetchInProgress = false;
        });
    } else {
      this.fetchInProgress = false;

      if (invokeRerender) {
        this.rerenderMap(tilesToRender);
      }
    }
  }

  rerenderMap(tilesToRender: Array<RenderTileInfo>) {
    const renderScene = (tiles: Array<RenderTileInfo>) => {
      if (this.isAlreadRendered(this.renderedTiles, tiles)) {
        return;
      }

      const tilesToRender = tiles.map(tile => this.tilesCache.get(getTileKey(tile)));
      const glPrograms = tilesToRender.flatMap(tile => tile.getRenderPrograms());

      console.log('Render...');
      this.renderer.setPrograms(glPrograms);
      this.renderer.draw();

      this.renderedTiles = tiles;
    };

    requestAnimationFrame(() => {
      renderScene(tilesToRender);
    });
  }

  isAlreadRendered(renderedTiles: Array<RenderTileInfo>, tilesToRender: Array<RenderTileInfo>): boolean {
    const renderedKeys = renderedTiles
      .map(t => t.tileId)
      .sort()
      .join('');
    const tilesKeys = tilesToRender
      .map(t => t.tileId)
      .sort()
      .join('');

    return renderedKeys === tilesKeys;
  }
}

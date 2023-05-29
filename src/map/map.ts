import { GlPainter } from '../gl';
import { throttle } from './utils';

import { MapPbfTile } from './tile/pbf_tile';

import { RenderTileInfo, TileCacheKey, MapTilesMeta, MapOptions, ZXY } from './types';
 
export const getTileKey = ({ tileZXY }: { tileZXY: ZXY }) => {
  const [z, x, y] = tileZXY;

  return `${z}-${x}-${y}`;
}

export interface MapState {
  zoom: number;
  center: [number, number];
}

export class GlideMap {
  gl: WebGLRenderingContext;
  painter: GlPainter;
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

  private state: MapState;
  private prevState: MapState;

  constructor(gl: WebGLRenderingContext, options: MapOptions) {
    this.gl = gl;
    this.painter = new GlPainter(this.gl, []);
    this.tilesMetaUrl = options.tilesMetaUrl;
    this.devicePixelRatio = options.devicePixelRatio || window.devicePixelRatio || 1;
    this.tilesCache = new Map<TileCacheKey, MapPbfTile>();
    this.width = this.gl.canvas.width;
    this.height = this.gl.canvas.height;
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
      center: options.center || [this.tileWidth, this.tileHeight] as [number, number],
    };

    this.init();
  }

  getState(): MapState {
    return this.state;
  }

  getPrevState(): MapState {
    return this.prevState;
  }

  init() {
    this.painter.init();
    this.subscribeOnGlEvents();

    this.fetchTilesMeta().then(() => {
      const tilesToRender = this.getTilesToRender(this.state);

      this.fetchTiles(tilesToRender);
    })
  }

  subscribeOnGlEvents() {
    this.gl.canvas.addEventListener('click', throttle((clickEvent: MouseEvent) => this.onClickEvent(clickEvent), 50));
    this.gl.canvas.addEventListener('wheel', throttle((wheelEvent: WheelEvent) => this.onWheelEvent(wheelEvent), 200));

    // drag events
    this.gl.canvas.addEventListener('mousedown', throttle((mouseDownEvent: MouseEvent) => this.onMouseDownEvent(mouseDownEvent), 50));
    this.gl.canvas.addEventListener('mousemove', (mouseMoveEvent: MouseEvent) => this.onMouseMove(mouseMoveEvent));
    this.gl.canvas.addEventListener('mouseup', throttle((mouseUpEvent: MouseEvent) => this.onMouseUpEvent(mouseUpEvent), 50));
  }

  onClickEvent(clickEvent: MouseEvent) {
    console.log('clickEvent', clickEvent, this.getState());
  }
  
  onWheelEvent(wheelEvent: WheelEvent) {
    console.log('wheelEvent', wheelEvent, this.getState());

    let newZoom = this.state.zoom;

    if (wheelEvent.deltaY < 0) {
      newZoom = this.state.zoom + Math.abs(wheelEvent.deltaY / 10);
      newZoom = Math.min(newZoom, 24);
      newZoom = Number(newZoom.toFixed(4));
    } else {
      newZoom = this.state.zoom - Math.abs(wheelEvent.deltaY / 10);
      newZoom = Math.max(newZoom, 0);
      newZoom = Number(newZoom.toFixed(4));
    }

    this.onMapStateChange({
      ...this.getState(),
      zoom: newZoom,
      center: [wheelEvent.x, wheelEvent.y],
    });
  }

  dragStarted = false;
  dragStartX = 0;
  dragStartY = 0;

  onMouseDownEvent(mouseDownEvent: MouseEvent) {
    console.log('mouseDownEvent', mouseDownEvent, this.getState());
    this.dragStarted = true;

    this.dragStartX = mouseDownEvent.x;
    this.dragStartY = mouseDownEvent.y;
  }

  onMouseMove(mouseMoveEvent: MouseEvent) {}

  onMouseUpEvent(mouseUpEvent: MouseEvent) {

    if (!this.dragStarted) {
      return;
    }

    this.dragStarted = false;
    const state = this.getState();

    let deltaX = (mouseUpEvent.x - this.dragStartX);
    let deltaY = (mouseUpEvent.y - this.dragStartY);

    this.onMapStateChange({
      ...state,
      // inverse the delta
      center: [
        state.center[0] - deltaX,
        state.center[1] - deltaY,
      ],
    });

    console.log('mouseUpEvent', mouseUpEvent, this.getState());
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

      return [{
        tileId: getTileKey({ tileZXY }),
        x: this.tileWidth / 2,
        y: this.tileHeight / 2,
        // Use map width and height for root tile
        width: this.tileWidth,
        height: this.tileHeight,
        tileZXY,
      }];
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
      this.tilesMeta = await fetch(this.tilesMetaUrl).then(data => data.json()) as MapTilesMeta;
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

      const pbfTile = new MapPbfTile(this.gl, {
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
        pbfTile
          .fetchTileData(abortController.signal)
          .finally(() => {
            this.fetchingTilesMap.delete(tile.tileId);
          })
      );
    }

    if (tilesPromises.length) {
      Promise
        .all(tilesPromises)
        .then(() => {
          this.fetchInProgress = false;
          this.rerenderMap(tilesToRender);
        }).catch(() => {
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
      this.painter.setPrograms(glPrograms);
      this.painter.draw();

      this.renderedTiles = tiles;
    };

    requestAnimationFrame(() => {
      renderScene(tilesToRender);
    });
  }

  isAlreadRendered(renderedTiles: Array<RenderTileInfo>, tilesToRender: Array<RenderTileInfo>): boolean {
    const renderedKeys = renderedTiles.map(t => t.tileId).sort().join('');
    const tilesKeys = tilesToRender.map(t => t.tileId).sort().join('');
    
    return renderedKeys === tilesKeys;
  }
}

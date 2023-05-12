import { GlPainter } from '../gl';
import { throttle } from './utils';

import { MapPbfTile } from './tile/pbf_tile';

import { RenderTileInfo, TileCacheKey, MapTilesMeta, MapOptions } from './types';
 
export const getTileKey = (renderTile: RenderTileInfo) => {
  const [z, x, y] = renderTile.tileZXY;

  return `${z}-${x}-${y}`;
}

export class GlideMap {
  gl: WebGLRenderingContext;
  
  zoom: number;

  center: [number, number];

  painter: GlPainter;

  tilesCache: Map<TileCacheKey, MapPbfTile>;

  tiles: Array<RenderTileInfo>;

  tilesMetaUrl: string;

  tilesMeta?: MapTilesMeta;

  devicePixelRatio: number;

  width: number;

  height: number;

  get state() {
    return {
      zoom: this.zoom,
      center: this.center,
      tiles: this.tiles,
    }
  }

  constructor(gl: WebGLRenderingContext, options: MapOptions) {
    this.gl = gl;
    this.zoom = options.zoom || 0;
    this.center = options.center || [0, 0] as [number, number];
    this.painter = new GlPainter(this.gl, []);
    this.tilesMetaUrl = options.tilesMetaUrl;
    this.devicePixelRatio = options.devicePixelRatio || window.devicePixelRatio || 1;
    this.tilesCache = new Map<TileCacheKey, MapPbfTile>();
    this.width = this.gl.canvas.width;
    this.height = this.gl.canvas.height;

    this.init();
  }

  init() {
    this.painter.init();
    this.subscribeOnGlEvents();

    this.tiles = this.getTilesToRender();
    this.fetchTilesMeta().then(() => {
      this.fetchTiles();
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
    console.log('clickEvent', clickEvent, this.state);
  }
  
  onWheelEvent(wheelEvent: WheelEvent) {
    console.log('wheelEvent', wheelEvent, this.state);

    if (wheelEvent.deltaY < 0) {
      this.zoom += Math.abs(wheelEvent.deltaY / 25);
      this.zoom = Math.min(this.zoom, 24);
      this.zoom = Number(this.zoom.toFixed(4));
    } else {
      this.zoom -= Math.abs(wheelEvent.deltaY / 25);
      this.zoom = Math.max(this.zoom, 0);
      this.zoom = Number(this.zoom.toFixed(4));
    }

    this.onMapStateChange();
  }

  dragStarted = false;
  dragStartX = 0;
  dragStartY = 0;

  onMouseDownEvent(mouseDownEvent: MouseEvent) {
    console.log('mouseDownEvent', mouseDownEvent, this.state);
    this.dragStarted = true;

    this.dragStartX = mouseDownEvent.x;
    this.dragStartY = mouseDownEvent.y;
  }

  onMouseMove(mouseMoveEvent: MouseEvent) {
    if (this.dragStarted) {
      console.log('mouseMoveEvent', mouseMoveEvent, this.state);
      let deltaX = (mouseMoveEvent.x - this.dragStartX) / 2;
      let deltaY = (mouseMoveEvent.y - this.dragStartY) / 2;

      if (deltaX < 0) {
        deltaX = Math.max(deltaX, -5);
      } else {
        deltaX = Math.min(deltaX, 5);
      }

      if (deltaY < 0) {
        deltaY = Math.max(deltaY, -5);
      } else {
        deltaY = Math.min(deltaY, 5);
      }

      this.center = [
        this.center[0] + deltaX,
        this.center[1] + deltaY,
      ];
      this.onMapStateChange();
    }
  }

  onMouseUpEvent(mouseUpEvent: MouseEvent) {
    console.log('mouseUpEvent', mouseUpEvent, this.state);
    this.dragStarted = false;
  }

  onMapStateChange() {
    this.tiles = this.getTilesToRender();
    this.fetchTiles();
  }

  // getTilesToRender(): Array<RenderTileInfo> {
  //   const cWidth = this.gl.canvas.width;
  //   const cHeight = this.gl.canvas.height;
  //   const tWidth = cWidth / 3;
  //   const tHeigth = cHeight / 3;

  //   return [
  //     {x: 0, y: 0, width: tWidth, height: tHeigth, tileZXY: [8, 145, 81], },
  //     {x: tWidth, y: 0, width: tWidth, height: tHeigth, tileZXY: [8, 146, 81], blank: false },
  //     {x: tWidth * 2, y: 0, width: tWidth, height: tHeigth, tileZXY: [8, 147, 81]},

  //     {x: 0, y: tHeigth, width: tWidth, height: tHeigth, tileZXY: [8, 145, 82], blank: false},
  //     {x: tWidth, y: tHeigth, width: tWidth, height: tHeigth, tileZXY: [8, 146, 82]},
  //     {x: tWidth * 2, y: tHeigth, width: tWidth, height: tHeigth, tileZXY: [8, 147, 82], blank: false},

  //     {x: 0, y: tHeigth * 2, width: tWidth, height: tHeigth, tileZXY: [8, 145, 83]},
  //     {x: tWidth, y: tHeigth * 2, width: tWidth, height: tHeigth, tileZXY: [8, 146, 83], blank: false},
  //     {x: tWidth * 2, y: tHeigth * 2, width: tWidth, height: tHeigth, tileZXY: [8, 147, 83]},
  //   ];
  // }

  getTilesToRender(): Array<RenderTileInfo> {
    const tWidth = this.width / 2;
    const tHeigth = this.height / 2;

    return [
      {x: 0, y: 0, width: tWidth, height: tHeigth, tileZXY: [1, 0, 0], },
      {x: tWidth, y: 0, width: tWidth, height: tHeigth, tileZXY: [1, 1, 0], blank: false },

      {x: 0, y: tHeigth, width: tWidth, height: tHeigth, tileZXY: [1, 0, 1]},
      {x: tWidth, y: tHeigth, width: tWidth, height: tHeigth, tileZXY: [1, 1, 1], blank: false},
    ];
  }

  // getTilesToRender(): Array<RenderTileInfo> {
  //     const tWidth = this.width / 3;
  //     const tHeigth = this.height / 2;
  
  //     return [
  //       {x: 0, y: 0, width: tWidth, height: tHeigth, tileZXY: [3, 3, 2], },
  //       {x: tWidth, y: 0, width: tWidth, height: tHeigth, tileZXY: [3, 4, 2],},
  //       {x: tWidth * 2, y: 0, width: tWidth, height: tHeigth, tileZXY: [3, 5, 2],},

  //       {x: 0, y: tHeigth, width: tWidth, height: tHeigth, tileZXY: [3, 3, 3], },
  //       {x: tWidth, y: tHeigth, width: tWidth, height: tHeigth, tileZXY: [3, 4, 3],},
  //       {x: tWidth * 2, y: tHeigth, width: tWidth, height: tHeigth, tileZXY: [3, 5, 3],},
  //     ];
  //   }

  async fetchTilesMeta() {
    try {
      this.tilesMeta = await fetch(this.tilesMetaUrl).then(data => data.json()) as MapTilesMeta;
    } catch (e) {
      console.log(e);
    }
  }

  fetchTiles() {
    if (!this.tilesMeta) {
      throw new Error('Tiles meta is not defined.');
    }

    const tilesPromises: Promise<void>[] = [];

    for (const tile of this.tiles) {
      const tileId = getTileKey(tile);

      if (this.tilesCache.has(tileId)) {
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

      this.tilesCache.set(tileId, pbfTile);

      tilesPromises.push(pbfTile.fetchTileData());
    }

    if (tilesPromises.length) {
      Promise.all(tilesPromises).then(() => {
        this.onMapStateChange();
        this.rerenderMap();
      });
    }
  }

  rerenderMap() {
    const renderScene = () => {
      const tilesToRender = this.tiles.map(tile => this.tilesCache.get(getTileKey(tile)));
      const glPrograms = tilesToRender.flatMap(tile => tile.getRenderPrograms());

      console.log('Start draw');
      this.painter.setPrograms(glPrograms);
      this.painter.draw();
    };

    requestAnimationFrame(() => {
      renderScene();
    });
  }
}

import 'hammerjs';
import tilebelt from '@mapbox/tilebelt';
import { vec3, mat3 } from 'gl-matrix';
import Stats from 'stats.js';
import { createShader, createProgram, getPrimitiveType } from './utils/webgl-utils';
import { geometryToVertices } from './utils/map-utils';
import MercatorCoordinate from './utils/mercator-coordinate';
import { MapParentControl, MapControlPosition } from '../map/controls/parent_control';
import { CompassControl } from '../map/controls/compass_control';
import { ZoomControl } from '../map/controls/zoom_control';
import { EasyAnimation } from '../map/animation/easy_animation';

//////////////
// constants
//////////////
const TILE_SIZE = 512;
const MAX_TILE_ZOOM = 15;

const defaultOptions = {
  width: 512,
  height: 512,
  center: [-73.9834558, 40.6932723] as [number, number], // BROOKLYN
  minZoom: 0,
  maxZoom: 18,
  zoom: 13,
  tileBuffer: 1,
  disabledLayers: [] as string[],
  debug: false,
};

interface MapOptions {
  id: string;
  width?: number;
  height?: number;
  center?: [number, number];
  minZoom?: number;
  maxZoom?: number;
  zoom?: number;
  tileBuffer?: number;
  disabledLayers?: string[];
  debug?: boolean;
  layers: Record<string, [number, number, number, number]>;
  tileServerURL: string;
}

// Evented
export type EventListener<EventType> = (eventType: EventType, ...eventArgs: any[]) => void;
export class Evented<EventType> {
  private eventListeners: Array<{ eventType: EventType; handler: EventListener<EventType>; enabled: boolean }> = [];

  public on(eventType: EventType, handler: EventListener<EventType>): void {
    this.eventListeners.push({
      eventType,
      handler,
      enabled: true,
    });
  }

  public once(eventType: EventType, handler: EventListener<EventType>): void {
    const onceHandler: EventListener<EventType> = (...eventArgs: any[]) => {
      this.off(eventType, onceHandler);

      handler(eventType, ...eventArgs);
    };

    this.eventListeners.push({
      eventType,
      handler: onceHandler,
      enabled: true,
    });
  }

  public off(eventType: EventType, handler: EventListener<EventType>) {
    const index = this.eventListeners.findIndex(l => {
      return l.eventType === eventType && l.handler === handler;
    });

    if (index > -1) {
      this.eventListeners[index].enabled = false;
    }
  }

  protected fire(eventType: EventType, ...eventArgs: any[]) {
    for (const listener of this.eventListeners) {
      if (!listener.enabled) {
        continue;
      }

      if (listener.eventType === eventType || listener.eventType === '*') {
        listener.handler(eventType, ...eventArgs);
      }
    }
  }
}

// Render Queue
type RenderFunc = (...any: []) => any;
type ResolveFunc = (...any: []) => any;
export class RenderQueue {
  queue: Array<[RenderFunc, ResolveFunc]> = [];
  isActive: boolean = false;
  currentIndex = 0;
  rafIds: Record<number, number> = {};

  constructor() {
    this.invokeRender = this.invokeRender.bind(this);
  }

  render(renderFn: RenderFunc): Promise<void> {
    return new Promise(resolve => {
      this.queue.push([renderFn, resolve]);

      if (!this.isActive) {
        this.rafIds[0] = requestAnimationFrame(() => {
          this.invokeRender(0);
        });
      }
    });
  }

  invokeRender(index: number) {
    if (index >= this.queue.length) {
      this.flush();
      return;
    }

    this.isActive = true;
    const renderFn = this.queue[index][0];
    const resolveFn = this.queue[index][1];

    // invoke render
    renderFn();
    // we don't need to cancel it anymore
    delete this.rafIds[index];
    this.rafIds[index + 1] = requestAnimationFrame(() => this.invokeRender(index + 1));

    // Resolve promise
    resolveFn();
  }

  flush() {
    this.isActive = false;
    this.queue = [];

    for (const rafId of Object.values(this.rafIds)) {
      cancelAnimationFrame(rafId);
    }
  }
}

// Map Camera
export class MapCamera {
  private x: number;
  private y: number;
  private zoom: number;
  private rotationInDegree: number;
  private width: number;
  private height: number;
  private viewProjectionMat: mat3;
  private pixelRatio: number;

  constructor(
    [x, y]: [number, number],
    zoom: number,
    rotationInDegree: number,
    width: number,
    height: number,
    pixelRatio: number
  ) {
    this.x = x;
    this.y = y;
    this.zoom = zoom;
    this.rotationInDegree = rotationInDegree;
    this.width = width;
    this.height = height;
    this.pixelRatio = pixelRatio;

    this.updateProjectionMatrix();
  }

  public getPosition(): [number, number] {
    return [this.x, this.y];
  }

  public setPosition([x, y]: [number, number], zoom?: number) {
    this.x = x;
    this.y = y;

    if (zoom !== undefined) {
      this.zoom = zoom;
    }

    this.updateProjectionMatrix();
  }

  public getZoom(): number {
    return this.zoom;
  }

  public setZoom(zoom: number) {
    this.zoom = zoom;

    this.updateProjectionMatrix();
  }

  public getRotation(): number {
    return this.rotationInDegree;
  }

  public setRotation(rotationInDegree: number) {
    this.rotationInDegree = rotationInDegree;

    this.updateProjectionMatrix();
  }

  public getProjectionMatrix(): mat3 {
    return this.viewProjectionMat;
  }

  public inBoundLimits(position?: [number, number], zoom?: number): boolean {
    const bbox = this.getBounds(position || [this.x, this.y], zoom || this.zoom);

    return !(bbox[0] <= -180 || bbox[1] <= -85.05 || bbox[2] >= 180 || bbox[3] >= 85.05);
  }

  public getCurrentBounds() {
    return this.getBounds([this.x, this.y], this.zoom);
  }

  public getBounds([x, y]: [number, number], zoom: number) {
    const zoomScale = Math.pow(2, zoom);

    // undo clip-space
    const px = (1 + x) / this.pixelRatio;
    const py = (1 - y) / this.pixelRatio;

    // get world coord in px
    const wx = px * TILE_SIZE;
    const wy = py * TILE_SIZE;

    // get zoom px
    const zx = wx * zoomScale;
    const zy = wy * zoomScale;

    // get bottom-left and top-right pixels
    let x1 = zx - this.width / 2;
    let y1 = zy + this.height / 2;
    let x2 = zx + this.width / 2;
    let y2 = zy - this.height / 2;

    // convert to world coords
    x1 = x1 / zoomScale / TILE_SIZE;
    y1 = y1 / zoomScale / TILE_SIZE;
    x2 = x2 / zoomScale / TILE_SIZE;
    y2 = y2 / zoomScale / TILE_SIZE;

    // get LngLat bounding box
    const bbox = [
      MercatorCoordinate.lngFromMercatorX(x1),
      MercatorCoordinate.latFromMercatorY(y1),
      MercatorCoordinate.lngFromMercatorX(x2),
      MercatorCoordinate.latFromMercatorY(y2),
    ];

    return bbox;
  }

  private updateProjectionMatrix() {
    // update camera matrix
    const zoomScale = 1 / Math.pow(2, this.zoom); // inverted
    const widthScale = TILE_SIZE / this.width;
    const heightScale = TILE_SIZE / this.height;

    const cameraMat = mat3.create();
    mat3.translate(cameraMat, cameraMat, [this.x, this.y]);
    mat3.scale(cameraMat, cameraMat, [zoomScale / widthScale, zoomScale / heightScale]);
    mat3.rotate(cameraMat, cameraMat, (Math.PI / 180) * this.rotationInDegree);

    // update view projection matrix
    const mat = mat3.create();
    const viewMat = mat3.invert(mat3.create(), cameraMat);
    const viewProjectionMat = mat3.multiply(mat, mat, viewMat);
    this.viewProjectionMat = viewProjectionMat;
  }
}

// TileGrid
type TileRef = [number, number, number];
interface FeatureSet {
  layer: string;
  type: string;
  vertices: Float32Array;
}
export interface MapTile {
  ref: TileRef;
  tileId: string;
  featureSet: any[];
}
export enum TilesGridEvent {
  TILE_LOADED = 'tileLoaded',
}
export class TilesGrid extends Evented<TilesGridEvent> {
  private tiles: Record<string, FeatureSet[]>;
  private tilesInView: TileRef[];
  private tileWorker: Worker;
  private bufferedTiles: TileRef[];
  private tileBuffer: number;
  private tileServerURL: string;
  private layers: Record<string, [number, number, number, number]>;

  constructor(tileServerURL: string, layers: Record<string, [number, number, number, number]>, tileBuffer: number) {
    super();

    this.tileServerURL = tileServerURL;
    this.layers = layers;
    this.tileBuffer = tileBuffer;
  }

  init() {
    // init tile fields
    this.tiles = {}; // cached tile data
    this.tilesInView = []; // current visible tiles
    this.tileWorker = new Worker(new URL('./workers/tile-worker.ts', import.meta.url));
    this.tileWorker.onmessage = this.handleTileWorker;
    this.tileWorker.onerror = this.handleTileWorkerError;
  }

  destroy() {}

  // update tiles with data from worker
  private handleTileWorker = (workerEvent: any) => {
    const { tile, tileData } = workerEvent.data;
    this.tiles[tile] = tileData;

    this.fire(TilesGridEvent.TILE_LOADED, this.getMapTile(tile));
  };

  // errors from tile worker
  private handleTileWorkerError = (error: any) => {
    console.error('Uncaught worker error.', error);
  };

  public updateTiles(camera: MapCamera) {
    // update visible tiles based on viewport
    const bbox = camera.getCurrentBounds();
    const z = Math.min(Math.trunc(camera.getZoom()), MAX_TILE_ZOOM);
    const minTile = tilebelt.pointToTile(bbox[0], bbox[3], z);
    const maxTile = tilebelt.pointToTile(bbox[2], bbox[1], z);

    // tiles visible in viewport
    this.tilesInView = [];
    const [minX, maxX] = [Math.max(minTile[0], 0), maxTile[0]];
    const [minY, maxY] = [Math.max(minTile[1], 0), maxTile[1]];
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        this.tilesInView.push([x, y, z]);
      }
    }

    // get additional tiles to buffer (based on buffer setting)
    this.bufferedTiles = [];
    const tileBuffer = this.tileBuffer;
    for (let bufX = minX - tileBuffer; bufX <= maxX + tileBuffer; bufX++) {
      for (let bufY = minY - tileBuffer; bufY <= maxY + tileBuffer; bufY++) {
        this.bufferedTiles.push([bufX, bufY, z]);

        // get parents 2 levels up
        this.bufferedTiles.push(tilebelt.getParent([bufX, bufY, z]) as TileRef);
        this.bufferedTiles.push(tilebelt.getParent(tilebelt.getParent([bufX, bufY, z])) as TileRef);
      }
    }

    // remove duplicates
    let tilesToLoad = [
      ...new Set([...this.tilesInView.map(t => t.join('/')), ...this.bufferedTiles.map(t => t.join('/'))]),
    ];

    // make sure tiles are in range
    tilesToLoad = tilesToLoad.filter(tile => {
      const [x, y, z] = tile.split('/').map(Number);
      const N = Math.pow(2, z);
      const validX = x >= 0 && x < N;
      const validY = y >= 0 && y < N;
      const validZ = z >= 0 && z <= MAX_TILE_ZOOM;
      return validX && validY && validZ;
    });
    const inViewLookup = new Set(this.tilesInView.map(t => t.join('/')));

    // tile fetching options
    const { layers, tileServerURL: url } = this;

    // load tiles from tilerServer
    tilesToLoad.forEach(tile => {
      if (this.tiles[tile]) {
        return; // already loaded, no need to fetch
      }
      // temp hold for request
      this.tiles[tile] = [];

      // hand off buffered tiles to worker for fetching & processing
      this.tileWorker.postMessage({ tile, layers, url });
    });
  }

  public getCurrentViewTiles(usePlaceholders: boolean = true): MapTile[] {
    const tiles = this.tilesInView.map(tileRef => this.getMapTile(tileRef));

    if (!usePlaceholders) {
      return tiles;
    }

    // add placeholder tile data.
    for (const tile of tiles) {
      let featureSets = tile.featureSet;

      if (featureSets?.length === 0) {
        featureSets = this.getPlaceholderTile(tile.ref);
      }
    }

    return tiles;
  }

  private getMapTile(refOrId: TileRef | string): MapTile {
    let tileId: string;
    let tileRef: TileRef;
    if (typeof refOrId === 'string') {
      tileId = refOrId;
      tileRef = refOrId.split('/') as unknown as TileRef;
    } else {
      tileId = refOrId.join('/');
      tileRef = refOrId;
    }

    return {
      tileId,
      ref: tileRef,
      featureSet: this.tiles[tileId],
    };
  }

  // if current tile is not loaded, just render scaled versions of parent or children
  public getPlaceholderTile(tile: TileRef) {
    // use parent if available
    const parent = tilebelt.getParent(tile)?.join('/');
    const parentFeatureSet = this.tiles[parent];
    if (parentFeatureSet?.length > 0) {
      return parentFeatureSet;
    }

    // use whatever children are available
    const childFeatureSets: any = [];
    const children = (tilebelt.getChildren(tile) || []).map(t => t.join('/'));
    children.forEach(child => {
      const featureSet = this.tiles[child];
      if (featureSet?.length > 0) {
        childFeatureSets.push(...featureSet);
      }
    });

    return childFeatureSets;
  }
}

// PAN
export class MapPan {
  private hammer: any;
  private startX: number;
  private startY: number;

  constructor(private readonly map: WebGLMap, private readonly el: HTMLElement) {}

  init() {
    this.handleMove = this.handleMove.bind(this);
    this.handlePan = this.handlePan.bind(this);
    this.handleZoom = this.handleZoom.bind(this);

    this.subscribeOnEvents();
  }

  destroy() {
    this.unsubscribeFromEvents();
  }

  private subscribeOnEvents() {
    // setup event handlers
    this.el.addEventListener('mousedown', this.handlePan);
    this.el.addEventListener('wheel', this.handleZoom);

    // mobile event handlers
    this.hammer = new Hammer(this.el);
    this.hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
    this.hammer.on('panstart', this.handlePan);
    this.hammer.get('pinch').set({ enable: true });
    this.hammer.on('pinch', this.handleZoom);
  }

  private unsubscribeFromEvents() {
    this.el.removeEventListener('mousedown', this.handlePan);
    this.el.removeEventListener('wheel', this.handleZoom);

    this.hammer.off('panstart', this.handlePan);
    this.hammer.off('pinch', this.handleZoom);
  }

  // handle drag changes while mouse is still down
  // "mousemove" or "pan"
  private handleMove(moveEvent: MouseEvent) {
    const [x, y] = this.getClipSpacePosition(moveEvent);
    const viewProjectionMat = this.map.getProjectionMatrix();

    // compute the previous position in world space
    const [preX, preY] = vec3.transformMat3(
      vec3.create(),
      [this.startX, this.startY, 0],
      mat3.invert(mat3.create(), viewProjectionMat)
    );

    // compute the new position in world space
    const [postX, postY] = vec3.transformMat3(vec3.create(), [x, y, 0], mat3.invert(mat3.create(), viewProjectionMat));

    // move that amount, because how much the position changes depends on the zoom level
    const deltaX = preX - postX;
    const deltaY = preY - postY;
    if (isNaN(deltaX) || isNaN(deltaY)) {
      return; // abort
    }

    const cameraPos = this.map.getCenterXY();
    const newX = cameraPos[0] + deltaX;
    const newY = cameraPos[1] + deltaY;

    if (!this.map.inBoundLimits([newX, newY])) {
      return;
    }

    // save current pos for next movement
    this.startX = x;
    this.startY = y;

    this.map.setCenter([newX, newY]);
  }

  // handle dragging the map position (panning)
  // "mousedown" OR "panstart"
  private handlePan(startEvent: MouseEvent) {
    startEvent.preventDefault();

    // get position of initial drag
    let [startX, startY] = this.getClipSpacePosition(startEvent);
    this.startX = startX;
    this.startY = startY;
    this.el.style.cursor = 'grabbing';

    // handle move events once started
    window.addEventListener('mousemove', this.handleMove);
    this.hammer.on('pan', this.handleMove);

    // clear on release
    const clear = () => {
      this.el.style.cursor = 'grab';

      window.removeEventListener('mousemove', this.handleMove);
      this.hammer.off('pan', this.handleMove);

      window.removeEventListener('mouseup', clear);
      this.hammer.off('panend', clear);
    };
    window.addEventListener('mouseup', clear);
    this.hammer.on('panend', clear);
  }

  // handle zooming
  private handleZoom(wheelEvent: WheelEvent) {
    wheelEvent.preventDefault();

    const [x, y] = this.getClipSpacePosition(wheelEvent);

    // get position before zooming
    const [preZoomX, preZoomY] = vec3.transformMat3(
      vec3.create(),
      [x, y, 0],
      mat3.invert(mat3.create(), this.map.getProjectionMatrix())
    );

    // update current zoom state
    const prevZoom = this.map.getZoom();
    const zoomDelta = -wheelEvent.deltaY * (1 / 300);
    let newZoom = prevZoom + zoomDelta;
    newZoom = Math.max(this.map.getMinZoom(), Math.min(newZoom, this.map.getMaxZoom()));

    if (!this.map.inBoundLimits(this.map.getCenterXY(), newZoom)) {
      return;
    }

    this.map.setZoom(newZoom);

    // get new position after zooming
    const [postZoomX, postZoomY] = vec3.transformMat3(
      vec3.create(),
      [x, y, 0],
      mat3.invert(mat3.create(), this.map.getProjectionMatrix())
    );

    // camera needs to be moved the difference of before and after
    const [cameraX, cameraY] = this.map.getCenterXY();
    const newX = cameraX + preZoomX - postZoomX;
    const newY = cameraY + preZoomY - postZoomY;

    if (!this.map.inBoundLimits([newX, newY], newZoom)) {
      return;
    }

    this.map.setCenter([newX, newY], newZoom);
  }

  // from a given mouse position on the canvas, return the xy value in clip space
  private getClipSpacePosition(e: MouseEvent) {
    // get position from mouse or touch event
    // @ts-ignore
    const [x, y] = [e.center?.x || e.clientX, e.center?.y || e.clientY];

    // get canvas relative css position
    const rect = this.el.getBoundingClientRect();

    const cssX = x - rect.left;
    const cssY = y - rect.top;

    // get normalized 0 to 1 position across and down canvas
    const normalizedX = cssX / this.el.clientWidth;
    const normalizedY = cssY / this.el.clientHeight;

    // convert to clip space
    const clipX = normalizedX * 2 - 1;
    const clipY = normalizedY * -2 + 1;

    return [clipX, clipY];
  }
}

////////////
// shaders
////////////
const vertexShaderSource = `
  attribute vec2 a_position;

  uniform mat3 u_matrix;

  void main() {
    gl_PointSize = 3.0;

    vec2 position = (u_matrix * vec3(a_position, 1)).xy;
    
    // Clip space
    // vec2 zeroToTwo = position * 2.0;
    // vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(position, 0, 1);
  }
`;

const fragmentShaderSource = `
  precision mediump float;

  uniform vec4 u_color;

  void main() {
    gl_FragColor = u_color;
  }
`;
export class WebGlRenderer {
  private positionBuffer: WebGLBuffer;
  private program: WebGLProgram;
  private matrixLocation: any;
  private colorLocation: any;

  constructor(
    private readonly gl: WebGLRenderingContext,
    private pixelRatio: number,
    private readonly overlay: HTMLElement
  ) {}

  init() {
    const gl = this.gl;
    // get GL context
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // compile shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    // setup program
    const program = createProgram(gl, vertexShader, fragmentShader);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    // create buffers
    this.positionBuffer = gl.createBuffer();

    this.matrixLocation = gl.getUniformLocation(program, 'u_matrix');
    this.colorLocation = gl.getUniformLocation(program, 'u_color');

    // save gl references
    this.program = program;
  }

  destroy() {}

  render(tiles: MapTile[], matrix: mat3, mapOptions: MapOptions) {
    const gl = this.gl;

    // set matrix uniform
    gl.uniformMatrix3fv(this.matrixLocation, false, matrix);

    for (const tile of tiles) {
      let featureSets = tile.featureSet;

      (featureSets || []).forEach(featureSet => {
        const { layer, type, vertices } = featureSet;

        if (mapOptions.disabledLayers.includes(layer)) {
          return;
        }

        const color = mapOptions.layers[layer].map(n => n / 255); // RBGA to WebGL

        // set color uniform
        gl.uniform4fv(this.colorLocation, color);

        // create buffer for vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // setup position attribute
        const positionAttributeLocation = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(positionAttributeLocation);

        // tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        const size = 2;
        const dataType = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        let offset = 0;
        gl.vertexAttribPointer(positionAttributeLocation, size, dataType, normalize, stride, offset);

        // draw
        const primitiveType = getPrimitiveType(gl, type);
        offset = 0;
        const count = vertices.length / 2;
        gl.drawArrays(primitiveType, offset, count);
      });
    }
  }

  renderTilesBorder(tiles: MapTile[], matrix: mat3, canvasWidth: number, canvasHeight: number, mapOptions: MapOptions) {
    const gl = this.gl;

    for (const tile of tiles) {
      // todo: move up in other tile loop
      const colorLocation = gl.getUniformLocation(this.program, 'u_color');
      gl.uniform4fv(colorLocation, [1, 0, 0, 1]);

      const tileVertices = geometryToVertices(tilebelt.tileToGeoJSON(tile.ref));
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(tileVertices), gl.STATIC_DRAW);

      // setup position attribute
      const positionAttributeLocation = gl.getAttribLocation(this.program, 'a_position');
      gl.enableVertexAttribArray(positionAttributeLocation);

      // tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
      const size = 2;
      const dataType = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      let offset = 0;
      gl.vertexAttribPointer(positionAttributeLocation, size, dataType, normalize, stride, offset);

      // draw
      const primitiveType = gl.LINES;
      offset = 0;
      const count = tileVertices.length / 2;
      gl.drawArrays(primitiveType, offset, count);

      // draw tile labels
      const tileCoordinates = tilebelt.tileToGeoJSON(tile.ref).coordinates;
      const topLeft = tileCoordinates[0][0];
      const [x, y] = MercatorCoordinate.fromLngLat(topLeft as [number, number]);

      const [clipX, clipY] = vec3.transformMat3(vec3.create(), [x, y, 1], matrix);

      const wx = ((1 + clipX) / this.pixelRatio) * canvasWidth;
      const wy = ((1 - clipY) / this.pixelRatio) * canvasHeight;
      const div = document.createElement('div');
      div.className = 'tile-label';
      div.style.left = wx + 8 + 'px';
      div.style.top = wy + 8 + 'px';
      div.appendChild(document.createTextNode(tile.tileId));
      this.overlay.appendChild(div);
    }
  }
}

export class WebGLMap {
  private pan: MapPan;
  private camera: MapCamera;
  private tilesGrid: TilesGrid;
  private renderQueue: RenderQueue;
  private renderer: WebGlRenderer;

  mapOptions: MapOptions;

  stats: Stats;
  pixelRatio: number;
  canvas: HTMLCanvasElement;

  overlay: HTMLElement;
  debugInfo: HTMLElement;
  statsWidget: HTMLElement;
  frameStats: {
    elapsed: number;
  };

  constructor(options: MapOptions) {
    this.mapOptions = {
      ...defaultOptions,
      ...options,
    };

    // setup stats for debugging
    this.stats = new Stats();
    this.pixelRatio = 2;
    // setup canvas
    this.setupDOM();

    this.renderQueue = new RenderQueue();

    // setup camera
    const [x, y] = MercatorCoordinate.fromLngLat(this.mapOptions.center);
    this.camera = new MapCamera(
      [x, y],
      this.mapOptions.zoom,
      0,
      this.canvas.width,
      this.canvas.height,
      this.pixelRatio
    );

    this.tilesGrid = new TilesGrid(options.tileServerURL, options.layers, options.tileBuffer || 1);

    this.pan = new MapPan(this, this.canvas);

    const gl = this.canvas.getContext('webgl');
    this.renderer = new WebGlRenderer(gl, this.pixelRatio, this.overlay);

    this.init();
    this.rerender();
  }

  init() {
    this.pan.init();
    this.tilesGrid.init();
    this.tilesGrid.on(TilesGridEvent.TILE_LOADED, this.onTileLoaded);
    this.renderer.init();
  }

  destroy() {
    this.pan.destroy();
    this.tilesGrid.destroy();
    this.tilesGrid.off(TilesGridEvent.TILE_LOADED, this.onTileLoaded);
    this.renderer.init();
  }

  private onTileLoaded = () => {
    this.rerender();
  };

  setOptions(options = {}) {
    this.mapOptions = {
      ...this.mapOptions,
      ...options,
    };
  }

  getZoom(): number {
    return this.camera.getZoom();
  }

  getMinZoom(): number {
    return this.mapOptions.minZoom;
  }

  getMaxZoom(): number {
    return this.mapOptions.maxZoom;
  }

  setZoom(zoom: number, rerender = true) {
    this.camera.setZoom(zoom);

    if (rerender) {
      this.rerender();
    }
  }

  getCenter(): [number, number] {
    const cameraPosition = this.camera.getPosition();

    return MercatorCoordinate.fromXY(cameraPosition);
  }

  getCenterXY(): [number, number] {
    return this.camera.getPosition();
  }

  setCenter(pos: [number, number], zoom?: number, rerender = true) {
    this.camera.setPosition(pos, zoom);

    if (rerender) {
      this.rerender();
    }
  }

  zoomToPoint(newZoom: number, center: [number, number], rerender = true) {
    const currentZoom = this.camera.getZoom();
    const diff = newZoom - currentZoom;

    if (!rerender) {
      return;
    }

    const animation = new EasyAnimation(
      (progress: number) => {
        const nextZoomValue = currentZoom + diff * progress;

        this.camera.setZoom(nextZoomValue);

        return this.rerender();
      },
      () => {
        this.renderQueue.flush();
      },
      {
        durationInSec: 0.25,
      }
    );

    animation.run();
  }

  setRotation(rotationInDegree: number, rerender = true) {
    this.camera.setRotation(rotationInDegree);

    if (rerender) {
      this.rerender();
    }
  }

  inBoundLimits(position?: [number, number], zoom?: number): boolean {
    return this.camera.inBoundLimits(position, zoom);
  }

  getProjectionMatrix(): mat3 {
    return this.camera.getProjectionMatrix();
  }

  rerender(): Promise<void> {
    this.tilesGrid.updateTiles(this.camera);
    return this.renderQueue.render(() => this.render());
  }

  // re-draw the scene
  render() {
    const { mapOptions, overlay, stats } = this;

    // stats reporting
    let start = performance.now();
    if (mapOptions.debug) {
      stats.begin();
    }

    const tiles = this.tilesGrid.getCurrentViewTiles();

    const projectionMatrix = this.camera.getProjectionMatrix();

    this.renderer.render(tiles, projectionMatrix, mapOptions);

    // clear debug info
    overlay.replaceChildren();
    this.debugInfo.style.display = 'none';
    this.statsWidget.style.display = 'none';

    // draw debug tile boundaries
    if (mapOptions.debug) {
      this.debugInfo.style.display = 'block';
      this.statsWidget.style.display = 'block';

      this.renderer.renderTilesBorder(tiles, projectionMatrix, this.canvas.width, this.canvas.height, mapOptions);

      // capture stats
      this.frameStats = {
        elapsed: performance.now() - start,
      };
      stats.end();
    }
  }

  // create DOM elements
  setupDOM = () => {
    // create canvas
    const canvas = document.createElement('canvas');
    const canvasId = `WebGLMap-canvas-${this.mapOptions.id}`;
    canvas.setAttribute('id', canvasId);
    canvas.setAttribute('width', this.mapOptions.width + 'px');
    canvas.setAttribute('height', this.mapOptions.height + 'px');
    this.canvas = canvas;

    // create overlay (for tile debugging)
    const overlay = document.createElement('div');
    const overlayId = `WebGLMap-overlay-${this.mapOptions.id}`;
    overlay.setAttribute('id', overlayId);
    this.overlay = overlay;

    // create div for debug info
    const debugInfo = document.createElement('div');
    const debugInfoId = `WebGLMap-debugInfo-${this.mapOptions.id}`;
    debugInfo.setAttribute('id', debugInfoId);
    this.debugInfo = debugInfo;

    // create style tag
    const style = document.createElement('style');
    style.appendChild(
      document.createTextNode(`
      #${canvasId} {
        position: absolute;
        width: ${this.mapOptions.width}px;
        height: ${this.mapOptions.height}px;
        top: 0;
        left: 0;
        background: transparent;
      }

      #${canvasId}:hover {
        cursor: grab;
      }

      #${overlayId} {
        position: absolute;
        width: ${this.mapOptions.width}px;
        height: ${this.mapOptions.height}px;
        top: 0;
        left: 0;
        overflow: hidden;
        user-select: none;
      }

      #${overlayId} .tile-label {
        color: red;
        position: absolute;
        z-index: 1000;
      }

      #${debugInfoId} {
        position: absolute;
        bottom: 0;
        left: 0;
        background: transparent;
        padding: 10px;
        font-size: 10px;
        white-space: pre;
      }
    `)
    );

    // create wrapper
    const wrapper = document.createElement('div');
    const wrapperId = `WebGLMap-wrapper-${this.mapOptions.id}`;
    wrapper.setAttribute('id', wrapperId);
    wrapper.setAttribute('class', 'WebGLMap-wrapper');
    wrapper.style.position = 'relative';
    wrapper.style.overflow = 'hidden';
    wrapper.style.width = this.mapOptions.width + 'px';
    wrapper.style.height = this.mapOptions.height + 'px';
    wrapper.appendChild(overlay);
    wrapper.appendChild(canvas);
    wrapper.appendChild(debugInfo);

    // append elements to DOM
    const el = document.getElementById(this.mapOptions.id);
    el.appendChild(wrapper);
    el.appendChild(style);

    const parentControl = new MapParentControl(this, MapControlPosition.BOTTOM_RIGHT);
    const compassControl = new CompassControl(this);
    const zoomControl = new ZoomControl(this);
    parentControl.addControl(compassControl);
    parentControl.addControl(zoomControl);
    parentControl.init();
    parentControl.attach(el);

    if (this.mapOptions.debug) {
      this.stats.showPanel(0);
      this.statsWidget = this.stats.dom;
      this.statsWidget.style.position = 'absolute';
      wrapper.appendChild(this.statsWidget);
    }
  };
}

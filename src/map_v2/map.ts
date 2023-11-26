import { mat3 } from 'gl-matrix';
import Stats from 'stats.js';
import { MapPan } from './pan/map_pan';
import { MapCamera } from './camera/map_camera';
import { Projection, ProjectionType, getProjectionFromType } from './geo/projection/projection';
import { Renderer } from './renderer/renderer';
import { RenderQueue } from './render_queue/render_queue';
import { TilesGrid, TilesGridEvent } from './tile/tiles_grid';
import { WebGlRenderer } from './renderer/webgl/webgl_renderer';
import { MapParentControl, MapControlPosition } from '../map/controls/parent_control';
import { CompassControl } from '../map/controls/compass_control';
import { ZoomControl } from '../map/controls/zoom_control';
import { EasyAnimation } from '../map/animation/easy_animation';
import { MapTileFormatType } from './tile/tile';

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
  tileSize: 512,
  maxTileZoom: 15,
  projection: 'mercator',
  tileFormatType: MapTileFormatType.pbf,
};

interface MapOptions {
  id: string;
  layers: Record<string, [number, number, number, number]>;
  tileServerURL: string;
  tileFormatType?: string | MapTileFormatType;
  projection?: string | ProjectionType;
  width?: number;
  height?: number;
  center?: [number, number];
  minZoom?: number;
  maxZoom?: number;
  zoom?: number;
  tileBuffer?: number;
  disabledLayers?: string[];
  debug?: boolean;
  tileSize?: number;
  maxTileZoom?: number;
}

export class WebGLMap {
  private pan: MapPan;
  private camera: MapCamera;
  private tilesGrid: TilesGrid;
  private renderQueue: RenderQueue;
  private renderer: Renderer;
  private projection: Projection;
  private mapOptions: MapOptions;
  private stats: Stats;
  private pixelRatio: number;
  private canvas: HTMLCanvasElement;

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
    this.pixelRatio = window.devicePixelRatio;
    // setup canvas
    this.setupDOM();

    this.renderQueue = new RenderQueue();

    this.projection = getProjectionFromType(this.mapOptions.projection);
    const [x, y] = this.projection.fromLngLat(this.mapOptions.center);
    this.camera = new MapCamera(
      [x, y],
      this.mapOptions.zoom,
      0,
      this.canvas.width,
      this.canvas.height,
      this.pixelRatio,
      this.mapOptions.tileSize,
      this.projection
    );
    this.tilesGrid = new TilesGrid(
      this.mapOptions.tileFormatType as MapTileFormatType,
      this.mapOptions.tileServerURL,
      this.mapOptions.layers,
      this.mapOptions.tileBuffer || 1,
      this.mapOptions.maxTileZoom,
      this.projection
    );
    this.pan = new MapPan(this, this.canvas);
    this.renderer = new WebGlRenderer(this.canvas.getContext('webgl'), this.pixelRatio, this.overlay, this.projection);

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

    return this.projection.fromXY(cameraPosition);
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

      this.renderer.renderTilesBorder(tiles, projectionMatrix, this.canvas.width, this.canvas.height);

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

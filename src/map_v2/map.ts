import Stats from 'stats.js';
import { Evented } from './evented';
import { MapPan } from './pan/map_pan';
import { MapCamera } from './camera/map_camera';
import { Projection, ProjectionType, getProjectionFromType } from './geo/projection/projection';
import { Renderer } from './renderer/renderer';
import { RenderQueue } from './render_queue/render_queue';
import { TilesGrid, TilesGridEvent } from './tile/tile_grid';
import { WebGlRenderer } from './renderer/webgl/webgl_renderer';
import { MapParentControl, MapControlPosition } from '../map/controls/parent_control';
import { CompassControl } from '../map/controls/compass_control';
import { ZoomControl } from '../map/controls/zoom_control';
import { EasyAnimation } from '../map/animation/easy_animation';
import { MapTileFormatType } from './tile/tile';

const defaultOptions = {
  width: 512,
  height: 512,
  center: [0, 0] as [number, number],
  zoom: 1,
  rotation: 0,
  minZoom: 0,
  maxZoom: 15,
  tileBuffer: 1,
  tileSize: 512,
  projection: 'mercator',
  tileFormatType: MapTileFormatType.pbf,
  resizable: true,
  controls: {
    zoom: true,
    compas: true,
    debug: true,
  },
};

export interface MapOptions {
  /** HtmlElement where map canvas will attached to. */
  rootEl: HTMLElement;
  id?: string;
  width?: number;
  height?: number;

  /** Initial map camera position. */
  center?: [number, number];
  /** Initial zoom value of the map. */
  zoom?: number;
  /** Initial rotation value of the map. */
  rotation?: number;
  /** Number of tiles to featch around. */
  tileBuffer?: number;
  /** Custom value of device pixel ratio. By defauled would be used `window.devicePixelRatio`. */
  devicePixelRatio?: number;
  /** When `true` then map will listen for `rootEl` width/height changes. */
  resizable?: boolean;
  /**
   * Map control configuration.
   * Provide `true` or `false` to show/hide map control on UI.
   */
  controls?: {
    zoom?: boolean;
    move?: boolean;
    compas?: boolean;
    debug?: boolean;
  };

  // TODO: move to TileStyles
  tileSize?: number;
  layers: Record<string, [number, number, number, number]>;

  // TODO: tile meta url
  /** Meta info url to fetch data about tiles and styles. */
  tileMetaUrl?: string;
  tilesUrl: string;
  tileFormatType?: string | MapTileFormatType;
  /** Map min zoom level. */
  minZoom?: number;
  /** Map max zoom level. */
  maxZoom?: number;
  projection?: string | ProjectionType;
}

export enum MapEventType {
  ANY = '*',
  ZOOM = 'map_zoom',
  CENTER = 'map_center',
  ROTATION = 'map_rotation',

  MOVE_START = 'map_movestart',
  MOVE = 'map_move',
  MOVE_END = 'map_moveend',
  DRAG_START = 'map_dragstart',
  DRAG = 'map_drag',
  DRAG_END = 'map_dragend',

  RESIZE = 'map_resize',
  RENDER = 'map_render',
  PREHEAT = 'map_tile_preheat',
}

export class GlideV2Map extends Evented<MapEventType> {
  private readonly rootEl: HTMLElement;
  private pan: MapPan;
  private camera: MapCamera;
  private tilesGrid: TilesGrid;
  private renderQueue: RenderQueue;
  private renderer: Renderer;
  private projection: Projection;
  private mapOptions: MapOptions;
  private stats: Stats;
  private pixelRatio: number;
  private width: number;
  private height: number;

  statsWidget: HTMLElement;
  frameStats: {
    elapsed: number;
  };

  constructor(options: MapOptions) {
    super();
    this.mapOptions = {
      ...defaultOptions,
      ...options,
    };

    this.rootEl = this.mapOptions.rootEl;
    this.width = this.rootEl.offsetWidth;
    this.height = this.rootEl.offsetHeight;

    this.stats = new Stats();
    this.pixelRatio = window.devicePixelRatio;

    this.renderQueue = new RenderQueue();

    this.projection = getProjectionFromType(this.mapOptions.projection);
    const [x, y] = this.projection.fromLngLat(this.mapOptions.center);
    this.camera = new MapCamera(
      [x, y],
      this.mapOptions.zoom,
      this.mapOptions.rotation,
      this.width,
      this.height,
      this.pixelRatio,
      this.mapOptions.tileSize,
      this.projection
    );
    this.tilesGrid = new TilesGrid(
      this.mapOptions.tileFormatType as MapTileFormatType,
      this.mapOptions.tilesUrl,
      this.mapOptions.layers,
      this.mapOptions.tileBuffer || 1,
      this.mapOptions.maxZoom,
      this.projection
    );
    this.pan = new MapPan(this, this.rootEl);
    this.renderer = new WebGlRenderer(this.rootEl, this.pixelRatio);

    this.init();
    this.rerender();
  }

  init() {
    this.setupMapControls();

    this.pan.init();
    this.tilesGrid.init();
    this.tilesGrid.on(TilesGridEvent.TILE_LOADED, this.onTileLoaded);
    this.renderer.init();

    if (this.mapOptions.resizable) {
      window.addEventListener('resize', this.resizeEventListener);
    }
  }

  destroy() {
    this.pan.destroy();
    this.tilesGrid.destroy();
    this.tilesGrid.off(TilesGridEvent.TILE_LOADED, this.onTileLoaded);
    this.renderer.destroy();
  }

  private onTileLoaded = () => {
    this.rerender();
  };

  private resizeEventListener = () => {
    this.width = this.rootEl.offsetWidth;
    this.height = this.rootEl.offsetHeight;

    this.camera.resize(this.width, this.height);
    this.renderer.resize(this.width, this.height);

    this.rerender();
    this.fire(MapEventType.RESIZE, { width: this.width, height: this.height });
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

  // Get Geo location
  getCenter(): [number, number] {
    const cameraPosition = this.camera.getPosition();

    return this.projection.fromXY(cameraPosition);
  }

  // Get Camera location
  getCenterXY(): [number, number] {
    return this.camera.getPosition();
  }

  setZoom(zoom: number, rerender = true) {
    this.camera.setZoom(zoom);
    this.fire(MapEventType.ZOOM, zoom);

    if (rerender) {
      this.rerender();
    }
  }

  setCenter(pos: [number, number], zoom?: number, rerender = true) {
    this.camera.setPosition(pos, zoom);
    this.fire(MapEventType.CENTER, pos);

    if (rerender) {
      this.rerender();
    }
  }

  setRotation(rotationInDegree: number, rerender = true) {
    this.camera.setRotation(rotationInDegree);
    this.fire(MapEventType.ROTATION, rotationInDegree);

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
        this.fire(MapEventType.ZOOM, this.getZoom());
      },
      {
        durationInSec: 0.25,
      }
    );

    this.renderQueue.flush();
    animation.run();
  }

  inBoundLimits(position?: [number, number], zoom?: number): boolean {
    return this.camera.inBoundLimits(position, zoom);
  }

  getProjectionMatrix() {
    return this.camera.getProjectionMatrix();
  }

  rerender(): Promise<void> {
    this.tilesGrid.updateTiles(this.camera);

    return this.renderQueue.render(() => {
      this.render();
      this.fire(MapEventType.RENDER);
    });
  }

  private render() {
    let start = performance.now();
    if (this.mapOptions.controls.debug) {
      this.stats.begin();
    }

    const tiles = this.tilesGrid.getCurrentViewTiles();
    const projectionMatrix = this.camera.getProjectionMatrix();

    this.renderer.render(tiles, projectionMatrix, this.mapOptions);

    this.statsWidget.style.display = 'none';

    if (this.mapOptions.controls.debug) {
      this.statsWidget.style.display = 'block';

      this.frameStats = {
        elapsed: performance.now() - start,
      };
      this.stats.end();
    }
  }

  private setupMapControls() {
    const parentControl = new MapParentControl(this, MapControlPosition.BOTTOM_RIGHT);

    if (this.mapOptions.controls.compas) {
      const compassControl = new CompassControl(this);
      parentControl.addControl(compassControl);
    }

    if (this.mapOptions.controls.zoom) {
      const zoomControl = new ZoomControl(this);
      parentControl.addControl(zoomControl);
    }

    parentControl.init();
    parentControl.attach(this.rootEl);

    if (this.mapOptions.controls.debug) {
      this.stats.showPanel(0);
      this.statsWidget = this.stats.dom;
      this.statsWidget.style.position = 'absolute';
      this.rootEl.appendChild(this.statsWidget);
    }
  }
}

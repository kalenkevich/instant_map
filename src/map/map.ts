import Stats from 'stats.js';
import { Evented } from './evented';
import { Vector2, Vector3 } from './math/matrix_utils';
import { MapPan, MapPanEvents } from './pan/map_pan';
import { MapCamera } from './camera/map_camera';
import { Projection, ProjectionType, getProjectionFromType } from './geo/projection/projection';
import { MapTileRendererType, MapTileRenderer } from './renderer/renderer';
import { RenderQueue } from './renderer/render_queue/render_queue';
import { TilesGrid, TilesGridEvent } from './tile/tile_grid';
import { WebGlMapTileRenderer } from './renderer/webgl/webgl_map_tile_renderer';
import { MapParentControl, MapControlPosition } from './controls/parent_control';
import { CompassControl } from './controls/compass_control';
import { ZoomControl } from './controls/zoom_control';
import { StyleSelectControl, DataTileStylesSelectConfig } from './controls/style_select_control';
import { EasyAnimation } from './animation/easy_animation';
import { FontManager } from './font/font_manager';
import { GlyphsManager } from './glyphs/glyphs_manager';
import { DataTileStyles } from './styles/styles';
import { MapFeatureFlags } from './flags';

const defaultOptions = {
  center: [0, 0] as Vector2,
  zoom: 1,
  rotation: [Math.PI / 4, 0, 0] as Vector3,
  tileBuffer: 1,
  projection: 'mercator',
  resizable: true,
  controls: {
    zoom: true,
    compas: true,
    debug: true,
  },
  featureFlags: {},
};

export interface MapOptions {
  /** HtmlElement where map canvas will attached to. */
  rootEl: HTMLElement;
  id?: string;
  width?: number;
  height?: number;
  rendrer: MapTileRendererType;
  /** Initial map camera position. */
  center?: [number, number, number?];
  /** Initial zoom value of the map. */
  zoom?: number;
  /** Initial rotation value of the map. */
  rotation?: [number, number, number];
  /** Number of tiles to store in cache */
  tileCacheSize?: number;
  /** Number of tiles to fetch around. */
  tileBuffer?: number;
  /** Number of workers to run in background. */
  workerPool?: number;
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
    stylesSelect?: DataTileStylesSelectConfig[];
  };
  tileStyles: DataTileStyles;
  // TODO: tile meta url
  /** Meta info url to fetch data about tiles and styles. */
  tileMetaUrl?: string;
  projection?: string | ProjectionType;
  featureFlags?: MapFeatureFlags;
}

interface RenderOptions {
  pruneCache: boolean;
  clearRenderQueue: boolean;
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

export class InstantMap extends Evented<MapEventType> {
  private readonly rootEl: HTMLElement;
  private readonly featureFlags: MapFeatureFlags;
  private pan: MapPan;
  private camera: MapCamera;
  private tilesGrid: TilesGrid;
  private renderQueue: RenderQueue;
  private fontManager: FontManager;
  private glyphsManager: GlyphsManager;
  private renderer: MapTileRenderer;
  private projection: Projection;
  private mapOptions: MapOptions;
  private stats: Stats;
  private devicePixelRatio: number;
  private width: number;
  private height: number;
  private minZoom: number;
  private maxZoom: number;
  private styles: DataTileStyles;
  private resizeObserver?: ResizeObserver;

  private statsWidget: HTMLElement;
  private frameStats: {
    elapsed: number;
  };

  constructor(options: MapOptions) {
    super();
    this.mapOptions = {
      ...defaultOptions,
      ...options,
    };
    this.featureFlags = this.mapOptions.featureFlags;
    this.rootEl = this.mapOptions.rootEl;
    this.width = this.rootEl.offsetWidth;
    this.height = this.rootEl.offsetHeight;
    this.stats = new Stats();

    this.setup(
      this.featureFlags,
      this.mapOptions,
      this.mapOptions.tileStyles,
      [this.mapOptions.center[0], this.mapOptions.center[1], this.mapOptions.center[2] || 1], // [lng, lat]
      this.mapOptions.zoom,
      this.mapOptions.rotation,
    );
    this.init().then(() => {
      this.rerender({ pruneCache: false, clearRenderQueue: false });
    });
  }

  async init() {
    this.setupMapControls();

    await Promise.all([this.fontManager.init(), this.glyphsManager.init()]);

    this.pan.init();
    if (this.featureFlags.enableObjectSelection) {
      this.pan.on(MapPanEvents.click, this.onMapClick);
    }
    this.tilesGrid.init();
    this.tilesGrid.on(TilesGridEvent.TILE_LOADED, this.onTileChanged);
    await this.renderer.init();

    if (this.mapOptions.resizable) {
      this.resizeObserver = new ResizeObserver(this.resizeEventListener);
      this.resizeObserver.observe(this.rootEl, { box: 'content-box' });
    }

    return;
  }

  destroy() {
    if (this.featureFlags.enableObjectSelection) {
      this.pan.off(MapPanEvents.click, this.onMapClick);
    }
    this.pan.destroy();
    this.tilesGrid.off(TilesGridEvent.TILE_LOADED, this.onTileChanged);
    this.tilesGrid.destroy();
    this.renderer.destroy();
    this.resizeObserver?.unobserve(this.rootEl);
  }

  setStyles(mapStyle: DataTileStyles) {
    this.destroy();
    this.setup(
      this.featureFlags,
      this.mapOptions,
      mapStyle,
      this.projection.unproject(this.camera.getPosition(), { normalized: true, clipped: true }),
      this.camera.getZoom(),
      this.camera.getRotation(),
    );
    this.init().then(() => {
      this.rerender({ pruneCache: false, clearRenderQueue: false });
    });
  }

  getStyles(): DataTileStyles {
    return this.styles;
  }

  private setup(
    featureFlags: MapFeatureFlags,
    mapOptions: MapOptions,
    styles: DataTileStyles,
    center: Vector3, // [lng, lat, alt]
    zoom: number,
    cameraRotation: Vector3,
  ) {
    this.minZoom = mapOptions.tileStyles.minzoom || 1;
    this.maxZoom = mapOptions.tileStyles.maxzoom || 15;
    this.devicePixelRatio = mapOptions.devicePixelRatio || window.devicePixelRatio;
    this.styles = styles;
    this.renderQueue = new RenderQueue();
    this.fontManager = new FontManager(featureFlags, styles.fonts || {});
    this.glyphsManager = new GlyphsManager(featureFlags, styles.glyphs || {});
    this.projection = getProjectionFromType(mapOptions.projection);
    this.camera = new MapCamera(
      featureFlags,
      this.projection.project(center, { normalize: true, clip: true }),
      cameraRotation,
      zoom,
      this.width,
      this.height,
      styles.tileSize,
      this.projection,
    );
    this.tilesGrid = new TilesGrid(
      featureFlags,
      mapOptions.rendrer,
      styles,
      mapOptions.tileCacheSize || 128,
      mapOptions.tileBuffer || 1,
      mapOptions.workerPool || 2,
      styles.tileSize,
      this.devicePixelRatio,
      this.maxZoom,
      this.projection.getType(),
      this.fontManager,
      this.glyphsManager,
    );
    this.pan = new MapPan(this, this.rootEl);
    this.renderer = this.getRenderer(mapOptions.rendrer);
  }

  private onTileChanged = () => {
    this.rerender({ pruneCache: false, clearRenderQueue: true });
  };

  private onMapClick = (event: MapPanEvents, clickEvent: MouseEvent, clippedWebGlSpaceCoords: [number, number]) => {
    const tiles = this.tilesGrid.getCurrentViewTiles();
    const objectId = this.renderer.getObjectId(
      tiles,
      // camera object
      {
        x: this.camera.getPositionX(),
        y: this.camera.getPositionY(),
        distance: this.camera.getDistance(),
        width: this.camera.getWidth(),
        height: this.camera.getHeight(),
        fieldOfView: this.camera.getFieldOfViewRadians(),
        zNear: 1,
        zFar: this.camera.getDistance(),
        xRotation: this.camera.getRotationX(),
        yRotation: this.camera.getRotationY(),
        zRotation: this.camera.getRotationZ(),
      },
      clippedWebGlSpaceCoords[0],
      clippedWebGlSpaceCoords[1],
    );

    console.log('objectId', objectId);
  };

  private resizeEventListener = () => {
    this.width = this.rootEl.offsetWidth;
    this.height = this.rootEl.offsetHeight;

    this.camera.resize(this.width, this.height);
    this.renderer.resize(this.width, this.height);

    this.rerender({ pruneCache: false, clearRenderQueue: true });
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
    return this.minZoom;
  }

  getMaxZoom(): number {
    return this.maxZoom;
  }

  // Get Geo location
  getCenter(): Vector3 {
    return this.projection.unproject(this.camera.getPosition(), { normalized: true, clipped: true });
  }

  // Get Camera location
  getCenterXYZ(): Vector3 {
    return this.camera.getPosition();
  }

  setZoom(zoom: number, rerender = true) {
    this.camera.setZoom(zoom);
    this.fire(MapEventType.ZOOM, zoom);

    if (rerender) {
      this.rerender({ pruneCache: false, clearRenderQueue: true });
    }
  }

  setCenter(pos: Vector3, zoom?: number, rerender = true) {
    this.camera.setPosition(pos, zoom);
    this.fire(MapEventType.CENTER, pos);

    if (rerender) {
      this.rerender({ pruneCache: false, clearRenderQueue: true });
    }
  }

  setRotation(cameraRotation: Vector3, rerender = true) {
    this.camera.setRotation(cameraRotation);
    this.fire(MapEventType.ROTATION, cameraRotation);

    if (rerender) {
      this.rerender({ pruneCache: false, clearRenderQueue: true });
    }
  }

  panBy(center: Vector3, rerender = true) {
    if (!rerender) {
      return;
    }

    return Promise.resolve();
  }

  zoomToPoint(newZoom: number, center: Vector3, rerender = true) {
    const currentZoom = this.camera.getZoom();
    const diff = newZoom - currentZoom;

    if (!rerender) {
      return;
    }

    const animation = new EasyAnimation(
      (progress: number) => {
        const nextZoomValue = currentZoom + diff * progress;

        this.setZoom(nextZoomValue, false);
        return this.rerender({ pruneCache: false, clearRenderQueue: false });
      },
      () => {
        this.fire(MapEventType.ZOOM, this.getZoom());
      },
      {
        durationInSec: 0.25,
      },
    );

    return animation.run();
  }

  inBoundLimits(position?: Vector3, zoom?: number): boolean {
    return this.camera.inBoundLimits(position, zoom);
  }

  getProjectionViewMatrix() {
    return this.camera.getProjectionViewMatrix();
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.camera.resize(this.width, this.height);
    this.renderer.resize(this.width, this.height);
    this.rerender({ pruneCache: false, clearRenderQueue: true });
  }

  rerender(options: RenderOptions): Promise<void> {
    this.tilesGrid.updateTiles(this.camera);

    if (options.clearRenderQueue) {
      this.renderQueue.clear();
    }

    let pruneCache = options.pruneCache;
    return this.renderQueue.renderInNextAvailableFrame(() => {
      this.render(pruneCache);
      pruneCache = false;
      this.fire(MapEventType.RENDER);
    });
  }

  private render(pruneCache = false) {
    const start = performance.now();
    if (this.mapOptions.controls.debug) {
      this.stats.begin();
    }

    const tiles = this.tilesGrid.getCurrentViewTiles();

    this.renderer.render(
      tiles,
      // camera object
      {
        x: this.camera.getPositionX(),
        y: this.camera.getPositionY(),
        distance: this.camera.getDistance(),
        width: this.camera.getWidth(),
        height: this.camera.getHeight(),
        fieldOfView: this.camera.getFieldOfViewRadians(),
        zNear: 1,
        zFar: this.camera.getDistance(),
        xRotation: this.camera.getRotationX(),
        yRotation: this.camera.getRotationY(),
        zRotation: this.camera.getRotationZ(),
      },
      { pruneCache },
    );

    this.statsWidget.style.display = 'none';

    if (this.mapOptions.controls.debug) {
      this.statsWidget.style.display = 'block';

      this.frameStats = {
        elapsed: performance.now() - start,
      };
      this.stats.end();
    }
  }

  private getRenderer(rendererType: MapTileRendererType): MapTileRenderer {
    switch (rendererType) {
      case MapTileRendererType.webgl:
        return new WebGlMapTileRenderer(
          this.rootEl,
          this.featureFlags,
          MapTileRendererType.webgl,
          this.devicePixelRatio,
          this.fontManager,
          this.glyphsManager,
        );
      case MapTileRendererType.webgl2:
        return new WebGlMapTileRenderer(
          this.rootEl,
          this.featureFlags,
          MapTileRendererType.webgl2,
          this.devicePixelRatio,
          this.fontManager,
          this.glyphsManager,
        );
      default:
        throw new Error(`Rendrer "rendererType" is not supported.`);
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

    if (this.mapOptions.controls.stylesSelect) {
      const selectStylesConfig = new StyleSelectControl(this, window.document, this.mapOptions.controls.stylesSelect);
      parentControl.addControl(selectStylesConfig);
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

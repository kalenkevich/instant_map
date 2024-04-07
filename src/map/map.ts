import Stats from 'stats.js';
import { Evented } from './evented';
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
  center: [0, 0] as [number, number],
  zoom: 1,
  rotation: 0,
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
  center?: [number, number];
  /** Initial zoom value of the map. */
  zoom?: number;
  /** Initial rotation value of the map. */
  rotation?: number;
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

export class GlideMap extends Evented<MapEventType> {
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
  private pixelRatio: number;
  private width: number;
  private height: number;
  private minZoom: number;
  private maxZoom: number;
  private styles: DataTileStyles;

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
      this.mapOptions.center,
      this.mapOptions.zoom,
      this.mapOptions.rotation,
    );
    this.init().then(() => {
      this.rerender();
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
      window.addEventListener('resize', this.resizeEventListener);
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
  }

  setStyles(mapStyle: DataTileStyles) {
    this.destroy();
    this.setup(
      this.featureFlags,
      this.mapOptions,
      mapStyle,
      this.projection.fromXY(this.camera.getPosition()),
      this.camera.getZoom(),
      this.camera.getRotation(),
    );
    this.init().then(() => {
      this.rerender();
    });
  }

  getStyles(): DataTileStyles {
    return this.styles;
  }

  private setup(
    featureFlags: MapFeatureFlags,
    mapOptions: MapOptions,
    styles: DataTileStyles,
    center: [number, number],
    zoom: number,
    rotation: number,
  ) {
    this.minZoom = mapOptions.tileStyles.minzoom || 1;
    this.maxZoom = mapOptions.tileStyles.maxzoom || 15;
    this.pixelRatio = mapOptions.devicePixelRatio || window.devicePixelRatio;
    this.styles = styles;
    this.renderQueue = new RenderQueue();
    this.fontManager = new FontManager(featureFlags, styles.fonts || {});
    this.glyphsManager = new GlyphsManager(featureFlags, styles.glyphs || {});
    this.projection = getProjectionFromType(mapOptions.projection);
    this.camera = new MapCamera(
      featureFlags,
      this.projection.fromLngLat(center),
      zoom,
      rotation,
      this.width,
      this.height,
      styles.tileSize,
      this.projection,
    );
    this.tilesGrid = new TilesGrid(
      featureFlags,
      mapOptions.rendrer,
      styles,
      mapOptions.tileCacheSize || 256,
      mapOptions.tileBuffer || 1,
      mapOptions.workerPool || 8,
      styles.tileSize,
      this.pixelRatio,
      this.maxZoom,
      this.projection,
      this.fontManager,
      this.glyphsManager,
    );
    this.pan = new MapPan(this, this.rootEl);
    this.renderer = this.getRenderer(mapOptions.rendrer);
  }

  private onTileChanged = () => {
    this.rerender(true);
  };

  private onMapClick = (event: MapPanEvents, clickEvent: MouseEvent, clippedWebGlSpaceCoords: [number, number]) => {
    const tiles = this.tilesGrid.getCurrentViewTiles();
    const zoom = this.getZoom();
    const viewMatrix = this.camera.getProjectionMatrix();
    const objectId = this.renderer.getObjectId(
      tiles,
      {
        viewMatrix: viewMatrix as [number, number, number, number, number, number, number, number, number],
        distance: Math.pow(2, zoom) * this.styles.tileSize,
        width: this.width,
        height: this.height,
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
    return this.minZoom;
  }

  getMaxZoom(): number {
    return this.maxZoom;
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

  panBy(center: [number, number], rerender = true) {
    if (!rerender) {
      return;
    }

    return Promise.resolve();
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
      },
    );

    this.renderQueue.clear();
    return animation.run();
  }

  inBoundLimits(position?: [number, number], zoom?: number): boolean {
    return this.camera.inBoundLimits(position, zoom);
  }

  getProjectionMatrix() {
    return this.camera.getProjectionMatrix();
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.camera.resize(this.width, this.height);
    this.renderer.resize(this.width, this.height);
    this.render();
  }

  rerender(pruneCache = false): Promise<void> {
    this.tilesGrid.updateTiles(this.camera);

    this.renderQueue.clear();
    return this.renderQueue.render(() => {
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
    const zoom = this.getZoom();
    const viewMatrix = this.camera.getProjectionMatrix();

    this.renderer.render(
      tiles,
      {
        viewMatrix: viewMatrix as [number, number, number, number, number, number, number, number, number],
        distance: Math.pow(2, zoom) * this.styles.tileSize,
        width: this.width,
        height: this.height,
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
          this.pixelRatio,
          this.fontManager,
          this.glyphsManager,
        );
      case MapTileRendererType.webgl2:
        return new WebGlMapTileRenderer(
          this.rootEl,
          this.featureFlags,
          MapTileRendererType.webgl2,
          this.pixelRatio,
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

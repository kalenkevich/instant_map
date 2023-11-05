import { TilesGrid } from './tile/tiles_grid';
import { MapState } from './map_state';
import { MapOptions, MapRendererOptions, MapCrs, MapCrsType, MapMeta } from './types';
import { MapRenderer } from './render/renderer';
import { LatLng } from './geo/lat_lng';
import { LatLngBounds } from './geo/lat_lng_bounds';
import { Point } from './geometry/point';
import { Bounds } from './geometry/bounds';
import { EventHandler } from './events/event_handler';
import { ZoomEventHandler } from './events/zoom_event_handler';
import { CoordinateReferenceSystem } from './geo/crs/crs';
import { EarthCoordinateReferenceSystem } from './geo/crs/earth_crs';
import { EasyAnimation } from './animation/easy_animation';
import { DragEventHandler } from './events/drag_event_handler';
import { MapRendererType } from './render/renderer';
import { GlMapRenderer } from './render/webgl/gl_renderer';
import { Gl2MapRenderer } from './render/webgl_v2/webgl_v2_renderer';
import { PngMapRenderer } from './render/png/png_renderer';
import { MapTileFormatType } from './tile/tile';
import { MapControl } from './controls/map_control';
import { MapParentControl, MapControlPosition } from './controls/parent_control';
import { ZoomControl } from './controls/zoom_control';
import { CompassControl } from './controls/compass_control';
import { MoveControl } from './controls/move_control';
import { MapDebugControl } from './controls/map_debug_control';
import { DataTileStyles } from './styles/styles';
import { FontManager } from './font/font_manager';

export const DEFAULT_MAP_METADATA: MapMeta = {
  bounds: [-180, -85.0511, 180, 85.0511],
  center: [0, 0, 1],
  format: MapTileFormatType.pbf,
  maxzoom: 14,
  minzoom: 1,
  crs: MapCrsType.earth,
  tiles: [],
};

export interface MapPanOptions {
  duration?: number;
  easeLinearity?: number;
  noMoveStart?: boolean;
  animate?: boolean;
}

export enum MapEventType {
  ANY = '*',
  MOVE_START = 'map_movestart',
  MOVE = 'map_move',
  MOVE_END = 'map_moveend',
  DRAG_START = 'map_dragstart',
  DRAG = 'map_drag',
  DRAG_END = 'map_dragend',
  ZOOM = 'map_zoom',
  RESIZE = 'map_resize',
  RENDER = 'map_render',
  PREHEAT = 'map_tile_preheat',
}

export type EventListener = (eventType: MapEventType, ...eventArgs: any[]) => void;

/**
 * Visual Map class
 * Core of the map. Controls user events like mousemove, click, drag, wheel and converts it to the maps events like drag, zoom, move.
 * Based on center and zoom fetch tiles.
 *
 * TODO: should support combination of the webgl (development), webgl2, webgpu as render engine and vector, xml, json as a data source format.
 */
export class GlideMap {
  rootEl: HTMLElement;
  devicePixelRatio: number;
  state: MapState;
  minZoom?: number;
  maxZoom?: number;
  zoomSnap?: number;
  bounds?: LatLngBounds;

  mapMeta?: MapMeta;
  tileMetaUrl?: string;
  tileStyles: DataTileStyles;

  renderer: MapRenderer;
  tilesGrid: TilesGrid;
  eventHandlers: EventHandler[];
  crs: CoordinateReferenceSystem;
  fontManager: FontManager;

  private width: number;
  private height: number;
  private controls: MapControl[] = [];

  constructor(private readonly options: MapOptions) {
    this.rootEl = options.rootEl;
    this.width = this.rootEl.offsetWidth;
    this.height = this.rootEl.offsetHeight;
    this.devicePixelRatio = options.devicePixelRatio || window.devicePixelRatio || 1;
    this.state = {
      zoom: options.zoom || 0,
      center: options.center || new LatLng(0, 0),
      rotation: options.rotation || 0,
    };
    this.mapMeta = options.mapMeta;
    this.tileStyles = options.styles;
    this.tileMetaUrl = options.tileMetaUrl;
    this.renderer = getRenderer(this, options.renderer || MapRendererType.webgl);
    this.crs = getCrs(options.crs);
    this.eventHandlers = [new ZoomEventHandler(this), new DragEventHandler(this)];
    this.controls = this.getMapControls();

    this.resizeEventListener = this.resizeEventListener.bind(this);
    this.init();
  }

  private async init() {
    this.eventHandlers.forEach(eventHandler => eventHandler.subscribe());

    if (this.options.resizable) {
      window.addEventListener('resize', this.resizeEventListener);
    }

    if (this.tileMetaUrl) {
      const mapMeta = await this.fetchMapMeta();
      this.mapMeta = {
        ...(this.options.mapMeta || {}),
        ...mapMeta,
      };

      this.postInit();
    } else if (this.mapMeta) {
      this.postInit();
    } else {
      throw new Error('Map meta or/and map meta url should be provided.');
    }

    this.rootEl.style.position = 'relative';
    for (const control of this.controls) {
      control.init();
    }
  }

  private postInit() {
    this.bounds = getMapBounds(this.mapMeta);
    this.tilesGrid = new TilesGrid(this, {
      tileFormatType: this.mapMeta.format,
      devicePixelRatio: this.devicePixelRatio,
      tilesMeta: {
        tilestats: this.mapMeta.tilestats,
        pixel_scale: this.mapMeta.pixel_scale,
        tileset_type: this.mapMeta.tileset_type,
        tiles: this.mapMeta.tiles,
        vector_layers: this.mapMeta.vector_layers,
      },
      tileStyles: this.tileStyles,
    });
    this.fontManager = new FontManager();

    this.renderer.init();
    this.fontManager.init();
    this.tilesGrid.init(this.state);
    this.triggerRerender();

    this.once(MapEventType.RENDER, () => {
      for (const control of this.controls) {
        control.attach(this.rootEl);
      }

      this.fire(MapEventType.ZOOM);
      this.fire(MapEventType.MOVE);
    });
  }

  private getMapControls() {
    const parentControl = new MapParentControl(this, MapControlPosition.BOTTOM_RIGHT);

    if (this.options.controls?.debug !== false) {
      const debugControl = new MapDebugControl(this);
      parentControl.addControl(debugControl);
    }

    if (this.options.controls?.compas !== false) {
      const compassControl = new CompassControl(this);
      parentControl.addControl(compassControl);
    }

    if (this.options.controls?.move !== false) {
      const moveControl = new MoveControl(this);
      parentControl.addControl(moveControl);
    }

    if (this.options.controls?.zoom !== false) {
      const zoomControl = new ZoomControl(this);
      parentControl.addControl(zoomControl);
    }

    return [parentControl];
  }

  public destroy() {
    if (this.options.resizable) {
      window.removeEventListener('resize', this.resizeEventListener);
    }

    this.renderer.destroy();

    for (const eventHandler of this.eventHandlers) {
      eventHandler.destroy();
    }

    for (const control of this.controls) {
      control.destroy(this.rootEl);
    }

    this.eventListeners = [];
  }

  public resizeEventListener() {
    this.width = this.rootEl.offsetWidth;
    this.height = this.rootEl.offsetHeight;
    this.fire(MapEventType.RESIZE);
    this.triggerRerender();
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  public setWidth(width: number) {
    this.width = width;
    this.fire(MapEventType.RESIZE);
    this.triggerRerender();
  }

  public setHeight(height: number) {
    this.height = height;
    this.fire(MapEventType.RESIZE);
    this.triggerRerender();
  }

  public getFontManager(): FontManager {
    return this.fontManager;
  }

  public getTileStyles(): DataTileStyles | undefined {
    return this.tileStyles;
  }

  private async fetchMapMeta(): Promise<MapMeta | undefined> {
    try {
      return (await fetch(this.tileMetaUrl).then(data => data.json())) as MapMeta;
    } catch (e) {
      console.log(e);

      return undefined;
    }
  }

  public getContainer(): HTMLElement {
    return this.rootEl;
  }

  public getZoom() {
    return this.state.zoom;
  }

  public getMinZoom() {
    return this.mapMeta.minzoom;
  }

  public getMaxZoom() {
    return this.mapMeta.maxzoom;
  }

  public setZoom(zoom: number): Promise<void> {
    return this.setState({ zoom });
  }

  public getCenter(): LatLng {
    return this.state.center;
  }

  public setCenter(center: LatLng | Point): Promise<void> {
    if (center instanceof LatLng) {
      return this.setState({ center });
    }

    return this.setState({ center: this.getLatLngFromPoint(center) });
  }

  public zoomToPoint(newZoom: number, point: LatLng | Point): Promise<void> {
    const newCenter = point instanceof LatLng ? point : this.getLatLngFromPoint(point, newZoom);

    const currentZoom = this.state.zoom;
    const diff = newZoom - currentZoom;
    const animation = new EasyAnimation(
      this,
      (progress: number) => {
        return this.setZoom(currentZoom + diff * progress);
      },
      {
        durationInSec: 0.5,
      }
    );

    return animation.run();
  }

  public getPixelWorldBounds(zoom?: number, scaleFactor?: number): Bounds {
    return this.crs.getProjectedBounds(zoom ?? this.getZoom(), scaleFactor);
  }

  public getBounds(): LatLngBounds {
    return this.bounds;
  }

  public getOptions(): MapOptions {
    return this.options;
  }

  public downloadTiles() {
    return this.tilesGrid.downloadTiles();
  }

  limitZoom(zoom: number): number {
    const min = this.getMinZoom();
    const max = this.getMaxZoom();
    const snap = this.zoomSnap;

    if (snap) {
      zoom = Math.round(zoom / snap) * snap;
    }

    return Math.max(min, Math.min(max, zoom));
  }

  limitOffset(offset: Point, bounds: LatLngBounds) {
    if (!bounds) {
      return offset;
    }

    const viewBounds = this.getPixelBounds();
    const newBounds = new Bounds(viewBounds.min.add(offset), viewBounds.max.add(offset));

    return offset.add(this.getBoundsOffset(newBounds, bounds));
  }

  getPixelBounds() {
    const topLeftPoint = this.getTopLeftPoint();

    return new Bounds(topLeftPoint, topLeftPoint.add(this.getSize()));
  }

  getBoundsOffset(pxBounds: Bounds, maxBounds: LatLngBounds, zoom?: number) {
    const projectedMaxBounds = new Bounds(
      this.project(maxBounds.getNorthEast(), zoom),
      this.project(maxBounds.getSouthWest(), zoom)
    );
    const minOffset = projectedMaxBounds.min.subtract(pxBounds.min);
    const maxOffset = projectedMaxBounds.max.subtract(pxBounds.max);
    const dx = this.rebound(minOffset.x, -maxOffset.x);
    const dy = this.rebound(minOffset.y, -maxOffset.y);

    return new Point(dx, dy);
  }

  rebound(left: number, right: number): number {
    return left + right > 0
      ? Math.round(left - right) / 2
      : Math.max(0, Math.ceil(left)) - Math.max(0, Math.floor(right));
  }

  getTopLeftPoint() {
    const pixelOrigin = this.getPixelOrigin();

    return pixelOrigin.subtract(this.getMapPanePos());
  }

  getLatLngFromPoint(point: Point, zoom?: number): LatLng {
    const scale = this.getZoomScale(zoom || this.state.zoom);
    const viewHalf = this.getSize().divideBy(2);
    const containerPoint = point instanceof Point ? point : this.getPointFromLatLng(point);
    let centerOffset = containerPoint.subtract(viewHalf);
    if (scale !== 1) {
      centerOffset.multiplyBy(1 - 1 / scale);
    }

    return this.containerPointToLatLng(viewHalf.add(centerOffset));
  }

  getPointFromLatLng(latlng: LatLng): Point {
    const projectedPoint = this.project(latlng).round();

    return projectedPoint.subtract(this.getPixelOrigin());
  }

  project(latlng: LatLng, zoom?: number, scaleFactor?: number): Point {
    return this.crs.latLngToPoint(latlng, zoom || this.getZoom(), scaleFactor);
  }

  unproject(point: Point, zoom?: number, scaleFactor?: number): LatLng {
    return this.crs.pointToLatLng(point, zoom || this.state.zoom, scaleFactor);
  }

  getZoomScale(toZoom?: number, fromZoom?: number, scaleFactor?: number): number {
    fromZoom = fromZoom === undefined ? this.state.zoom : fromZoom;

    return this.crs.scale(toZoom, scaleFactor) / this.crs.scale(fromZoom, scaleFactor);
  }

  containerPointToLatLng(point: Point): LatLng {
    const layerPoint = this.containerPointToLayerPoint(point);

    return this.layerPointToLatLng(layerPoint);
  }

  wrapLatLngBounds(bounds: LatLngBounds): LatLngBounds {
    return this.crs.wrapLatLngBounds(bounds);
  }

  layerPointToLatLng(point: Point): LatLng {
    const projectedPoint = point.add(this.getPixelOrigin());

    return this.unproject(projectedPoint);
  }

  containerPointToLayerPoint(point: Point): Point {
    return point.subtract(this.getMapPanePos());
  }

  getPixelOrigin(): Point {
    const viewHalf = this.getSize().divideBy(2);

    return this.project(this.state.center, this.state.zoom).subtract(viewHalf).add(this.getMapPanePos()).round();
  }

  getMapPanePos(): Point {
    return new Point(0, 0);
  }

  getSize(): Point {
    return new Point(this.width, this.height);
  }

  panBy(offset: Point, options: MapPanOptions): Promise<void> {
    if (!offset.x && !offset.y) {
      this.fire(MapEventType.MOVE_END);
      return;
    }

    // If we pan too far, Chrome gets issues with tiles
    // and makes them disappear or appear in the wrong place (slightly offset)
    if (!options.animate || !this.getSize().contains(offset)) {
      const newLatLng = this.unproject(this.project(this.getCenter()).add(offset));

      return this.zoomToPoint(this.getZoom(), newLatLng);
    }

    const newPos = this.getMapPanePos().subtract(offset).round();
    const animation = new EasyAnimation(
      this,
      (progress: number) => {
        const nextPosition = newPos.add(offset.multiplyBy(progress));

        return this.setCenter(nextPosition);
      },
      {
        durationInSec: options.duration,
        easeLinearity: options.easeLinearity,
      }
    );

    return animation.run();
  }

  public setState(partialState: Partial<MapState>): Promise<void> {
    this.state = {
      ...this.state,
      ...partialState,
    };

    if (partialState.zoom) {
      this.fire(MapEventType.ZOOM);
    }

    if (partialState.center) {
      this.fire(MapEventType.MOVE);
    }

    return this.triggerRerender();
  }

  private async triggerRerender() {
    const state = { ...this.state };

    const tiles = await this.tilesGrid.update(state);
    this.renderer.stopRender();
    const renderStats = await this.renderer.renderTiles(tiles, this.tileStyles!, state);
    this.fire(MapEventType.RENDER, renderStats);
  }

  public stopRender(): void {
    return this.renderer.stopRender();
  }

  private eventListeners: Array<{ eventType: MapEventType; handler: EventListener; enabled: boolean }> = [];
  public on(eventType: MapEventType, handler: EventListener): void {
    this.eventListeners.push({
      eventType,
      handler,
      enabled: true,
    });
  }

  public once(eventType: MapEventType, handler: EventListener): void {
    const onceHandler: EventListener = (...eventArgs: any[]) => {
      this.off(eventType, onceHandler);

      handler(eventType, ...eventArgs);
    };

    this.eventListeners.push({
      eventType,
      handler: onceHandler,
      enabled: true,
    });
  }

  public off(eventType: MapEventType, handler: EventListener) {
    const index = this.eventListeners.findIndex(l => {
      return l.eventType === eventType && l.handler === handler;
    });

    if (index > -1) {
      this.eventListeners[index].enabled = false;
    }
  }

  private fire(eventType: MapEventType, ...eventArgs: any[]) {
    for (const listener of this.eventListeners) {
      if (!listener.enabled) {
        continue;
      }

      if (listener.eventType === eventType || listener.eventType === MapEventType.ANY) {
        listener.handler(eventType, ...eventArgs);
      }
    }
  }
}

export const getRenderer = (map: GlideMap, renderer: MapRendererType | MapRendererOptions): MapRenderer => {
  if ((renderer as MapRendererOptions).renderer) {
    return (renderer as MapRendererOptions).renderer;
  }

  const type = renderer as MapRendererType;

  if (type === MapRendererType.webgl) {
    return new GlMapRenderer(map, map.devicePixelRatio);
  }

  if (type === MapRendererType.webgl2) {
    return new Gl2MapRenderer(map, map.devicePixelRatio);
  }

  if (type === MapRendererType.png) {
    return new PngMapRenderer(map, map.devicePixelRatio);
  }

  throw new Error(`Renderer ${type} is not supported.`);
};

export const getCrs = (crs?: MapCrs): CoordinateReferenceSystem => {
  if (!crs || (crs as unknown as MapCrsType) === MapCrsType.earth) {
    return new EarthCoordinateReferenceSystem();
  }

  return crs as CoordinateReferenceSystem;
};

export const getMapBounds = (mapMeta: MapMeta): LatLngBounds => {
  const bounds = mapMeta.bounds || DEFAULT_MAP_METADATA.bounds;

  const minLatLgn = new LatLng(bounds[0], bounds[1]);
  const maxLanLng = new LatLng(bounds[2], bounds[3]);

  return new LatLngBounds(minLatLgn, maxLanLng);
};

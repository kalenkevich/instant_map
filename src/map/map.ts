import { WebGlPainter, GlProgram } from '../webgl';

import { MapTile } from './tile/tile';
import { TilesGrid } from './tile/tiles_grid';
import { MapState } from './map_state';
import { MapOptions, MapRendererType, MapRendererOptions, MapRenderer, MapCrs, MapCrsType, MapMeta, TilesetFormat } from './types';
import { LatLng } from './geo/lat_lng';
import { LatLngBounds } from './geo/lat_lng_bounds';
import { Point } from './geometry/point';
import { Bounds } from './geometry/bounds';
import { EventHandler } from './events/event_handler';
import { ZoomEventHandler } from './events/zoom_event_handler';
import { CoordinateReferenceSystem } from './geo/crs/crs';
import { EarthCoordinateReferenceSystem } from './geo/crs/earth_crs';
import {RenderQueue} from './render_queue/render_queue';
import {PositionAnimation} from './animation/position_animation';
import { DragEventHandler } from './events/drag_event_handler';

export const DEFAULT_MAP_METADATA: MapMeta = {
  bounds: [-180, -85.0511, 180, 85.0511],
  center: [0, 0, 1],
  format: TilesetFormat.pbf,
  maxzoom: 14,
  minzoom: 0,
  crs: MapCrsType.earth,
  tiles: [],
};

export interface MapPanOptions {
  duration: number;
  easeLinearity: number;
  noMoveStart?: boolean;
  animate?: boolean;
}

export enum MapEventType {
  MOVE_START = 'movestart',
  MOVE = 'move',
  MOVE_END = 'moveend',
  DRAG_START = 'dragstart',
  DRAG = 'drag',
  DRAG_END = 'dragend',
  ZOOM = 'zoom',
}

export interface EventListener {
  eventType: MapEventType;
  handler: (...eventArgs: any[]) => void;
}

/**
 * Visual Map class
 * Core of the map. Controls user events like mousemove, click, drag, wheel and converts it to the maps events like drag, zoom, move.
 * Based on center and zoom fetch tiles.
 *
 * TODO: should support combination of the webgl (development), webgl2, webgpu as render engine and vector, xml, json as a data source format.
 */
export class GlideMap {
  el: HTMLElement;
  devicePixelRatio: number;

  state: MapState;
  width: number;
  height: number;
  minZoom?: number;
  maxZoom?: number;
  zoomSnap?: number;
  bounds?: LatLngBounds;

  tilesMetaUrl: string;
  mapMeta: MapMeta;

  renderer: MapRenderer;
  tilesGrid: TilesGrid;
  eventHandlers: EventHandler[];
  crs: CoordinateReferenceSystem;

  animation: PositionAnimation;
  renderQueue: RenderQueue = new RenderQueue();

  constructor(private readonly options: MapOptions) {
    this.el = options.el;

    this.devicePixelRatio = options.devicePixelRatio || window.devicePixelRatio || 1;
    this.width = (this.el as HTMLCanvasElement).width;
    this.height = (this.el as HTMLCanvasElement).height;

    this.state = {
      zoom: options.zoom,
      center: options.center || new LatLng(0, 0),
    };
    this.tilesMetaUrl = options.tilesMetaUrl;
    this.renderer = getRenderer(options.renderer || MapRendererType.webgl, options.el as HTMLCanvasElement);
    this.mapMeta = DEFAULT_MAP_METADATA;
    this.crs = getCrs(options.crs);
    this.eventHandlers = [new ZoomEventHandler(this), new DragEventHandler(this)];

    this.init();
  }

  init() {
    this.eventHandlers.forEach(eventHandler => eventHandler.subscribe());

    this.fetchMapMeta().then(mapMeta => {
      this.mapMeta = {
        ...this.mapMeta,
        ...mapMeta,
      };

      this.bounds = getMapBounds(mapMeta);

      this.tilesGrid = new TilesGrid(this, {
        devicePixelRatio: this.devicePixelRatio,
        tilesMeta: {
          tilestats: this.mapMeta.tilestats,
          pixel_scale: this.mapMeta.pixel_scale,
          tileset_type: this.mapMeta.tileset_type,
          tiles: this.mapMeta.tiles,
        },
        mapWidth: this.width,
        mapHeight: this.height,
      });

      this.renderer.init();
      this.tilesGrid.init();
      this.tilesGrid.update(this.state).then(tiles => this.rerenderMap(tiles));
      this.fire(MapEventType.ZOOM);
      this.fire(MapEventType.MOVE);
    });
  }

  private async fetchMapMeta(): Promise<MapMeta | undefined> {
    try {
      return (await fetch(this.tilesMetaUrl).then(data => data.json())) as MapMeta;
    } catch (e) {
      console.log(e);

      return undefined;
    }
  }

  public getContainer(): HTMLElement {
    return this.el;
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

  public zoomToPoint(zoom: number, point: LatLng | Point): Promise<void> {
    const newCenter = point instanceof LatLng ? point : this.getLatLngFromPoint(point, zoom);

    return this.setState({ zoom, center: newCenter });
  }

  public getPixelWorldBounds(zoom?: number): Bounds {
    return this.crs.getProjectedBounds(zoom ?? this.getZoom());
  }

  public getBounds(): LatLngBounds {
    return this.bounds;
  }

  public getOptions(): MapOptions {
    return this.options;
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
        this.project(maxBounds.getSouthWest(), zoom),
    );
    const minOffset = projectedMaxBounds.min.subtract(pxBounds.min);
    const maxOffset = projectedMaxBounds.max.subtract(pxBounds.max);
    const dx = this.rebound(minOffset.x, -maxOffset.x);
    const dy = this.rebound(minOffset.y, -maxOffset.y);

		return new Point(dx, dy);
	}

  rebound(left: number, right: number): number {
		return left + right > 0 ?
			Math.round(left - right) / 2 :
			Math.max(0, Math.ceil(left)) - Math.max(0, Math.floor(right));
	}

  getTopLeftPoint() {
		const pixelOrigin = this.getPixelOrigin();

		return pixelOrigin.subtract(this.getMapPanePos());
	}

  getLatLngFromPoint(point: Point, zoom?: number): LatLng {
    const scale = this.getZoomScale(zoom || this.state.zoom);
    const viewHalf = this.getSize().divideBy(2);
    const containerPoint = point instanceof Point ? point : this.getPointFromLatLng(point);
    const centerOffset = containerPoint.subtract(viewHalf).multiplyBy(1 - 1 / scale);

    return this.containerPointToLatLng(viewHalf.add(centerOffset));
  }

  getPointFromLatLng(latlng: LatLng): Point {
    const projectedPoint = this.project(latlng).round();

    return projectedPoint.subtract(this.getPixelOrigin());
  }

  project(latlng: LatLng, zoom?: number): Point {
    return this.crs.latLngToPoint(latlng, zoom || this.getZoom());
  }

  unproject(point: Point, zoom?: number): LatLng {
    return this.crs.pointToLatLng(point, zoom || this.state.zoom);
  }

  getZoomScale(toZoom?: number, fromZoom?: number): number {
    fromZoom = fromZoom === undefined ? this.state.zoom : fromZoom;

    return this.crs.scale(toZoom) / this.crs.scale(fromZoom);
  }

  containerPointToLatLng(point: Point) {
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

      return this.renderQueue.next();
		}

		// If we pan too far, Chrome gets issues with tiles
		// and makes them disappear or appear in the wrong place (slightly offset)
		if (!options.animate || !this.getSize().contains(offset)) {
      const newLatLng = this.unproject(this.project(this.getCenter()).add(offset));

      return this.zoomToPoint(this.getZoom(), newLatLng);
		}

    const newPos = this.getMapPanePos().subtract(offset).round();
    const animation = new PositionAnimation(this, newPos, offset, {
      durationInSec: options.duration,
      easeLinearity: options.easeLinearity,
    });

    return animation.run();
  }

  private setState(partialState: Partial<MapState>): Promise<void> {
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

    return this.tilesGrid.update(this.state).then(tiles => this.rerenderMap(tiles));
  }

  stopRender(): Promise<void> {
    return this.renderQueue.clear();
  }

  private rerenderMap(tiles: MapTile[]): Promise<void> {
    this.renderQueue.push(() => {
      const glPrograms = tiles.flatMap(tile => tile.getRenderPrograms());

      console.time('map_render');
      this.renderer.setPrograms(glPrograms);
      this.renderer.draw();
      console.timeEnd('map_render');
    });

    return this.renderQueue.next();
  }

  private eventListeners: EventListener[] = [];
  addEventListener(listener: EventListener): void {
    this.eventListeners.push(listener);
  }

  removeEventListener(listener: EventListener) {
    const index = this.eventListeners.findIndex(l => {
      return l.eventType === listener.eventType && l.handler === listener.handler;
    });

    if (index > -1) {
      this.eventListeners.splice(index);
    }
  }

  fire(eventType: MapEventType, ...eventArgs: any[]) {
    for (const listener of this.eventListeners) {
      if (listener.eventType === eventType) {
        listener.handler(...eventArgs);
      }
    }
  }
}

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

export const getCrs = (crs?: MapCrs): CoordinateReferenceSystem => {
  if (!crs || (crs as unknown as MapCrsType) === MapCrsType.earth) {
    return new EarthCoordinateReferenceSystem();
  }

  return crs as CoordinateReferenceSystem;
};

export const getMapBounds = (mapMeta: MapMeta): LatLngBounds => {
  const minLatLgn = new LatLng(mapMeta.bounds[0], mapMeta.bounds[1]);
  const maxLanLng = new LatLng(mapMeta.bounds[2], mapMeta.bounds[3]);

  return new LatLngBounds(minLatLgn, maxLanLng);
};

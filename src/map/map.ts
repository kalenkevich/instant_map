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

export const DEFAULT_MAP_METADATA: MapMeta = {
  bounds: [-180, -85.0511, 180, 85.0511],
  center: [0, 0, 1],
  format: TilesetFormat.pbf,
  maxzoom: 14,
  minzoom: 0,
  crs: MapCrsType.earth,
  tiles: [],
};

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

  constructor(options: MapOptions) {
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
    this.eventHandlers = [new ZoomEventHandler(this)];

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

  public setZoom(zoom: number) {
    this.setState({ zoom });
  }

  public getCenter(): LatLng {
    return this.state.center;
  }

  public setCenter(center: LatLng | Point) {
    if (center instanceof LatLng) {
      this.setState({ center });

      return;
    }

    this.setState({ center: this.getLatLngFromPoint(center) });
  }

  public zoomToPoint(zoom: number, point: LatLng | Point) {
    const newCenter = point instanceof LatLng ? point : this.getLatLngFromPoint(point, zoom);

    this.setState({ zoom, center: newCenter });
  }

  public getPixelWorldBounds(zoom?: number): Bounds {
    return this.crs.getProjectedBounds(zoom ?? this.getZoom());
  }

  public getBounds(): LatLngBounds {
    return this.bounds;
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
    return this.crs.latLngToPoint(latlng, zoom);
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

  getMapPanePos() {
    return new Point(0, 0);
  }

  getSize(): Point {
    return new Point(this.width, this.height);
  }

  private setState(partinalState: Partial<MapState>) {
    this.state = {
      ...this.state,
      ...partinalState,
    };

    // console.log(this.state);

    this.tilesGrid.update(this.state).then(tiles => this.rerenderMap(tiles));
  }

  renderedTiles: MapTile[] = [];
  rerenderMap(tilesToRender: MapTile[]) {
    if (!tilesToRender || !tilesToRender.length) {
      return;
    }

    const renderScene = (tiles: MapTile[]) => {
      if (this.isAlreadyRendered(this.renderedTiles, tiles)) {
        return;
      }

      const glPrograms = tiles.flatMap(tile => tile.getRenderPrograms());

      console.time('map_render');
      this.renderer.setPrograms(glPrograms);
      this.renderer.draw();
      console.timeEnd('map_render');

      this.renderedTiles = tiles;
    };

    requestAnimationFrame(() => {
      renderScene(tilesToRender);
    });
  }

  private isAlreadyRendered(renderedTiles: MapTile[], tilesToRender: MapTile[]): boolean {
    const renderedKeys = renderedTiles
      .map(t => t.id)
      .sort()
      .join('');
    const tilesKeys = tilesToRender
      .map(t => t.id)
      .sort()
      .join('');

    return renderedKeys === tilesKeys;
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

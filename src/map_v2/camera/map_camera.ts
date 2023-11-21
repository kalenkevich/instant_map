import { Point } from '../geometry/point';
import { toPoint } from '../geometry/point_utils';
import { Bounds } from '../geometry/bounds';
import { Projection } from '../geo/projection/projection';
import { LngLatBounds } from '../geo/lng_lat_bounds';

export interface MapCameraOptions {
  tileSize: number;
  minZoom?: number;
  maxZoom?: number;
  bboxLimit?: [number, number, number, number];
}

export class MapCamera {
  private position: Point;
  private zoom: number;

  private width: number;
  private height: number;

  private readonly projection: Projection;
  private readonly tileSize: number;
  private readonly minZoom: number;
  private readonly maxZoom: number;
  private readonly bboxLimit: [number, number, number, number];

  constructor(
    position: Point,
    zoom: number,
    width: number,
    height: number,
    projection: Projection,
    options: MapCameraOptions
  ) {
    this.position = position;
    this.zoom = zoom;
    this.width = width;
    this.height = height;
    this.projection = projection;
    this.tileSize = options.tileSize;
    this.minZoom = options.minZoom || 0;
    this.maxZoom = options.maxZoom || 15;
    this.bboxLimit = options.bboxLimit || [-180, -85.05, 180, 85.05];
  }

  getPosition(): Point {
    return toPoint(this.position);
  }

  /**
   * Updates camera center position.
   * @param position Camera center position
   */
  setPosition(position: Point) {
    this.position = position;
  }

  setZoom(zoom: number) {
    this.zoom = zoom;
  }

  getZoom(): number {
    return this.zoom;
  }

  getBounds(position?: Point, zoom?: number): Bounds {
    position = position || this.position;
    zoom = zoom || this.zoom;
    const zoomScale = Math.pow(2, zoom);

    const px = this.position.x;
    const py = this.position.y;

    // get world coord in px
    const wx = px * this.tileSize;
    const wy = py * this.tileSize;

    // get zoom px
    const zx = wx * zoomScale;
    const zy = wy * zoomScale;

    // get bottom-left and top-right pixels
    let x1 = zx - this.width / 2;
    let y1 = zy + this.height / 2;
    let x2 = zx + this.width / 2;
    let y2 = zy - this.height / 2;

    // convert to world coords
    x1 = x1 / zoomScale / this.tileSize;
    y1 = y1 / zoomScale / this.tileSize;
    x2 = x2 / zoomScale / this.tileSize;
    y2 = y2 / zoomScale / this.tileSize;

    return new Bounds(new Point(x1, y1), new Point(x2, y2));
  }

  getLatLngBounds(position?: Point, zoom?: number): LngLatBounds {
    const bounds = this.getBounds(position, zoom);

    return new LngLatBounds(this.projection.project(bounds.a), this.projection.project(bounds.d));
  }

  inBoundsLimit(position: Point, zoom: number): boolean {
    if (!this.inZoomLimit(zoom)) {
      return false;
    }

    const bbox = this.getLatLngBounds(position, zoom);

    return (
      bbox[0] <= this.bboxLimit[0] ||
      bbox[1] <= this.bboxLimit[1] ||
      bbox[2] >= this.bboxLimit[2] ||
      bbox[3] >= this.bboxLimit[3]
    );
  }

  inZoomLimit(zoom: number): boolean {
    if (zoom < this.minZoom) {
      return false;
    }

    if (zoom > this.maxZoom) {
      return false;
    }

    return true;
  }
}

import { mat3 } from 'gl-matrix';
import { Projection } from '../geo/projection/projection';
import { MapFeatureFlags } from '../flags';

export class MapCamera {
  private x: number;
  private y: number;
  private viewProjectionMat: mat3;

  constructor(
    private readonly featureFlags: MapFeatureFlags,
    [x, y]: [number, number],
    private zoom: number,
    private rotationInDegree: number,
    private width: number,
    private height: number,
    private tileSize: number,
    private projection: Projection,
  ) {
    this.x = x;
    this.y = y;

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

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.updateProjectionMatrix();
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
    const px = (1 + x) / 2;
    const py = (1 - y) / 2;

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

    // get LngLat bounding box
    const bbox = [
      this.projection.lngFromMercatorX(x1),
      this.projection.latFromMercatorY(y1),
      this.projection.lngFromMercatorX(x2),
      this.projection.latFromMercatorY(y2),
    ];

    return bbox;
  }

  private updateProjectionMatrix() {
    // update camera matrix
    const zoomScale = Math.pow(2, this.zoom);

    const cameraMat = mat3.create();
    mat3.translate(cameraMat, cameraMat, [this.x, this.y]);
    mat3.scale(cameraMat, cameraMat, [
      this.width / (this.tileSize * zoomScale),
      this.height / (this.tileSize * zoomScale),
    ]);
    mat3.rotate(cameraMat, cameraMat, (Math.PI / 180) * this.rotationInDegree);

    // update view projection matrix
    const mat = mat3.create();
    const viewMat = mat3.invert(mat3.create(), cameraMat);
    const viewProjectionMat = mat3.multiply(mat, mat, viewMat);
    this.viewProjectionMat = viewProjectionMat;
  }
}

import { Projection } from '../geo/projection/projection';
import { MapFeatureFlags } from '../flags';
import {
  Vector3,
  Matrix3,
  createMatrix3,
  translateMatrix3,
  scaleMatrix3,
  rotateMatrix3,
  invertMatrix3,
  multiplyMatrix3,
  Matrix4,
  createMatrix4,
  rotateXMatrix4,
  rotateYMatrix4,
  rotateZMatrix4,
  invertMatrix4,
  multiplyMatrix4,
  perspectiveMatrix4,
} from '../math/matrix_utils';

function degToRad(d: number): number {
  return (d * Math.PI) / 180;
}

export class MapCamera {
  private x: number;
  private y: number;
  private z: number;
  private rotationX: number;
  private rotationY: number;
  private rotationZ: number;

  constructor(
    private readonly featureFlags: MapFeatureFlags,
    position: Vector3,
    rotation: [number, number, number], // [camera rotationX, camera rotationY, camera rotationZ] - all values in radians
    private zoom: number,
    private width: number,
    private height: number,
    private tileSize: number,
    private projection: Projection,
  ) {
    this.setPosition(position, zoom);
    this.setRotation(rotation);
  }

  public getPosition(): Vector3 {
    return [this.x, this.y, this.z];
  }

  public getPositionX(): number {
    return this.x;
  }

  public getPositionY(): number {
    return this.y;
  }

  public getPositionZ(): number {
    return this.z;
  }

  public setPosition([x, y, z]: Vector3, zoom?: number) {
    this.x = x;
    this.y = y;
    this.z = z;

    if (zoom !== undefined) {
      this.zoom = zoom;
    }
  }

  public getZoom(): number {
    return this.zoom;
  }

  public setZoom(zoom: number) {
    this.zoom = zoom;
  }

  public setRotation(rotation: Vector3) {
    this.rotationX = rotation[0];
    this.rotationY = rotation[1];
    this.rotationZ = rotation[2];
  }

  public getRotation(): Vector3 {
    return [this.rotationX, this.rotationY, this.rotationZ];
  }

  public getRotationX(): number {
    return this.rotationX;
  }

  public setRotationX(rX: number) {
    this.rotationX = rX;
  }

  public getRotationY(): number {
    return this.rotationY;
  }

  public setRotationY(rY: number) {
    this.rotationY = rY;
  }

  public getRotationZ(): number {
    return this.rotationZ;
  }

  public setRotationZ(rZ: number) {
    this.rotationZ = rZ;
  }

  public getViewModelMatrix(): Matrix3 {
    const zoomScale = Math.pow(2, this.zoom);

    // model matrix
    const cameraMat = createMatrix3();
    translateMatrix3(cameraMat, [this.x, this.y]);
    scaleMatrix3(cameraMat, [this.width / (this.tileSize * zoomScale), this.height / (this.tileSize * zoomScale)]);
    rotateMatrix3(cameraMat, this.rotationY);

    // view matrix
    const viewModelMat = multiplyMatrix3(createMatrix3(), invertMatrix3(cameraMat));

    return viewModelMat;
  }

  public getProjectionViewMatrix(): Matrix4 {
    // Compute the projection matrix
    const aspect = this.width / this.height;
    const zNear = 1;
    const zFar = this.getDistance();
    const projectionMatrix = perspectiveMatrix4(this.getFieldOfViewRadians(), aspect, zNear, zFar);

    // Compute a matrix for the camera
    const cameraMatrix = createMatrix4();
    rotateXMatrix4(cameraMatrix, this.rotationX);
    rotateYMatrix4(cameraMatrix, this.rotationY);
    rotateZMatrix4(cameraMatrix, this.rotationZ);

    // Make a view matrix from the camera matrix
    const viewMatrix = invertMatrix4(cameraMatrix);

    // Compute a view projection matrix
    return multiplyMatrix4(projectionMatrix, viewMatrix);
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  public getDistance(): number {
    return Math.pow(2, this.zoom) * this.tileSize;
  }

  public getFieldOfViewRadians(): number {
    return degToRad(60);
  }

  public inBoundLimits(position?: Vector3, zoom?: number): boolean {
    const bbox = this.getBounds(position || [this.x, this.y, this.z], zoom || this.zoom);

    return !(bbox[0] <= -180 || bbox[1] <= -85.05 || bbox[2] >= 180 || bbox[3] >= 85.05);
  }

  public getCurrentBounds() {
    return this.getBounds([this.x, this.y, this.z], this.zoom);
  }

  public getBounds([x, y]: Vector3, zoom: number) {
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
    let x1 = zx - this.width;
    let y1 = zy + this.height;
    let x2 = zx + this.width;
    let y2 = zy - this.height;

    // convert to world coords
    x1 = x1 / zoomScale / this.tileSize;
    y1 = y1 / zoomScale / this.tileSize;
    x2 = x2 / zoomScale / this.tileSize;
    y2 = y2 / zoomScale / this.tileSize;

    // get LngLat bounding box
    const bbox = [
      this.projection.unprojectX(x1, { normalized: true, clipped: false }),
      this.projection.unprojectY(y1, { normalized: true, clipped: false }),
      this.projection.unprojectX(x2, { normalized: true, clipped: false }),
      this.projection.unprojectY(y2, { normalized: true, clipped: false }),
    ];

    return bbox;
  }
}

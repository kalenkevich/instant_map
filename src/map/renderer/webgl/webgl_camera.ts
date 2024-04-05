import { mat3 } from 'gl-matrix';
import { SceneCamera } from '../renderer';

export class WebGlSceneCamera implements SceneCamera {
  private _viewMatrix: mat3;

  constructor(
    private sceneWidth: number,
    private sceneHeight: number,
    private eyeX: number,
    private eyeY: number,
    private _distance: number,
    private rotationInDegree: number,
  ) {
    this.recalculateViewMatrix();
  }
  get width(): number {
    return this.sceneWidth;
  }

  get height(): number {
    return this.sceneHeight;
  }

  get distance(): number {
    return this._distance;
  }

  get viewMatrix(): [number, number, number, number, number, number, number, number, number] {
    return [...this._viewMatrix] as [number, number, number, number, number, number, number, number, number];
  }

  setEye(eyeX: number, eyeY: number) {
    this.eyeX = eyeX;
    this.eyeY = eyeY;

    this.recalculateViewMatrix();
  }

  setRotation(rotationInDegree: number) {
    this.rotationInDegree = rotationInDegree;

    this.recalculateViewMatrix();
  }

  private recalculateViewMatrix() {
    this._viewMatrix = getProjectionMatrix(
      this.sceneWidth,
      this.sceneHeight,
      this._distance,
      this.eyeX,
      this.eyeY,
      this.rotationInDegree,
    );
  }
}

function getProjectionMatrix(
  sceneWidth: number,
  sceneHeight: number,
  distance: number,
  eyeX: number,
  eyeY: number,
  rotationInDegree: number,
): mat3 {
  // update camera matrix
  const cameraMat = mat3.create();
  mat3.translate(cameraMat, cameraMat, [eyeX, eyeY]);
  mat3.scale(cameraMat, cameraMat, [sceneWidth / distance, sceneHeight / distance]);
  mat3.rotate(cameraMat, cameraMat, (Math.PI / 180) * rotationInDegree);

  // update view projection matrix
  const mat = mat3.create();
  const viewMat = mat3.invert(mat3.create(), cameraMat);
  const viewProjectionMat = mat3.multiply(mat, mat, viewMat);

  return viewProjectionMat;
}

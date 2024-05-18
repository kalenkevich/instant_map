import { mat3 } from 'gl-matrix';
import { SceneCamera } from '../../renderer';

export function getProjectionViewMatrix(
  camera: SceneCamera,
): [number, number, number, number, number, number, number, number, number] {
  const cameraMat = mat3.create();

  mat3.translate(cameraMat, cameraMat, [camera.x, camera.y]);
  mat3.scale(cameraMat, cameraMat, [camera.width / camera.distance, camera.height / camera.distance]);
  mat3.rotate(cameraMat, cameraMat, (Math.PI / 180) * camera.rotationInDegree);

  // update view projection matrix
  const mat = mat3.create();
  const viewMat = mat3.invert(mat3.create(), cameraMat);
  const viewProjectionMat = mat3.multiply(mat, mat, viewMat);

  return [...viewProjectionMat] as [number, number, number, number, number, number, number, number, number];
}

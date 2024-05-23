import { SceneCamera } from '../../renderer';
import {
  Matrix3,
  createMatrix3,
  translateMatrix3,
  scaleMatrix3,
  rotateMatrix3,
  invertMatrix3,
  multiplyMatrix3,
} from '../../../math/matrix_utils';

export function getProjectionViewMatrix(camera: SceneCamera): Matrix3 {
  const cameraMat = createMatrix3();
  translateMatrix3(cameraMat, [camera.x, camera.y]);
  scaleMatrix3(cameraMat, [camera.width / camera.distance, camera.height / camera.distance]);
  rotateMatrix3(cameraMat, (Math.PI / 180) * camera.rotationInDegree);

  // update view projection matrix
  const viewMat = invertMatrix3(cameraMat);
  const viewProjectionMat = multiplyMatrix3(createMatrix3(), viewMat);

  return viewProjectionMat;
}

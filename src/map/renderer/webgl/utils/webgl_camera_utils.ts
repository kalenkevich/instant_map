import { SceneCamera } from '../../renderer';
import {
  Matrix3,
  createMatrix3,
  translateMatrix3,
  scaleMatrix3,
  rotateMatrix3,
  invertMatrix3,
  multiplyMatrix3,
  Matrix4,
  createMatrix4,
  perspectiveMatrix4,
  invertMatrix4,
  multiplyMatrix4,
  rotateXMatrix4,
  rotateYMatrix4,
  rotateZMatrix4,
} from '../../../math/matrix_utils';

function degToRad(d: number): number {
  return (d * Math.PI) / 180;
}

export function getProjectionViewMatrix3(camera: SceneCamera): Matrix3 {
  // camera matrix
  const modelMat = createMatrix3();
  translateMatrix3(modelMat, [camera.x, camera.y]);
  scaleMatrix3(modelMat, [camera.width / camera.distance, camera.height / camera.distance]);
  rotateMatrix3(modelMat, (Math.PI / 180) * 0);

  // projection view matrix
  return multiplyMatrix3(createMatrix3(), invertMatrix3(modelMat));
}

export function getProjectionViewMatrix4(camera: SceneCamera): Matrix4 {
  // const cameraAngleRadians = degToRad(0);
  const fieldOfViewRadians = degToRad(60);

  // Compute the projection matrix
  const aspect = camera.width / camera.height;
  const projectionMatrix = perspectiveMatrix4(fieldOfViewRadians, aspect, camera.zNear, camera.zFar);

  // Compute a matrix for the camera
  const cameraMatrix = createMatrix4();

  if (camera.xRotation) {
    rotateXMatrix4(cameraMatrix, camera.xRotation);
  }
  if (camera.yRotation) {
    rotateYMatrix4(cameraMatrix, camera.yRotation);
  }
  if (camera.zRotation) {
    rotateZMatrix4(cameraMatrix, camera.yRotation);
  }

  // Make a view matrix from the camera matrix
  const viewMatrix = invertMatrix4(cameraMatrix);

  // Compute a view projection matrix
  return multiplyMatrix4(projectionMatrix, viewMatrix);
}

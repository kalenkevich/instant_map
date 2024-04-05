import { WebGlScene } from './webgl_scene';
import { createRootEl } from '../demo_utils';
import { ENABLED_FEATURE_FLAGS } from '../enabled_features';
import { MapFeatureType, LineJoinStyle, LineCapStyle, LineFillStyle } from '../../map/tile/feature';
import { WebGlSceneCamera } from '../../map/renderer/webgl/webgl_camera';

export async function renderWebglLineExample() {
  const rootEl = createRootEl(window.innerWidth, window.innerHeight, 10);
  document.body.appendChild(rootEl);

  const scene = new WebGlScene(rootEl, ENABLED_FEATURE_FLAGS);

  await scene.init();

  const width = scene.getWidth();
  const height = scene.getHeight();

  // horisontal line
  // scene.addObject({
  //   type: MapTileFeatureType.line,
  //   id: 1,
  //   color: [0, 0, 1, 1],
  //   vertecies: [
  //     [-width / 4, 0],
  //     [width / 4, 0],
  //   ],
  //   width: 20,
  //   borderWidth: 10,
  //   borderColor: [1, 0, 0, 1],
  //   fill: LineFillStyle.solid,
  //   join: LineJoinStyle.round,
  //   cap: LineCapStyle.round,
  // });

  // vertical line
  scene.addObject({
    type: MapFeatureType.line,
    id: 2,
    color: [1, 0, 0, 1],
    vertecies: [
      [0, -height / 4],
      [0, height / 4],
      [width / 2 - 20, height / 4],
      [width / 2 - 20, -height / 4],
      [0, -height / 4],
    ],
    width: 20,
    borderWidth: 10,
    borderColor: [0, 0, 0, 1],
    fill: LineFillStyle.solid,
    join: LineJoinStyle.round,
    cap: LineCapStyle.round,
  });

  scene.addObject({
    type: MapFeatureType.line,
    id: 2,
    color: [1, 0, 0, 1],
    vertecies: [
      [width / 4, height / 4],
      [-width / 4, -height / 4],
    ],
    width: 20,
    borderWidth: 10,
    borderColor: [0, 0, 0, 1],
    fill: LineFillStyle.solid,
    join: LineJoinStyle.round,
    cap: LineCapStyle.round,
  });

  // scene.addObject({
  //   type: MapTileFeatureType.line,
  //   id: 2,
  //   color: [1, 0, 0, 1],
  //   vertecies: [
  //     [width / 4, -height / 4],
  //     [-width / 4, height / 4],
  //   ],
  //   width: 20,
  //   borderWidth: 10,
  //   borderColor: [0, 0, 0, 1],
  //   fill: LineFillStyle.solid,
  //   join: LineJoinStyle.round,
  //   cap: LineCapStyle.round,
  // });

  const sceneCamera = new WebGlSceneCamera(width, height, 0, 0, 1, 0);

  scene.render(sceneCamera);
}

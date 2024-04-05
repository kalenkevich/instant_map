import { WebGlScene } from './webgl_scene';
import { createRootEl } from '../demo_utils';
import { ENABLED_FEATURE_FLAGS } from '../enabled_features';
import { MapFeatureType } from '../../map/tile/feature';
import { WebGlSceneCamera } from '../../map/renderer/webgl/webgl_camera';

export async function renderWebglPointExample() {
  const rootEl = createRootEl(window.innerWidth, window.innerHeight, 10);
  document.body.appendChild(rootEl);

  const scene = new WebGlScene(rootEl, ENABLED_FEATURE_FLAGS);

  await scene.init();

  const width = scene.getWidth();
  const height = scene.getHeight();

  scene.addObject({
    type: MapFeatureType.point,
    id: 1,
    color: [1.0, 0.0, 0.0, 1.0],
    center: [0, 0],
    radius: 10,
    components: 128,
    borderWidth: 2,
    borderColor: [0.0, 0.0, 0.0, 1.0],
  });

  const sceneCamera = new WebGlSceneCamera(width, height, 0, 0, 1, 0);

  scene.render(sceneCamera);
}

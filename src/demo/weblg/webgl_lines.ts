import { mat3 } from 'gl-matrix';
import { WebGlScene } from './webgl_scene';
import { createRootEl } from '../demo_utils';
import { MapFeatureFlags } from '../../map/flags';
import { FontFormatType } from '../../map/font/font_config';
import { MapTileFeatureType } from '../../map/tile/tile';
import { WebGlSceneCamera } from '../../map/renderer/webgl/webgl_camera';

const FEATURE_FLAGS: MapFeatureFlags = {
  debugLayer: false,
  webglRendererDebug: false,
  webglRendererUseShaderLines: true,
  webglRendererFontFormatType: FontFormatType.texture,
  enableObjectSelection: false,
};

export async function renderWebglLinesExamples() {
  const rootEl = createRootEl(window.innerWidth, window.innerHeight, 10);
  document.body.appendChild(rootEl);

  const scene = new WebGlScene(rootEl, FEATURE_FLAGS);

  await scene.init();

  scene.addObject({
    type: MapTileFeatureType.point,
    id: 1,
    color: [1.0, 0.0, 0.0, 1.0],
    center: [200, 200],
    radius: 10,
    components: 32,
    borderWidth: 2,
    borderColor: [0.0, 0.0, 0.0, 1.0],
  });

  const sceneCamera = new WebGlSceneCamera(scene.getWidth(), scene.getHeight(), 500, 0, 0, 0);

  scene.render(sceneCamera);
}

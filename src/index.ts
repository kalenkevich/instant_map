import { FeatureCollection } from "geojson";
import GEO_JSON_SAMPLE_V3 from './geojson/data/slonim-export-v3_geojson.json';
import {renderGeoJson} from './geojson/geojson_viewer';
import { renderObjectsDemo } from './demo';

function createCanvas() {
  const canvas = document.createElement('canvas');

  canvas.id = 'glide-gl';
  canvas.width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) * window.devicePixelRatio;
  canvas.height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) * window.devicePixelRatio;

  document.body.appendChild(canvas);

  return canvas;
}

const renderSceneV2 = (gl: WebGLRenderingContext) => {
  renderGeoJson(gl, GEO_JSON_SAMPLE_V3 as FeatureCollection);
};

window.addEventListener('load', () => {
  const canvas = createCanvas();
  const gl = canvas.getContext("webgl", {
    powerPreference: 'high-performance',
  });

  if (!gl) {
    console.log('No Webgl context');

    return;
  }

  // renderSceneV2(gl);
  renderObjectsDemo(gl);
});
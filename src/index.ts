import { FeatureCollection } from 'geojson';
import GEO_JSON_SAMPLE_V3 from './geojson/data/slonim-export-v3_geojson.json';
import { renderGeoJson } from './geojson/geojson_viewer';
import { renderObjectsDemo } from './demo';
import { GlideMap } from './map/map';

function createCanvas() {
  const canvas = document.createElement('canvas');

  canvas.id = 'glide-gl';
  canvas.width = 1024 * window.devicePixelRatio;
  canvas.height = 1024 * window.devicePixelRatio;

  document.body.appendChild(canvas);

  return canvas;
}

const renderSceneV2 = (gl: WebGLRenderingContext) => {
  renderGeoJson(gl, GEO_JSON_SAMPLE_V3 as FeatureCollection);
};

window.addEventListener('load', () => {
  const canvas = createCanvas();
  const map = new GlideMap({
    el: canvas,
    zoom: 0,
    tilesMetaUrl: 'https://api.maptiler.com/tiles/v3/tiles.json?key=MfT8xhKONCRR9Ut0IKkt',
  });

  // renderSceneV2(canvas);
  // renderObjectsDemo(canvas);
});

import { renderObjectsDemo } from './demo';
import { GlideMap } from './map/map';

function createCanvas() {
  const canvas = document.createElement('canvas');

  canvas.id = 'glide-gl';
  canvas.width = 1024 * window.devicePixelRatio;
  canvas.height = 1024 * window.devicePixelRatio;
  // canvas.width = 1024;
  // canvas.height = 1024;

  document.body.appendChild(canvas);

  return canvas;
}

window.addEventListener('load', () => {
  const canvas = createCanvas();
  const map = new GlideMap({
    el: canvas,
    zoom: 0,
    tilesMetaUrl: 'https://api.maptiler.com/tiles/v3/tiles.json?key=MfT8xhKONCRR9Ut0IKkt',
  });

  // renderObjectsDemo(canvas);
});

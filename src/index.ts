import { renderMap } from './demo/map_demo';
import { renderWebglPointExample } from './demo/webgl/webgl_point';
import { renderWebglLineExample } from './demo/webgl/webgl_line';
import { renderTexturePropertiesExample } from './demo/webgl/texture_properties';

const ROUTE_MAP: Record<string, () => void> = {
  '/': () => {
    renderMap();
  },
  '': () => {
    renderMap();
  },
  '/webgl/point': () => {
    renderWebglPointExample();
  },
  '/webgl/line': () => {
    renderWebglLineExample();
  },
  '/webgl/textureProperties': () => {
    renderTexturePropertiesExample();
  },
};

window.addEventListener('load', () => {
  const route = window.location.hash.split('?')[0].slice(1);

  ROUTE_MAP[route]();
});

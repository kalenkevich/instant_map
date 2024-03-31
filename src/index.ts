import { renderMap } from './demo/map_demo';
import { renderWebglLinesExamples } from './demo/weblg/webgl_lines';

const ROUTE_MAP: Record<string, () => void> = {
  '/': () => {
    renderMap();
  },
  '': () => {
    renderMap();
  },
  '/webgl/lines': () => {
    renderWebglLinesExamples();
  },
};

window.addEventListener('load', () => {
  const route = window.location.hash.split('?')[0].slice(1);

  ROUTE_MAP[route]();
});

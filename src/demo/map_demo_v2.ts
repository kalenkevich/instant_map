import { WebGLMap } from '../map_v2/map';

export function renderMap() {
  const rootDiv = document.createElement('div');
  rootDiv.id = 'WebGLMap';
  document.body.appendChild(rootDiv);

  const map = new WebGLMap({
    id: 'WebGLMap',
    tileServerURL: 'https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.pbf?key=MfT8xhKONCRR9Ut0IKkt',
    width: window.innerWidth,
    height: window.innerHeight,
    center: [-73.9834558, 40.6932723],
    minZoom: 4,
    maxZoom: 18,
    zoom: 13,
    debug: true,
    layers: {
      water: [180, 240, 250, 255],
      landcover: [202, 246, 193, 255],
      park: [202, 255, 193, 255],
      building: [185, 175, 139, 191],
      transportation: [233, 201, 43, 255],
    },
  });
}

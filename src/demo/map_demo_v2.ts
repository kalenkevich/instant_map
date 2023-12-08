import { throttle } from '../map/utils/trottle';
import { GlideV2Map, MapEventType } from '../map_v2/map';

const MAP_LOCATION_PARAM_NAME = 'l';

function createRootEl() {
  const margin = 20;
  const width = window.innerWidth - margin * 2 - 2;
  const height = window.innerHeight - margin * 2 - 2 - 50;

  const div = document.createElement('div');

  div.id = 'glide-gl';
  div.style.margin = `${margin}px`;
  div.style.width = `${width}px`;
  div.style.height = `${height}px`;
  div.style.position = `relative`;
  document.body.appendChild(div);

  window.addEventListener('resize', () => {
    const width = window.innerWidth - margin * 2 - 2;
    const height = window.innerHeight - margin * 2 - 2 - 50;

    div.style.width = `${width}px`;
    div.style.height = `${height}px`;
  });

  return div;
}

const getSafelocation = (zoom: number, lat: number, lng: number) => {
  return `${Number(zoom).toFixed(4)}/${Number(lat).toFixed(4)}/${Number(lng).toFixed(4)}`;
};

const parseFromSafeLocation = (safeLocation: string): [number, number, number] => {
  const location = decodeURIComponent(safeLocation);
  const [zoom, lng, lat] = location.split('/');

  return [parseFloat(zoom), parseFloat(lng), parseFloat(lat)];
};

function getStartMapLocation(): [number, number, number] {
  const query = new URLSearchParams(document.location.search);

  if (!query.has(MAP_LOCATION_PARAM_NAME)) {
    return [15.0, 25.3033, 53.0839];
  }

  return parseFromSafeLocation(query.get(MAP_LOCATION_PARAM_NAME));
}

const syncQueryParamsWithMapState = () => {
  const center = currentMap.getCenter();
  const zoom = currentMap.getZoom();

  const query = new URLSearchParams(document.location.search);
  const safeLocation = getSafelocation(zoom, center[0], center[1]);

  if (query.has(MAP_LOCATION_PARAM_NAME)) {
    query.delete(MAP_LOCATION_PARAM_NAME);
  }
  query.append(MAP_LOCATION_PARAM_NAME, safeLocation);

  history.replaceState(null, '', '?' + query.toString());
};

function subscribeOnEvents(map: GlideV2Map) {
  map.on(MapEventType.ANY, fireMapEvent);
  map.on(MapEventType.ZOOM, throttle(syncQueryParamsWithMapState, 250));
  map.on(MapEventType.CENTER, throttle(syncQueryParamsWithMapState, 250));
}

function fireMapEvent(eventType: MapEventType) {
  document.dispatchEvent(new Event(eventType));
}

let currentMap: GlideV2Map | undefined;

export function renderMap() {
  const rootDiv = createRootEl();
  document.body.appendChild(rootDiv);

  const [zoom, lat, lng] = getStartMapLocation();

  currentMap = new GlideV2Map({
    rootEl: rootDiv,
    tilesUrl: 'https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.pbf?key=MfT8xhKONCRR9Ut0IKkt',
    zoom,
    center: [lat, lng],
    minZoom: 1,
    maxZoom: 15,
    layers: {
      water: [95, 200, 255, 255],
      globallandcover: [173, 226, 167, 255],
      landcover: [173, 226, 167, 255],
      park: [202, 255, 193, 255],
      building: [222, 215, 211, 255],
      transportation: [233, 201, 43, 255],
      boundary: [120, 123, 140, 255],
      poi: [250, 185, 57, 255],
      place: [0, 0, 0, 255],
    },
    projection: 'mercator',
    controls: {
      compas: true,
      zoom: true,
      debug: true,
    },
  });

  subscribeOnEvents(currentMap);
  syncQueryParamsWithMapState();
}

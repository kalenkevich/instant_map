import { throttle } from '../map/utils/trottle';
import { GlideMap, MapEventType } from '../map/map';
import { MapTilerVectorTileStyles, MapboxVectorTileStyles } from './map_styles';

const MAP_LOCATION_PARAM_NAME = 'l';

function createRootEl() {
  const margin = 0;
  const width = window.innerWidth - margin * 2 - 2;
  const height = window.innerHeight - margin * 2 - 2;

  const div = document.createElement('div');

  div.id = 'glide-gl';
  div.style.margin = `${margin}px`;
  div.style.width = `${width}px`;
  div.style.height = `${height}px`;
  div.style.position = `relative`;
  div.style.overflow = 'hidden';
  document.body.appendChild(div);

  window.addEventListener('resize', () => {
    const width = window.innerWidth - margin * 2 - 2;
    const height = window.innerHeight - margin * 2 - 2;

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

function subscribeOnEvents(map: GlideMap) {
  map.on(MapEventType.ANY, fireMapEvent);
  map.on(MapEventType.ZOOM, throttle(syncQueryParamsWithMapState, 250));
  map.on(MapEventType.CENTER, throttle(syncQueryParamsWithMapState, 250));
}

function fireMapEvent(eventType: MapEventType) {
  document.dispatchEvent(new Event(eventType));
}

let currentMap: GlideMap | undefined;

export function renderMap() {
  const rootDiv = createRootEl();
  document.body.appendChild(rootDiv);

  const [zoom, lat, lng] = getStartMapLocation();

  currentMap = new GlideMap({
    rootEl: rootDiv,
    tilesUrl:
      'https://api.mapbox.com/v4/mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2,mapbox.mapbox-bathymetry-v2/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1Ijoia2FsZW5rZXZpY2giLCJhIjoiY2xuYXc2eXY0MDl3ZjJ3bzdjN2JwYTBocCJ9.UMtCm4-d9CQj8QbDouCkpA',
    tileStyles: MapboxVectorTileStyles,
    // tilesUrl: 'https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.pbf?key=MfT8xhKONCRR9Ut0IKkt',
    // tileStyles: MapTilerVectorTileStyles,
    zoom,
    center: [lat, lng],
    projection: 'mercator',
    controls: {
      compas: true,
      zoom: true,
      debug: true,
    },
    workerPool: 8,
    featureFlags: {
      debugLayer: true,
      webglRendererDebug: false,
    },
  });

  subscribeOnEvents(currentMap);
  syncQueryParamsWithMapState();
}

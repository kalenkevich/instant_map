import { throttle } from '../map/utils/trottle';
import { InstantMap, MapEventType } from '../map/map';
import {
  SateliteTilesStyles,
  MaptilerSateliteTilesStyles,
  MapboxVectorTileStyles,
  MapTilerVectorTileStyles,
  OsmImageTileStyles,
  BingImageTyleStyles,
} from './map_styles';
import { DataTileStyles } from '../map/styles/styles';
import { MapTileRendererType } from '../map/renderer/renderer';
import { createRootEl } from './demo_utils';
import { ENABLED_FEATURE_FLAGS } from './enabled_features';
import { ProjectionType } from '../map/geo/projection/projection';

const MAP_ROOT_EL_MARGIN = 10;

const MAP_LOCATION_PARAM_NAME = 'l';
const MAP_STYLES_PARAM_NAME = 's';

function getSafelocation(zoom: number, lat: number, lng: number) {
  return `${Number(zoom).toFixed(4)}/${Number(lat).toFixed(4)}/${Number(lng).toFixed(4)}`;
}

function parseFromSafeLocation(safeLocation: string): [number, number, number] {
  const location = decodeURIComponent(safeLocation);
  const [zoom, lng, lat] = location.split('/');

  return [parseFloat(zoom), parseFloat(lng), parseFloat(lat)];
}

function getStartMapLocation(): [number, number, number] {
  const query = new URLSearchParams(document.location.search);

  if (!query.has(MAP_LOCATION_PARAM_NAME)) {
    return [15.0, 53.0839, 25.3033]; // [zoom, lat, lng]
  }

  return parseFromSafeLocation(query.get(MAP_LOCATION_PARAM_NAME));
}

function setParam(name: string, value: string) {
  const query = new URLSearchParams(document.location.search);

  if (query.has(name)) {
    query.set(name, value);
  } else {
    query.append(name, value);
  }

  history.replaceState(null, '', '?' + query.toString());
}

function getParam(name: string): string | undefined {
  const query = new URLSearchParams(document.location.search);

  return query.get(name);
}

function syncQueryParamsWithMapState() {
  const center = currentMap.getCenter();
  const zoom = currentMap.getZoom();
  const safeLocation = getSafelocation(zoom, center[1], center[0]); // [zoom, lat, lng]

  setParam(MAP_LOCATION_PARAM_NAME, safeLocation);
}

function subscribeOnEvents(map: InstantMap) {
  map.on(MapEventType.ANY, fireMapEvent);
  map.on(MapEventType.ZOOM, throttle(syncQueryParamsWithMapState, 250));
  map.on(MapEventType.CENTER, throttle(syncQueryParamsWithMapState, 250));
}

function fireMapEvent(eventType: MapEventType) {
  document.dispatchEvent(new Event(eventType));
}

function selectStyles(styles: DataTileStyles) {
  setParam(MAP_STYLES_PARAM_NAME, styles.name);
}

const STYLES_SELECT_CONFIG = [
  {
    id: 'SateliteTilesStyles',
    name: 'Mapbox Image + Mapbox data',
    styles: SateliteTilesStyles,
    onSelect: selectStyles,
  },
  {
    id: 'MaptilerSateliteTilesStyles',
    name: 'Maptiler Image + Mapbox data',
    styles: MaptilerSateliteTilesStyles,
    onSelect: selectStyles,
  },
  {
    id: 'OsmImageTileStyles',
    name: 'Osm Image + Mapbox data',
    styles: OsmImageTileStyles,
    onSelect: selectStyles,
  },
  {
    id: 'BingImageTyleStyles',
    name: 'Bing Image + Mapbox data',
    styles: BingImageTyleStyles,
    onSelect: selectStyles,
  },
  {
    id: 'MapboxVectorTileStyles',
    name: 'Mapbox Vector',
    styles: MapboxVectorTileStyles,
    onSelect: selectStyles,
  },
  {
    id: 'MapTilerVectorTileStyles',
    name: 'MapTiler Vector',
    styles: MapTilerVectorTileStyles,
    onSelect: selectStyles,
  },
];

let currentMap: InstantMap | undefined;

export function renderMap() {
  const rootDiv = createRootEl(window.innerWidth, window.innerHeight, MAP_ROOT_EL_MARGIN);
  document.body.appendChild(rootDiv);
  const [zoom, lat, lng] = getStartMapLocation();
  const selectedStyleName = getParam(MAP_STYLES_PARAM_NAME) || MapboxVectorTileStyles.name;
  setParam(MAP_STYLES_PARAM_NAME, selectedStyleName); // set default in case it is not defined
  const selectedStyleConfig = STYLES_SELECT_CONFIG.find(config => config.styles.name === selectedStyleName);

  currentMap = new InstantMap({
    rootEl: rootDiv,
    zoom,
    center: [lng, lat],
    rendrer: MapTileRendererType.webgl2,
    projection: ProjectionType.Mercator,
    tileStyles: selectedStyleConfig.styles,
    tileBuffer: 1,
    tileCacheSize: 256,
    workerPool: 4,
    featureFlags: ENABLED_FEATURE_FLAGS,
    controls: {
      compas: true,
      zoom: true,
      debug: true,
      stylesSelect: STYLES_SELECT_CONFIG,
    },
  });

  window.addEventListener('resize', () => {
    const width = window.innerWidth - MAP_ROOT_EL_MARGIN;
    const height = window.innerHeight - MAP_ROOT_EL_MARGIN;

    rootDiv.style.width = `${width}px`;
    rootDiv.style.height = `${height}px`;

    currentMap.resize(width, height);
  });

  subscribeOnEvents(currentMap);
  syncQueryParamsWithMapState();
}

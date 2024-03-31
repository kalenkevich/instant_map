import { throttle } from '../map/utils/trottle';
import { GlideMap, MapEventType } from '../map/map';
import {
  SateliteTilesStyles,
  MaptilerSateliteTilesStyles,
  MapboxVectorTileStyles,
  MapTilerVectorTileStyles,
  OsmImageTileStyles,
  BingImageTyleStyles,
} from './map_styles';
import { MapTileRendererType } from '../map/renderer/renderer';
import { FontFormatType } from '../map/font/font_config';
import { createRootEl } from './demo_utils';

const MAP_ROOT_EL_MARGIN = 10;

const MAP_LOCATION_PARAM_NAME = 'l';

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
  const rootDiv = createRootEl(window.innerWidth, window.innerHeight, MAP_ROOT_EL_MARGIN);
  document.body.appendChild(rootDiv);

  const [zoom, lat, lng] = getStartMapLocation();

  currentMap = new GlideMap({
    rootEl: rootDiv,
    zoom,
    center: [lat, lng],
    rendrer: MapTileRendererType.webgl2,
    tileStyles: MapboxVectorTileStyles,
    projection: 'mercator',
    controls: {
      compas: true,
      zoom: true,
      debug: true,
      stylesSelect: [
        {
          id: 'SateliteTilesStyles',
          name: 'Mapbox Image + Mapbox data',
          styles: SateliteTilesStyles,
        },
        {
          id: 'MaptilerSateliteTilesStyles',
          name: 'Maptiler Image + Mapbox data',
          styles: MaptilerSateliteTilesStyles,
        },
        {
          id: 'OsmImageTileStyles',
          name: 'Osm Image + Mapbox data',
          styles: OsmImageTileStyles,
        },
        {
          id: 'BingImageTyleStyles',
          name: 'Bing Image + Mapbox data',
          styles: BingImageTyleStyles,
        },
        {
          id: 'MapboxVectorTileStyles',
          name: 'Mapbox Vector',
          styles: MapboxVectorTileStyles,
        },
        {
          id: 'MapTilerVectorTileStyles',
          name: 'MapTiler Vector',
          styles: MapTilerVectorTileStyles,
        },
      ],
    },
    workerPool: 8,
    featureFlags: {
      debugLayer: false,
      webglRendererDebug: false,
      webglRendererUseShaderLines: false,
      webglRendererFontFormatType: FontFormatType.texture,
      enableObjectSelection: false,
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

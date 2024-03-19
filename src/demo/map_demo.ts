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
    zoom,
    center: [lat, lng],
    rendrer: MapTileRendererType.webgl2,
    tileStyles: SateliteTilesStyles,
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
      debugLayer: true,
      webglRendererDebug: false,
      webglRendererFontFormatType: FontFormatType.texture,
      enableObjectSelection: false,
    },
  });

  subscribeOnEvents(currentMap);
  syncQueryParamsWithMapState();
}

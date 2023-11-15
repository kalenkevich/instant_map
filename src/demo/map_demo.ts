import { MapOptions } from '../map/types';
import { LatLng } from '../map/geo/lat_lng';
import { GlideMap, MapEventType, DEFAULT_MAP_METADATA } from '../map/map';
import { MapTileFormatType } from '../map/tile/tile';
import { MapRendererType } from '../map/render/renderer';
import { VectorStyles, ImageStyles } from './map_styles';

type ButtonOption = Partial<MapOptions & { name: string; id: string }>;

const ENV_PARAM_NAME = 'env';
const MAP_LOCATION_PARAM_NAME = 'l';
const SELECTED_MAP_VIEW_PARAM_MNAME = 'sm';

const isTestEnv = new URLSearchParams(document.location.search).get(ENV_PARAM_NAME) === 'test';
const OSM_TILE_URL = `${isTestEnv ? '/osm' : 'https://tile.openstreetmap.org'}/{z}/{x}/{y}.png`;
const MAPTILER_PNG_TILE_URL = `${
  isTestEnv ? '/maptiler/satellite' : 'https://api.maptiler.com/maps/satellite/256'
}/{z}/{x}/{y}@2x.jpg?key=MfT8xhKONCRR9Ut0IKkt`;
const MAPTILER_VT_META_URL = `${
  isTestEnv ? '/maptiler/tiles_meta.json' : 'https://api.maptiler.com/tiles/v3/tiles.json'
}?key=MfT8xhKONCRR9Ut0IKkt`;

export const ButtonMapOptions: ButtonOption[] = [
  {
    name: 'VT webgl maptiler',
    id: 'webgl_vt_maptiler',
    renderer: MapRendererType.webgl,
    resizable: true,
    tileMetaUrl: MAPTILER_VT_META_URL,
    styles: VectorStyles,
    controls: {
      debug: !isTestEnv,
    },
  },
  {
    name: 'VT webgl2 maptiler',
    id: 'webgl2_vt_maptiler',
    renderer: MapRendererType.webgl2,
    resizable: true,
    tileMetaUrl: MAPTILER_VT_META_URL,
    styles: VectorStyles,
    controls: {
      debug: !isTestEnv,
    },
  },
  {
    name: 'Png image osm',
    id: 'html_png_osm',
    renderer: MapRendererType.png,
    resizable: true,
    styles: ImageStyles,
    mapMeta: {
      ...DEFAULT_MAP_METADATA,
      maxzoom: 19,
      minzoom: 0,
      format: MapTileFormatType.png,
      tiles: [OSM_TILE_URL],
    },
    controls: {
      debug: !isTestEnv,
    },
  },
  {
    name: 'Png image maptiler',
    id: 'html_png_maptiler',
    renderer: MapRendererType.png,
    resizable: true,
    styles: ImageStyles,
    mapMeta: {
      ...DEFAULT_MAP_METADATA,
      maxzoom: 19,
      minzoom: 0,
      format: MapTileFormatType.png,
      tiles: [MAPTILER_PNG_TILE_URL],
    },
    controls: {
      debug: !isTestEnv,
    },
  },
  {
    name: 'Png webgl osm',
    id: 'webgl_png_osm',
    renderer: MapRendererType.webgl,
    resizable: true,
    styles: ImageStyles,
    mapMeta: {
      ...DEFAULT_MAP_METADATA,
      maxzoom: 19,
      minzoom: 0,
      format: MapTileFormatType.png,
      tiles: [OSM_TILE_URL],
    },
    controls: {
      debug: !isTestEnv,
    },
  },
  {
    name: 'Png webgl maptiler',
    id: 'webgl_png_maptiler',
    renderer: MapRendererType.webgl,
    resizable: true,
    styles: ImageStyles,
    mapMeta: {
      ...DEFAULT_MAP_METADATA,
      maxzoom: 19,
      minzoom: 0,
      format: MapTileFormatType.png,
      tiles: [MAPTILER_PNG_TILE_URL],
    },
    controls: {
      debug: !isTestEnv,
    },
  },
];

const Locations = [
  {
    name: 'Slonim',
    value: {
      zoom: 14.3218,
      lat: 53.0875,
      lng: 25.3183,
    },
  },
  {
    name: 'Irvine',
    value: {
      zoom: 13.48,
      lat: 33.64891,
      lng: -117.7426,
    },
  },
  {
    name: 'New York',
    value: {
      zoom: 12.74,
      lat: 40.72785,
      lng: -73.99336,
    },
  },
  {
    name: 'Paris',
    value: {
      zoom: 12.49,
      lat: 48.85091,
      lng: 2.34428,
    },
  },
  {
    name: 'London',
    value: {
      zoom: 12.83,
      lat: 51.51237,
      lng: -0.11359,
    },
  },
  {
    name: 'Tokio',
    value: {
      zoom: 13.04,
      lat: 35.69311,
      lng: 139.75535,
    },
  },
];

let currentMap: GlideMap | undefined;
let rootEl: HTMLElement | undefined;

function createRootEl() {
  const margin = 20;
  const width = window.innerWidth - margin * 2 - 2;
  const height = window.innerHeight - margin * 2 - 2 - 50;

  const div = document.createElement('div');

  div.id = 'glide-gl';
  div.style.border = '1px solid';
  div.style.margin = `${margin}px`;
  div.style.width = `${width}px`;
  div.style.height = `${height}px`;
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
  const [zoom, lat, lng] = location.split('/');

  return [parseFloat(zoom), parseFloat(lat), parseFloat(lng)];
};

function getStartMapLocation(): [number, number, number] {
  const query = new URLSearchParams(document.location.search);

  if (!query.has(MAP_LOCATION_PARAM_NAME)) {
    return [14.3218, 53.0875, 25.3183];
  }

  return parseFromSafeLocation(query.get(MAP_LOCATION_PARAM_NAME));
}

function getStartMapViewId(): string {
  const query = new URLSearchParams(document.location.search);

  if (!query.has(SELECTED_MAP_VIEW_PARAM_MNAME)) {
    return 'webgl_vt_maptiler';
  }

  return query.get(SELECTED_MAP_VIEW_PARAM_MNAME);
}

const syncQueryParamsWithMapState = () => {
  const center = currentMap.getCenter();
  const zoom = currentMap.getZoom();

  const query = new URLSearchParams(document.location.search);
  const safeLocation = getSafelocation(zoom, center.lat, center.lng);

  if (query.has(MAP_LOCATION_PARAM_NAME)) {
    query.delete(MAP_LOCATION_PARAM_NAME);
  }
  query.append(MAP_LOCATION_PARAM_NAME, safeLocation);

  history.replaceState(null, '', '?' + query.toString());
};

const syncQueryParamsWithSelectedMap = (selectdMapId: string) => {
  const query = new URLSearchParams(document.location.search);

  if (query.has(SELECTED_MAP_VIEW_PARAM_MNAME)) {
    query.delete(SELECTED_MAP_VIEW_PARAM_MNAME);
  }
  query.append(SELECTED_MAP_VIEW_PARAM_MNAME, selectdMapId);

  history.replaceState(null, '', '?' + query.toString());
};

function fireMapEvent(eventType: MapEventType) {
  document.dispatchEvent(new Event(eventType));
}

function subscribeOnEvents(map: GlideMap) {
  map.on(MapEventType.ANY, fireMapEvent);
  map.on(MapEventType.MOVE, syncQueryParamsWithMapState);
  map.on(MapEventType.ZOOM, syncQueryParamsWithMapState);
}

function unsubscribeFromEvents(map: GlideMap) {
  map.off(MapEventType.ANY, fireMapEvent);
  map.off(MapEventType.MOVE, syncQueryParamsWithMapState);
  map.off(MapEventType.ZOOM, syncQueryParamsWithMapState);
}

const createMapViewsSelect = () => {
  const select = document.createElement('select');

  select.style.margin = '20px 20px 0 20px';
  document.body.appendChild(select);

  return select;
};

const createMapLocationsSelect = () => {
  const select = document.createElement('select');

  for (const location of Locations) {
    const option = document.createElement('option');
    option.id = location.name;
    option.innerText = location.name;
    option.value = getSafelocation(location.value.zoom, location.value.lat, location.value.lng);

    select.appendChild(option);
  }

  select.addEventListener('change', e => {
    // @ts-ignore
    const value: string = e.target.value;
    const [zoom, lat, lng] = parseFromSafeLocation(value);

    currentMap.setState({
      zoom,
      center: new LatLng(lat, lng),
    });
  });

  select.style.margin = '20px 20px 0 20px';
  document.body.appendChild(select);

  return select;
};

const createDownloadTilesButton = () => {
  const button = document.createElement('button');

  button.style.margin = '20px 20px 0 20px';
  button.innerText = 'Download tiles';
  document.body.appendChild(button);

  return button;
};

const showMap = (options: ButtonOption[], optionId: string) => {
  const option = options.find(op => op.id === optionId);

  if (currentMap) {
    unsubscribeFromEvents(currentMap);
    currentMap.destroy();
  }

  const [zoom, lat, lng] = getStartMapLocation();

  currentMap = new GlideMap({
    rootEl,
    styles: option.styles,
    zoom,
    center: new LatLng(lat, lng),
    ...option,
  });

  subscribeOnEvents(currentMap);
  syncQueryParamsWithSelectedMap(option.id);
};

export const renderMapOptions = (options: ButtonOption[]) => {
  const startMapViewOptionId = getStartMapViewId();
  const mapViewSelect = createMapViewsSelect();
  const downloadTilesButton = createDownloadTilesButton();
  createMapLocationsSelect();

  rootEl = createRootEl();

  for (const option of options) {
    const selectOption = document.createElement('option');
    selectOption.id = option.id;
    selectOption.value = option.id;
    selectOption.innerText = option.name;
    if (option.id === startMapViewOptionId) {
      selectOption.selected = true;
    }

    mapViewSelect.appendChild(selectOption);
  }

  mapViewSelect.addEventListener('change', e => {
    // @ts-ignore
    const id = e.target.value;

    showMap(options, id);
  });

  downloadTilesButton.onclick = () => {
    currentMap.downloadTiles();
  };

  showMap(options, startMapViewOptionId);
};

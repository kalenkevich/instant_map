import { MapOptions } from '../map/types';
import { LatLng } from '../map/geo/lat_lng';
import { GlideMap, MapEventType, DEFAULT_MAP_METADATA } from '../map/map';
import { MapTileFormatType } from '../map/tile/tile';
import { MapRendererType } from '../map/render/renderer';
import { VectorStyles } from './vector_styles';

type ButtonOption = Partial<MapOptions & { name: string; id: string }>;

const MAP_LOCATION_PARAM_NAME = 'l';
const USE_LOCAL_SERVER_PARAM_NAME = 'ls';
const SELECTED_MAP_VIEW_PARAM_MNAME = 'sm';

const useLocalServer = new URLSearchParams(document.location.search).has(USE_LOCAL_SERVER_PARAM_NAME);
const OSM_TILE_URL = `${useLocalServer ? '/osm' : 'https://tile.openstreetmap.org'}/{z}/{x}/{y}.png`;
const MAPTILER_PNG_TILE_URL = `${
  useLocalServer ? '/maptiler/satellite' : 'https://api.maptiler.com/maps/satellite/256'
}/{z}/{x}/{y}@2x.jpg?key=MfT8xhKONCRR9Ut0IKkt`;
const MAPTILER_VT_META_URL = `${
  useLocalServer ? '/maptiler/tiles_meta.json' : 'https://api.maptiler.com/tiles/v3/tiles.json'
}?key=MfT8xhKONCRR9Ut0IKkt`;

export const ButtonMapOptions: ButtonOption[] = [
  {
    name: 'VT webgl maptiler',
    id: 'webgl_vt_maptiler',
    renderer: MapRendererType.webgl,
    resizable: true,
    preheatTiles: true,
    tileMetaUrl: MAPTILER_VT_META_URL,
    styles: VectorStyles,
  },
  {
    name: 'VT threejs maptiler',
    id: 'threejs_vt_maptiler',
    renderer: MapRendererType.threejs,
    resizable: true,
    tileMetaUrl: MAPTILER_VT_META_URL,
    styles: VectorStyles,
  },
  {
    name: 'Png image osm',
    id: 'html_png_osm',
    renderer: MapRendererType.png,
    resizable: true,
    mapMeta: {
      ...DEFAULT_MAP_METADATA,
      maxzoom: 19,
      minzoom: 0,
      format: MapTileFormatType.png,
      tiles: [OSM_TILE_URL],
    },
  },
  {
    name: 'Png image maptiler',
    id: 'html_png_maptiler',
    renderer: MapRendererType.png,
    resizable: true,
    mapMeta: {
      ...DEFAULT_MAP_METADATA,
      maxzoom: 19,
      minzoom: 0,
      format: MapTileFormatType.png,
      tiles: [MAPTILER_PNG_TILE_URL],
    },
  },
  {
    name: 'Png webgl osm',
    id: 'webgl_png_osm',
    renderer: MapRendererType.webgl,
    resizable: true,
    preheatTiles: true,
    mapMeta: {
      ...DEFAULT_MAP_METADATA,
      maxzoom: 19,
      minzoom: 0,
      format: MapTileFormatType.png,
      tiles: [OSM_TILE_URL],
    },
  },
  {
    name: 'Png webgl maptiler',
    id: 'webgl_png_maptiler',
    renderer: MapRendererType.webgl,
    resizable: true,
    preheatTiles: true,
    mapMeta: {
      ...DEFAULT_MAP_METADATA,
      maxzoom: 19,
      minzoom: 0,
      format: MapTileFormatType.png,
      tiles: [MAPTILER_PNG_TILE_URL],
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

function getStartMapLocation(): [number, number, number] {
  const query = new URLSearchParams(document.location.search);

  if (!query.has(MAP_LOCATION_PARAM_NAME)) {
    return [14.3218, 53.0875, 25.3183];
  }

  const location = decodeURIComponent(query.get(MAP_LOCATION_PARAM_NAME));
  const [zoom, lat, lng] = location.split('/');

  return [parseFloat(zoom), parseFloat(lat), parseFloat(lng)];
}

function getStartMapViewId(): string {
  const query = new URLSearchParams(document.location.search);

  if (!query.has(SELECTED_MAP_VIEW_PARAM_MNAME)) {
    return 'webgl_png_osm';
  }

  return query.get(SELECTED_MAP_VIEW_PARAM_MNAME);
}

const syncQueryParamsWithMapState = () => {
  const center = currentMap.getCenter();
  const zoom = currentMap.getZoom();

  const query = new URLSearchParams(document.location.search);
  const safeLocation = `${Number(zoom).toFixed(4)}/${Number(center.lat).toFixed(4)}/${Number(center.lng).toFixed(4)}`;

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

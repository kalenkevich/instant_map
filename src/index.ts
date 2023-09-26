import { LatLng } from './map/geo/lat_lng';
import { GlideMap, MapEventType, DEFAULT_MAP_METADATA } from './map/map';
import { MapTileFormatType } from './map/tile/tile';
import { MapRendererType } from './map/render/renderer';

function createRootEl(width: number, height: number) {
  const div = document.createElement('div');

  div.id = 'glide-gl';
  div.style.border = '1px solid';
  div.style.margin = '10px';
  div.style.width = `${width}px`;
  div.style.height = `${height}px`;
  document.body.appendChild(div);

  return div;
}

function getStartMapLocation(): [number, number, number] {
  const query = new URLSearchParams(document.location.search);
  
  if (!query.has('l')) {
    return [14.3218, 53.0875, 25.3183];
  }

  const location = decodeURIComponent(query.get('l'));
  const [zoom, lat, lng] = location.split('/');

  return [parseFloat(zoom), parseFloat(lat), parseFloat(lng)];
}

window.addEventListener('load', () => {
  const [zoom, lat, lng] = getStartMapLocation();
  const width = window.innerWidth - 20;
  const height = window.innerHeight - 20;
  // const map = new GlideMap({
  //   rootEl: createRootEl(width, height),
  //   width,
  //   height,
  //   zoom,
  //   center: new LatLng(lat, lng),
  //   tilesMetaUrl: 'https://api.maptiler.com/tiles/v3/tiles.json?key=MfT8xhKONCRR9Ut0IKkt',
  // });
  const map = new GlideMap({
    rootEl: createRootEl(width, height),
    width,
    height,
    zoom,
    center: new LatLng(lat, lng),
    renderer: MapRendererType.png,
    mapMeta: {
      ...DEFAULT_MAP_METADATA,
      maxzoom: 19,
      minzoom: 0,
      format: MapTileFormatType.png,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    },
  });

  const updateQueryParams = () => {
    const center = map.getCenter();
    const zoom = map.getZoom();
    
    const query = new URLSearchParams(document.location.search);
    const safeLocation = `${Number(zoom).toFixed(4)}/${Number(center.lat).toFixed(4)}/${Number(center.lng).toFixed(4)}`;

    if (query.has('l')) {
      query.delete('l');
    }
    query.append('l', safeLocation);

    history.replaceState(null, '', '?' + query.toString());
  };

  map.addEventListener({
    eventType: MapEventType.MOVE,
    handler: updateQueryParams,
  });
  map.addEventListener({
    eventType: MapEventType.ZOOM,
    handler: updateQueryParams,
  });

  // renderObjectsDemo(canvas);
});

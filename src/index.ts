import { renderObjectsDemo } from './demo';
import { LatLng } from './map/geo/lat_lng';
import { GlideMap, MapEventType } from './map/map';

function createCanvas() {
  const canvas = document.createElement('canvas');

  canvas.id = 'glide-gl';
  canvas.width = 1024 * window.devicePixelRatio;
  canvas.height = 1024 * window.devicePixelRatio;

  document.body.appendChild(canvas);

  return canvas;
}

function getStartMapLocation(): [number, number, number] {
  const query = new URLSearchParams(document.location.search);
  
  if (!query.has('l')) {
    return [53.0875, 25.3183, 14.3218];
  }

  const location = decodeURIComponent(query.get('l'));
  const [zoom, lat, lng] = location.split('/');

  return [parseFloat(lat), parseFloat(lng), parseFloat(zoom)];
}

window.addEventListener('load', () => {
  const canvas = createCanvas();
  const [lat, lng, zoom] = getStartMapLocation();
  const map = new GlideMap({
    el: canvas,
    zoom,
    center: new LatLng(lat, lng),
    tilesMetaUrl: 'https://api.maptiler.com/tiles/v3/tiles.json?key=MfT8xhKONCRR9Ut0IKkt',
  });

  const updateQueryParams = () => {
    const center = map.getCenter();
    const zoom = map.getZoom();
    
    const query = new URLSearchParams(document.location.search);
    const safeLocation = encodeURIComponent(`${Number(zoom).toFixed(4)}/${Number(center.lat).toFixed(4)}/${Number(center.lng).toFixed(4)}`);

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

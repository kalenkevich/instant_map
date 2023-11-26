import { FetchTileOptions, fetchTile } from '../pbf/pbf_tile_utils';

addEventListener('message', async event => {
  const { tileId, layers, url, projectionType }: FetchTileOptions = event.data;

  try {
    const tileLayers = await fetchTile({ tileId, layers, url, projectionType });

    postMessage({ tileId, tileLayers });
  } catch (e) {
    console.warn('Worker error.', e);
    postMessage({ tileId }); // undefined tileData will unset cache hold
  }
});

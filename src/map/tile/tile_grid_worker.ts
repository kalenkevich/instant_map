import { FetchTileOptions, fetchTile } from './pbf/pbf_tile_utils';

addEventListener('message', async event => {
  const { tileId }: FetchTileOptions = event.data;

  try {
    const tileLayers = await fetchTile(event.data as FetchTileOptions);

    postMessage({ tileId, tileLayers });
  } catch (e) {
    console.warn('Worker error.', e);
    postMessage({ tileId }); // undefined tileData will unset cache hold
  }
});

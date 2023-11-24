import { fetchTile } from '../pbf/pbf_tile_utils';

addEventListener('message', async event => {
  const { tile, layers, url, projectionType } = event.data;

  try {
    const tileData = await fetchTile({ tile, layers, url, projectionType });
    postMessage({ tile, tileData });
  } catch (e) {
    console.warn('Worker error.', e);
    postMessage({ tile }); // undefined tileData will unset cache hold
  }
});

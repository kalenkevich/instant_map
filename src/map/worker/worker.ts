import { WorkerTaskRequestType, WorkerTaskResponseType, WorkerTaskRequest } from './worker_actions';
import { FetchTileOptions } from '../tile/tile_transformer';
import { fetchTile as fetchPbfTile } from '../tile/pbf/pbf_tile_to_webgl';
import { PbfTileLayer } from '../tile/pbf/pbf_tile';

const TileFetchPromiseMap = new Map<string, FetchTilePromise<void>>();
type FetchTilePromise<T> = Promise<T> & { cancel: () => void };

addEventListener('message', async message => {
  const request = message.data as WorkerTaskRequest<FetchTileOptions | string>;

  switch (request.type) {
    case WorkerTaskRequestType.FETCH_TILE: {
      const fetchData = request.data as FetchTileOptions;

      TileFetchPromiseMap.set(fetchData.tileId, startTileFetch(fetchData));

      return;
    }
    case WorkerTaskRequestType.CANCEL_TILE_FETCH: {
      const tileId = request.data as string;

      if (!TileFetchPromiseMap.has(tileId)) {
        return;
      }

      TileFetchPromiseMap.get(tileId).cancel();
      TileFetchPromiseMap.delete(tileId);
    }
  }
});

function startTileFetch(data: FetchTileOptions): FetchTilePromise<void> {
  let cancelled = false;
  let resolved = false;
  let rejected = false;
  let abortController = new AbortController();
  let promiseResolve: () => void;

  const onLayerReady = (tileLayer: PbfTileLayer) => {
    postMessage({
      type: WorkerTaskResponseType.TILE_LAYER_COMPLETE,
      data: {
        tileId: data.tileId,
        tileLayer,
      },
    });
  };

  const promise = new Promise<void>((resolve, reject) => {
    promiseResolve = resolve;

    fetchPbfTile(data, abortController, onLayerReady)
      .then(tileLayers => {
        postMessage({
          type: WorkerTaskResponseType.TILE_FULL_COMPLETE,
          data: {
            tileId: data.tileId,
            tileLayers,
          },
        });
        resolve();
        resolved = true;
      })
      .catch(e => {
        postMessage({ tileId: data.tileId });
        reject(e);
        rejected = true;
      })
      .finally(() => {
        if (TileFetchPromiseMap.has(data.tileId)) {
          TileFetchPromiseMap.delete(data.tileId);
        }
      });
  });

  (promise as FetchTilePromise<void>).cancel = () => {
    if (cancelled || resolved || rejected) {
      return;
    }

    abortController.abort();
    promiseResolve();
    cancelled = true;
  };

  return promise as FetchTilePromise<void>;
}

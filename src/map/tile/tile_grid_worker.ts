import { FetchTileOptions } from './pbf/pbf_tile_utils';
import { fetchTile as fetchPbfTile } from './pbf/pbf_tile_utils';

export enum TileGridWorkerEventType {
  FETCH_TILE = 'FETCH_TILE',
  CANCEL_TILE_FETCH = 'CANCEL_TILE_FETCH',
}

export type TileEventData = FetchTileEventData | CancelTileFetchEventData;

export interface FetchTileEventData {
  type: TileGridWorkerEventType.FETCH_TILE;
  data: FetchTileOptions;
}

export interface CancelTileFetchEventData {
  type: TileGridWorkerEventType.CANCEL_TILE_FETCH;
  tileId: string;
}

const TileFetchPromiseMap = new Map<string, FetchTilePromise<void>>();

addEventListener('message', async event => {
  if ((event.data as TileEventData).type === TileGridWorkerEventType.FETCH_TILE) {
    const fetchData = event.data.data;

    TileFetchPromiseMap.set(fetchData.tileId, startTileFetch(fetchData));

    return;
  }

  if ((event.data as TileEventData).type === TileGridWorkerEventType.CANCEL_TILE_FETCH) {
    const tileId = event.data.tileId;

    if (!TileFetchPromiseMap.has(tileId)) {
      return;
    }

    TileFetchPromiseMap.get(tileId).cancel();
    TileFetchPromiseMap.delete(tileId);
  }
});

type FetchTilePromise<T> = Promise<T> & { cancel: () => void };

function startTileFetch(data: FetchTileOptions): FetchTilePromise<void> {
  let cancelled = false;
  let resolved = false;
  let rejected = false;
  let abortController = new AbortController();
  let promiseResolve: () => void;

  const promise = new Promise<void>((resolve, reject) => {
    promiseResolve = resolve;

    fetchPbfTile(data, abortController)
      .then(tileLayers => {
        postMessage({ tileId: data.tileId, tileLayers });
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

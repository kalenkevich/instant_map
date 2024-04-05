import { MapTile } from '../tile/tile';
import { MapTileRendererType } from '../renderer/renderer';
import { FetchTileOptions, TileSourceProcessor } from '../tile/tile_source_processor';
import { WorkerTaskRequestType, WorkerTaskResponseType, WorkerTaskRequest } from './worker_actions';

export type FetchTilePromise<T> = Promise<T> & { cancel: () => void };

export class WorkerActionHandler {
  private readonly tileFetchPromiseMap = new Map<string, FetchTilePromise<void>>();

  constructor(private readonly tileRendererTypeTransformerMap: Record<MapTileRendererType, TileSourceProcessor>) {}

  listen() {
    addEventListener('message', this.workerMessageHandler);
  }

  stop() {
    removeEventListener('message', this.workerMessageHandler);
  }

  private workerMessageHandler = (message: { data: WorkerTaskRequest<FetchTileOptions | string> }) => {
    const request = message.data;

    switch (request.type) {
      case WorkerTaskRequestType.FETCH_TILE: {
        const fetchData = request.data as FetchTileOptions;

        this.tileFetchPromiseMap.set(fetchData.tileId, this.startTileFetch(fetchData));

        return;
      }
      case WorkerTaskRequestType.CANCEL_TILE_FETCH: {
        const tileId = request.data as string;

        if (!this.tileFetchPromiseMap.has(tileId)) {
          return;
        }

        this.tileFetchPromiseMap.get(tileId).cancel();
        this.tileFetchPromiseMap.delete(tileId);

        return;
      }
      default:
        throw new Error(`No handler for "${request.type}" worker action.`);
    }
  };

  private startTileFetch(data: FetchTileOptions): FetchTilePromise<void> {
    const abortController = new AbortController();
    let cancelled = false;
    let resolved = false;
    let rejected = false;
    let promiseResolve: () => void;

    const promise = new Promise<void>((resolve, reject) => {
      promiseResolve = resolve;
      const tileTrasformer = this.tileRendererTypeTransformerMap[data.rendererType];

      tileTrasformer
        .getMapTile(data, abortController)
        .then((tile: MapTile) => {
          postMessage({
            type: WorkerTaskResponseType.TILE_FULL_COMPLETE,
            data: tile,
          });
          resolve();
          resolved = true;
        })
        .catch((e: Error) => {
          postMessage({ tileId: data.tileId });
          reject(e);
          rejected = true;
        })
        .finally(() => {
          if (this.tileFetchPromiseMap.has(data.tileId)) {
            this.tileFetchPromiseMap.delete(data.tileId);
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
}

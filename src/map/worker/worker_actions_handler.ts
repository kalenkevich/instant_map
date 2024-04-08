import { MapTile } from '../tile/tile';
import { TileProcessingOptions, TileSourceProcessor } from '../tile/source/tile_source_processor';
import { WorkerTaskRequestType, WorkerTaskResponseType, WorkerTaskRequest } from './worker_actions';

export type FetchTilePromise<T> = Promise<T> & { cancel: () => void };

export class WorkerActionHandler {
  private readonly tileFetchPromiseMap = new Map<string, FetchTilePromise<void>>();
  private readonly tileSourceProcessor = new TileSourceProcessor();

  constructor() {}

  listen() {
    addEventListener('message', this.workerMessageHandler);
  }

  stop() {
    removeEventListener('message', this.workerMessageHandler);
  }

  private workerMessageHandler = (message: { data: WorkerTaskRequest<TileProcessingOptions | string> }) => {
    const request = message.data;

    switch (request.type) {
      case WorkerTaskRequestType.FETCH_TILE: {
        const processTileOptions = request.data as TileProcessingOptions;

        this.tileFetchPromiseMap.set(
          processTileOptions.tileSource.tileId,
          this.startTileProcessing(processTileOptions),
        );

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

  private startTileProcessing(processTileOptions: TileProcessingOptions): FetchTilePromise<void> {
    const abortController = new AbortController();
    let cancelled = false;
    let resolved = false;
    let rejected = false;
    let promiseResolve: () => void;
    const tileId = processTileOptions.tileSource.tileId;

    const promise = new Promise<void>((resolve, reject) => {
      promiseResolve = resolve;

      this.tileSourceProcessor
        .getMapTile(processTileOptions.featureFlags, processTileOptions.tileSource, abortController)
        .then(tile =>
          this.tileSourceProcessor.prerenderTile(
            processTileOptions.featureFlags,
            tile,
            processTileOptions.tilePrerender,
          ),
        )
        .then((tile: MapTile) => {
          postMessage({
            type: WorkerTaskResponseType.TILE_FULL_COMPLETE,
            data: tile,
          });
          resolve();
          resolved = true;
        })
        .catch((e: Error) => {
          postMessage({ tileId });
          reject(e);
          rejected = true;
        })
        .finally(() => {
          if (this.tileFetchPromiseMap.has(tileId)) {
            this.tileFetchPromiseMap.delete(tileId);
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

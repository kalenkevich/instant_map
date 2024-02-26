import { MapTileLayer } from '../tile/tile';

/** Supported worker requests. */
export enum WorkerTaskRequestType {
  FETCH_TILE = 'FETCH_TILE',
  CANCEL_TILE_FETCH = 'CANCEL_TILE_FETCH',
}

export interface WorkerTaskRequest<DataType> {
  type: WorkerTaskRequestType;
  data: DataType;
}

export interface FetchTileWorkerTaskRequestData<DataType> extends WorkerTaskRequest<DataType> {
  type: WorkerTaskRequestType.FETCH_TILE;
}

export interface CancelTileFetchWorkerTaskRequestData<DataType> extends WorkerTaskRequest<DataType> {
  type: WorkerTaskRequestType.CANCEL_TILE_FETCH;
}

/** Supported worker responses. */
export enum WorkerTaskResponseType {
  TILE_FULL_COMPLETE = 'TILE_FULL_COMPLETE',
  TILE_LAYER_COMPLETE = 'TILE_LAYER_COMPLETE',
}

export type WorkerTaskResponse = TileFullCompleteResponse | TileLayerCompleteResponse;

export interface TileFullCompleteResponse {
  type: WorkerTaskResponseType.TILE_FULL_COMPLETE;
  data: {
    tileId: string;
    tileLayers: MapTileLayer[];
  };
}

export interface TileLayerCompleteResponse {
  type: WorkerTaskResponseType.TILE_LAYER_COMPLETE;
  data: {
    tileId: string;
    tileLayer: MapTileLayer;
  };
}

import { MapTile, MapTileLayer } from '../tile/tile';

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
}

export type WorkerTaskResponse = TileFullCompleteResponse;

export interface TileFullCompleteResponse {
  type: WorkerTaskResponseType.TILE_FULL_COMPLETE;
  data: MapTile;
}

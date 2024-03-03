import { WorkerTaskRequest, WorkerTaskResponse, WorkerTaskResponseType } from './worker_actions';

export const CANCEL_WORKER_ERROR_MESSAGE = '__WORKER_CANCELLED__';

export enum WorkerStatus {
  FREE = 0,
  BUZY = 1,
}

/**
 * Wrapper for native Worker API.
 * Promisifies the postMessage execution, waits for the worker response and makes it's cancellable.
 * */
export class WorkerInstance {
  private worker: Worker;
  private cancelled = false;
  private resolved = false;
  private currentReject?: (message: any) => void;
  private status: WorkerStatus = WorkerStatus.FREE;

  constructor(workerIndex: number, private readonly onMessageHandler: (response: WorkerTaskResponse) => void) {
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), { name: `tile worker ${workerIndex}` });
  }

  sendRequest(request: WorkerTaskRequest<any>) {
    this.worker.postMessage(request);
  }

  execute<InputMessage, OutputMessage>(inputMessage: InputMessage): Promise<OutputMessage> {
    this.cancelled = false;
    this.resolved = false;
    this.currentReject = undefined;

    return new Promise((resolve, reject) => {
      this.currentReject = reject;

      this.worker.onmessage = (result: any) => {
        this.onMessageHandler(result.data);

        if (this.cancelled || this.resolved) {
          return;
        }

        if (result.data.type === WorkerTaskResponseType.TILE_FULL_COMPLETE) {
          resolve(result.data as OutputMessage);
          this.status = WorkerStatus.FREE;
          this.resolved = true;
        }
      };

      this.worker.onerror = (error: any) => {
        if (this.cancelled || this.resolved) {
          return;
        }

        reject(error);
        this.status = WorkerStatus.FREE;
      };

      this.status = WorkerStatus.BUZY;
      this.worker.postMessage(inputMessage);
    });
  }

  getStatus(): WorkerStatus {
    return this.status;
  }

  cancel() {
    if (!this.cancelled && !this.resolved && this.currentReject) {
      this.cancelled = true;
      this.currentReject(CANCEL_WORKER_ERROR_MESSAGE);
      this.status = WorkerStatus.FREE;
    }
  }
}

import { Evented } from '../evented';
import { WorkerTaskRequest, WorkerTaskResponse, WorkerTaskResponseType } from './worker_actions';

export enum WorkerStatus {
  FREE = 0,
  BUZY = 1,
}

/**
 * Wrapper for native Worker API.
 * */
export class WorkerInstance extends Evented<WorkerTaskResponseType> {
  private worker: Worker;
  private status: WorkerStatus = WorkerStatus.FREE;
  private subscribedOnResponce: boolean = false;

  constructor(name: string) {
    super();
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), { name });
  }

  sendRequest(
    request: WorkerTaskRequest<unknown>,
    responseEvent?: WorkerTaskResponseType,
    responseHandler: (response: WorkerTaskResponse) => void = () => {},
  ) {
    this.worker.postMessage(request);

    if (this.subscribedOnResponce) {
      return;
    }

    this.worker.onmessage = (result: { data: WorkerTaskResponse }) => {
      this.fire(result.data.type, result.data);

      if (responseEvent && result.data.type === responseEvent) {
        responseHandler(result.data);
      }
    };

    this.worker.onerror = () => {
      this.status = WorkerStatus.FREE;
    };

    this.subscribedOnResponce = true;
  }

  setStatus(status: WorkerStatus) {
    this.status = status;
  }

  getStatus(): WorkerStatus {
    return this.status;
  }
}

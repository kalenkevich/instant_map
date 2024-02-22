export const CANCEL_WORKER_ERROR_MESSAGE = '__WORKER_CANCELLED__';

export enum WorkerStatus {
  FREE = 0,
  BUZY = 1,
}

export class WorkerInstance {
  private worker: Worker;
  private cancelled = false;
  private currentReject?: (message: any) => void;
  private status: WorkerStatus = WorkerStatus.FREE;

  constructor(workerIndex: number) {
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), { name: `tile worker ${workerIndex}` });
  }

  postMessage(message: any) {
    this.worker.postMessage(message);
  }

  execute<InputMessage, OutputMessage>(inputMessage: InputMessage): Promise<OutputMessage> {
    this.cancelled = false;
    this.currentReject = undefined;

    return new Promise((resolve, reject) => {
      this.currentReject = reject;

      this.worker.onmessage = (result: any) => {
        if (this.cancelled) {
          return;
        }

        resolve(result as OutputMessage);
        this.status = WorkerStatus.FREE;
      };

      this.worker.onerror = (error: any) => {
        if (this.cancelled) {
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
    if (this.currentReject) {
      this.cancelled = true;
      this.currentReject(CANCEL_WORKER_ERROR_MESSAGE);
      this.status = WorkerStatus.FREE;
    }
  }
}

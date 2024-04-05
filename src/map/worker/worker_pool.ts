import { WorkerTaskRequest, WorkerTaskResponse, WorkerTaskResponseType } from './worker_actions';
import { WorkerInstance, WorkerStatus } from './worker_instance';

export interface WorkerTask {
  taskId: number;
  worker: WorkerInstance;
}

/**
 * Manage Worker instances as a group.
 * Operate promises of the worker executions.
 * Can cancel any current worker task.
 * If all workers are busy and new request is comming will wait till any of the worker became free again.
 */
export type WorkerEventListener = (response: WorkerTaskResponse) => void;

export class WorkerPool {
  private workerInstances: WorkerInstance[] = [];
  private currentTasks: Record<number, WorkerTask> = {};
  private currentTaskId = 0;

  constructor(private readonly maxPool: number = 8) {}

  async execute<DataType>(
    inputMessage: WorkerTaskRequest<DataType>,
    responseEvent?: WorkerTaskResponseType,
    responseHandler: (response: WorkerTaskResponse) => void = () => {},
  ): Promise<WorkerTask> {
    const worker = await this.getAvailableWorkerInstance();

    worker.sendRequest(inputMessage, responseEvent, responseHandler);
    worker.setStatus(WorkerStatus.BUZY);

    const newTask = {
      taskId: this.currentTaskId++,
      worker,
    };
    this.currentTasks[newTask.taskId] = newTask;

    return newTask;
  }

  cancel(taskId: number): void {
    const task = this.currentTasks[taskId];

    if (task) {
      task.worker.setStatus(WorkerStatus.FREE);
      delete this.currentTasks[task.taskId];
    }
  }

  private async getAvailableWorkerInstance(): Promise<WorkerInstance> {
    for (const worker of this.workerInstances) {
      if (worker.getStatus() === WorkerStatus.FREE) {
        return worker;
      }
    }

    if (this.workerInstances.length < this.maxPool) {
      return this.createNewWorker();
    }

    return await Promise.race(
      Object.values(this.currentTasks).map(
        task =>
          new Promise<WorkerInstance>(resolve => {
            task.worker.once(WorkerTaskResponseType.TILE_FULL_COMPLETE, () => {
              resolve(task.worker);
              task.worker.setStatus(WorkerStatus.FREE);
              delete this.currentTasks[task.taskId];
            });
          }),
      ),
    );
  }

  private createNewWorker(): WorkerInstance {
    const workerInstance = new WorkerInstance(`tile worker ${this.workerInstances.length}`);

    this.workerInstances.push(workerInstance);

    return workerInstance;
  }
}

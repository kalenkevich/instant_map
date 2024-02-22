import { WorkerInstance, WorkerStatus, CANCEL_WORKER_ERROR_MESSAGE } from './worker_instance';

export { CANCEL_WORKER_ERROR_MESSAGE };

export enum TaskStatus {
  IN_PROGRESS = 0,
  FULLFILLED = 1,
  CANCELED = 2,
  FAILED = 3,
}

export interface WorkerTask<TaskResult extends any> {
  taskId: number;
  worker: WorkerInstance;
  task: Promise<TaskResult>;
  status: TaskStatus;
}

export class WorkerPool {
  private workerInstances: WorkerInstance[] = [];
  private currentTasks: Record<number, WorkerTask<any>> = {};
  private currentTaskId = 0;

  constructor(private readonly maxPool: number = 8) {}

  async execute<InputMessage, OutputMessage>(inputMessage: InputMessage): Promise<WorkerTask<OutputMessage>> {
    const worker = await this.getAvailableWorkerInstance();
    if (!worker.execute) {
      debugger;
    }

    const newTask = {
      taskId: this.currentTaskId++,
      worker,
      task: worker
        .execute(inputMessage)
        .then((result: OutputMessage) => {
          newTask.status = TaskStatus.FULLFILLED;

          return result;
        })
        .catch((error: any) => {
          if (error === CANCEL_WORKER_ERROR_MESSAGE) {
            newTask.status = TaskStatus.CANCELED;
          } else {
            newTask.status = TaskStatus.FAILED;
          }

          throw error;
        })
        .finally(() => {
          delete this.currentTasks[newTask.taskId];
        }),
      status: TaskStatus.IN_PROGRESS,
    };
    this.currentTasks[newTask.taskId] = newTask;

    return newTask;
  }

  cancel(taskId: number): void {
    const task = this.currentTasks[taskId];

    if (task) {
      task.worker.cancel();
      task.status = TaskStatus.CANCELED;
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

    return Promise.race(
      Object.values(this.currentTasks).map(
        task =>
          new Promise<WorkerInstance>(resolve => {
            task.task
              .catch(error => {
                if (error !== CANCEL_WORKER_ERROR_MESSAGE) {
                  console.log(error);
                }
              })
              .finally(() => {
                resolve(task.worker);
              });
          })
      )
    );
  }

  private createNewWorker(): WorkerInstance {
    const workerInstance = new WorkerInstance(this.workerInstances.length);

    this.workerInstances.push(workerInstance);

    return workerInstance;
  }
}

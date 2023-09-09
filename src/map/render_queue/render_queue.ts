import {MinHeap} from './min_heap';

export type RenderTaskFn = () => void;

export enum RenderTaskType {
  RENDER = 'render',
}

export interface RenderTask {
  frameId?: number;
  priority: number;
  type: RenderTaskType;
  renderFn: RenderTaskFn;
};

export class RenderQueue {
  private queue: MinHeap<RenderTask> = new MinHeap([], (t: RenderTask) => t.priority);
  private promiseQueue: Promise<void> = Promise.resolve();

  public push(renderFn: RenderTaskFn, urgent = false) {
    if (urgent) {
      this.queue.push({
        priority: 0,
        type: RenderTaskType.RENDER,
        renderFn,
      });

      return;
    }

    this.queue.push({
      priority: 1,
      type: RenderTaskType.RENDER,
      renderFn,
    });
  }

  public next(): Promise<void> {
    const task = this.queue.pop();

    if (!task) {
      return this.promiseQueue;
    }

    while (!this.queue.isEmpty() && this.queue.peek()!.type === task.type) {
      this.queue.pop();
    }

    return this.promiseQueue.then(() => {
      return new Promise((resolve) => {
        task.frameId = requestAnimationFrame(() => {
          task.renderFn();
          resolve();
        });
      });
    });
  }

  public clear(): Promise<void> {
    while (!this.queue.isEmpty()) {
      const task = this.queue.pop();

      if (task.frameId) {
        cancelAnimationFrame(task.frameId);
      }
    }

    return this.promiseQueue;
  }
}
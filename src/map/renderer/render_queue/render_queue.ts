export type RenderFunc = (...any: []) => any;

export type ResolveFunc = (...any: []) => any;

export class RenderQueue {
  private queue: Array<[RenderFunc, ResolveFunc]> = [];
  private isActive: boolean = false;
  private rafIds: Record<number, number> = {};

  constructor() {
    this.invokeRender = this.invokeRender.bind(this);
  }

  public render(renderFn: RenderFunc): Promise<void> {
    return new Promise(resolve => {
      this.queue.push([renderFn, resolve]);

      if (!this.isActive) {
        this.rafIds[0] = requestAnimationFrame(() => {
          this.invokeRender(0);
        });
      }
    });
  }

  public clear() {
    this.isActive = false;
    this.queue = [];

    for (const rafId of Object.values(this.rafIds)) {
      cancelAnimationFrame(rafId);
    }
  }

  private invokeRender(index: number) {
    if (index >= this.queue.length) {
      this.clear();
      return;
    }

    this.isActive = true;
    const [renderFn, resolveFn] = this.queue[index];

    // invoke render
    renderFn();

    // we don't need to cancel it anymore
    delete this.rafIds[index];
    this.rafIds[index + 1] = requestAnimationFrame(() => this.invokeRender(index + 1));

    // Resolve promise
    resolveFn();
  }
}

import { throttle } from '../utils';

export abstract class Evented {
  protected el: HTMLElement;

  constructor(el: HTMLElement) {
    this.el = el;
  }

  dragStarted = false;
  dragStartX = 0;
  dragStartY = 0;

  subscribeOnUserEvents() {
    this.el.addEventListener(
      'click',
      throttle((clickEvent: MouseEvent) => this.onClickEvent(clickEvent), 50)
    );
    this.el.addEventListener(
      'wheel',
      throttle((wheelEvent: WheelEvent) => this.onWheelEvent(wheelEvent), 200)
    );

    // drag events
    this.el.addEventListener(
      'mousedown',
      throttle((mouseDownEvent: MouseEvent) => this.onMouseDownEvent(mouseDownEvent), 50)
    );
    this.el.addEventListener('mousemove', (mouseMoveEvent: MouseEvent) => this.onMouseMove(mouseMoveEvent));
    this.el.addEventListener(
      'mouseup',
      throttle((mouseUpEvent: MouseEvent) => this.onMouseUpEvent(mouseUpEvent), 50)
    );
  }

  abstract onClickEvent(clickEvent: MouseEvent): void;

  abstract onWheelEvent(wheelEvent: WheelEvent): void;

  abstract onMouseDownEvent(mouseDownEvent: MouseEvent): void;

  abstract onMouseMove(mouseMoveEvent: MouseEvent): void;

  abstract onMouseUpEvent(mouseUpEvent: MouseEvent): void;
}

import { GlideMap } from '../map';

export abstract class EventHandler {
  el: HTMLElement;
  map: GlideMap;

  abstract eventType: string;

  constructor(map: GlideMap) {
    this.map = map;
    this.el = map.getContainer();
    this.eventHandler = this.eventHandler.bind(this);
  }

  abstract destroy(): void;

  subscribe(): void {
    this.el.addEventListener(this.eventType, this.eventHandler);
  }

  unsubscribe(): void {
    this.el.removeEventListener(this.eventType, this.eventHandler);
  }

  abstract eventHandler(...args: any[]): void;
}

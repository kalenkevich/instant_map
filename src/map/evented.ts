export type EventListener<EventType> = (eventType: EventType, ...eventArgs: any[]) => void;

let globalId = 0;

export class Evented<EventType> {
  private eventListeners: Array<{ eventType: EventType; handler: EventListener<EventType>; enabled: boolean }> = [];

  public on(eventType: EventType, handler: EventListener<EventType>): void {
    this.eventListeners.push({
      eventType,
      handler,
      enabled: true,
    });
  }

  public once(eventType: EventType, handler: EventListener<EventType>): void {
    const onceHandler: EventListener<EventType> = (_: EventType, ...eventArgs: any[]) => {
      this.off(eventType, onceHandler);

      handler(eventType, ...eventArgs);
    };

    this.eventListeners.push({
      eventType,
      handler: onceHandler,
      enabled: true,
    });
  }

  public off(eventType: EventType, handler: EventListener<EventType>) {
    this.eventListeners = this.eventListeners.filter(l => !(l.eventType === eventType && l.handler === handler));
  }

  protected fire(eventType: EventType, ...eventArgs: any[]) {
    const listeners = [...this.eventListeners];

    for (const listener of listeners) {
      if (listener.eventType === eventType || listener.eventType === '*') {
        listener.handler(eventType, ...eventArgs);
      }
    }
  }
}

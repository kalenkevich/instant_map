export type EventListener<EventType> = (eventType: EventType, ...eventArgs: unknown[]) => void;

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
    const onceHandler: EventListener<EventType> = (_: EventType, ...eventArgs: unknown[]) => {
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

  public fire(eventType: EventType, ...eventArgs: unknown[]) {
    const listeners = [...this.eventListeners];

    for (const listener of listeners) {
      if (listener.eventType === eventType || listener.eventType === '*') {
        listener.handler(eventType, ...eventArgs);
      }
    }
  }
}

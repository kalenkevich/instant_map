// Evented
export type EventListener<EventType> = (eventType: EventType, ...eventArgs: any[]) => void;

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
    const onceHandler: EventListener<EventType> = (...eventArgs: any[]) => {
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
    const index = this.eventListeners.findIndex(l => {
      return l.eventType === eventType && l.handler === handler;
    });

    if (index > -1) {
      this.eventListeners[index].enabled = false;
    }
  }

  protected fire(eventType: EventType, ...eventArgs: any[]) {
    for (const listener of this.eventListeners) {
      if (!listener.enabled) {
        continue;
      }

      if (listener.eventType === eventType || listener.eventType === '*') {
        listener.handler(eventType, ...eventArgs);
      }
    }
  }
}

/**
 * Generic pub/sub event bus.
 * Adapted from myclaw's event-bus for eggs-ai agent engine.
 */

export type EventHandler<TEvent> = (event: TEvent) => void;

export interface EventBus<TEvent> {
  publish(event: TEvent): void;
  subscribe(handler: EventHandler<TEvent>): () => void;
}

export class InMemoryEventBus<TEvent> implements EventBus<TEvent> {
  private readonly handlers = new Set<EventHandler<TEvent>>();

  publish(event: TEvent): void {
    for (const handler of this.handlers) {
      try {
        handler(event);
      } catch {
        // Monitoring must never break runtime.
      }
    }
  }

  subscribe(handler: EventHandler<TEvent>): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }
}

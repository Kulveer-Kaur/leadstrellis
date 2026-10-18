import { EventEmitter } from 'node:events';
import { logger } from '../lib/logger.js';
import type { DomainEventName, DomainEvents } from './event.types.js';

type Handler<E extends DomainEventName> = (payload: DomainEvents[E]) => void | Promise<void>;

/** Typed in-process event bus. Async handler errors are logged, never thrown to the emitter. */
class EventBus {
  private emitter = new EventEmitter();

  emit<E extends DomainEventName>(event: E, payload: DomainEvents[E]) {
    this.emitter.emit(event, payload);
  }

  on<E extends DomainEventName>(event: E, handler: Handler<E>) {
    this.emitter.on(event, (payload: DomainEvents[E]) => {
      Promise.resolve()
        .then(() => handler(payload))
        .catch((err) => logger.error({ err, event }, 'event handler failed'));
    });
  }
}

export const eventBus = new EventBus();

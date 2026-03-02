/**
 * @fileoverview Event bus is a simple event emitter.
 * @license MIT
 * @author Alexandr Kalabin
 */

export default class EventBus<T extends { [K in keyof T]: (...args: any[]) => void }> {
  private _bus = new Map<keyof T, Set<T[keyof T]>>();

  on<K extends keyof T>(event: K, cb: T[K]) {
    const listeners = this._bus.get(event);

    if (listeners) {
      listeners.add(cb);
    }
    else {
      this._bus.set(event, new Set<T[keyof T]>().add(cb));
    }
  }

  off<K extends keyof T>(event: K, cb: T[K]) {
    const listeners = this._bus.get(event);

    if (listeners) {
      listeners.delete(cb);

      if (listeners.size === 0) this._bus.delete(event);
    }
  }

  emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>) {
    const listeners = this._bus.get(event);

    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }
}
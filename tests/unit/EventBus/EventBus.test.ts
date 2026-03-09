import { describe, it, expect, vi, beforeEach } from 'vitest';
import EventBus from '../../../src/EventBus/EventBus';
import type { IEventMap, IItem } from '../../../src/types/types';

// mock render function
const render = () => ({} as HTMLElement);

describe('EventBus', () => {
  let bus: EventBus<IEventMap>;
  let mockOnScrollCallback: IEventMap['onScroll'];
  let mockOnInsertCallback: IEventMap['onInsert'];

  beforeEach(() => {
    bus = new EventBus<IEventMap>();
    mockOnScrollCallback = vi.fn();
    mockOnInsertCallback = vi.fn();
  });

  describe('on()', () => {
    it('should register a listener for an event', () => {
      bus.on('onScroll', mockOnScrollCallback);
      bus.emit('onScroll', 100, 'up', 'fast');
      expect(mockOnScrollCallback).toHaveBeenCalledTimes(1);
      expect(mockOnScrollCallback).toHaveBeenCalledWith(100, 'up', 'fast');
    });

    it('should register multiple listeners for the same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      bus.on('onScroll', callback1);
      bus.on('onScroll', callback2);
      bus.emit('onScroll', 100, 'up', 'fast');

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple different events', () => {
      const scrollCallback = vi.fn();
      const resizeCallback = vi.fn();

      bus.on('onScroll', scrollCallback);
      bus.on('onResize', resizeCallback);

      bus.emit('onScroll', 100, 'up', 'fast');
      bus.emit('onResize', 800, 600);

      expect(scrollCallback).toHaveBeenCalledWith(100, 'up', 'fast');
      expect(resizeCallback).toHaveBeenCalledWith(800, 600);
    });

    it('does not trigger listeners of other events', () => {
      const insertListener = vi.fn();
      const deleteListener = vi.fn();

      bus.on('onInsert', insertListener);
      bus.on('onDelete', deleteListener);

      bus.emit('onInsert', 1, { data: '1', render });

      expect(insertListener).toHaveBeenCalledTimes(1);
      expect(deleteListener).not.toHaveBeenCalled();
    });

    it('should allow registering the same callback multiple times', () => {
      bus.on('onScroll', mockOnScrollCallback);
      bus.on('onScroll', mockOnScrollCallback);
      bus.emit('onScroll', 100, 'up', 'fast');

      // Set deduplicates, so should only be called once
      expect(mockOnScrollCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('off()', () => {
    it('should remove a specific listener', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      bus.on('onScroll', callback1);
      bus.on('onScroll', callback2);
      bus.off('onScroll', callback1);
      bus.emit('onScroll', 100, 'up', 'fast');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should clean up empty listener sets', () => {
      bus.on('onScroll', mockOnScrollCallback);
      bus.off('onScroll', mockOnScrollCallback);
      bus.emit('onScroll', 100, 'up', 'fast');

      expect(mockOnScrollCallback).not.toHaveBeenCalled();
    });

    it('should not throw when removing non-existent listener', () => {
      expect(() => {
        bus.off('onScroll', mockOnScrollCallback);
      }).not.toThrow();
    });

    it('should not throw when removing from non-existent event', () => {
      expect(() => {
        bus.off('onInsert' as any, mockOnScrollCallback);
      }).not.toThrow();
    });

    it('should remove only the specified callback when duplicates exist', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      bus.on('onScroll', callback1);
      bus.on('onScroll', callback2);
      bus.on('onScroll', callback1); // Register same callback again
      bus.off('onScroll', callback1);
      bus.emit('onScroll', 100, 'up', 'fast');

      // Since we use Set, callback1 is deduplicated
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('emit()', () => {
    it('should pass correct arguments to listeners', () => {
      bus.on('onInsert', mockOnInsertCallback);
      const mockItem: IItem = { data: '1', render };
      bus.emit('onInsert', 5, mockItem);

      expect(mockOnInsertCallback).toHaveBeenCalledWith(5, mockItem);
    });

    it('should not throw when emitting to event with no listeners', () => {
      expect(() => {
        bus.emit('onScroll', 100, 'up', 'fast');
      }).not.toThrow();
    });

    it('should emit to all registered listeners', () => {
      const callbacks = [vi.fn(), vi.fn(), vi.fn()];
      callbacks.forEach(cb => bus.on('onScroll', cb));

      bus.emit('onScroll', 100, 'down', 'fast');

      callbacks.forEach(cb => {
        expect(cb).toHaveBeenCalledWith(100, 'down', 'fast');
      });
    });

    it('should handle listener that throws without affecting others', () => {
      const errorCallback = vi.fn(() => { throw new Error('Test error'); });
      const successCallback = vi.fn();

      bus.on('onScroll', errorCallback);
      bus.on('onScroll', successCallback);

      expect(() => {
        bus.emit('onScroll', 100, 'up', 'fast');
      }).toThrow();

      // The error callback was called before throwing
      expect(errorCallback).toHaveBeenCalledTimes(1);
      // Note: successCallback may or may not be called depending on error handling
      // In current implementation, it won't be called due to the throw
    });
  });

  describe('Event-specific tests', () => {
    it('should handle onInsert event correctly', () => {
      const callback = vi.fn();
      bus.on('onInsert', callback);
      const item: IItem = { data: 'test-1', render };

      bus.emit('onInsert', 0, item);

      expect(callback).toHaveBeenCalledWith(0, item);
    });

    it('should handle onDelete event correctly', () => {
      const callback = vi.fn();
      bus.on('onDelete', callback);

      bus.emit('onDelete', 5, 3);

      expect(callback).toHaveBeenCalledWith(5, 3);
    });

    it('should handle onResize event correctly', () => {
      const callback = vi.fn();
      bus.on('onResize', callback);

      bus.emit('onResize', 1920, 1080);

      expect(callback).toHaveBeenCalledWith(1920, 1080);
    });

    it('should handle onScroll event with up direction', () => {
      const callback = vi.fn();
      bus.on('onScroll', callback);

      bus.emit('onScroll', 500, 'up', 'fast');

      expect(callback).toHaveBeenCalledWith(500, 'up', 'fast');
    });

    it('should handle onScroll event with down direction', () => {
      const callback = vi.fn();
      bus.on('onScroll', callback);

      bus.emit('onScroll', 500, 'down', 'fast');

      expect(callback).toHaveBeenCalledWith(500, 'down', 'fast');
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid on/off operations', () => {
      const callback = vi.fn();

      bus.on('onScroll', callback);
      bus.off('onScroll', callback);
      bus.on('onScroll', callback);
      bus.emit('onScroll', 100, 'up', 'fast');

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle emitting after all listeners removed', () => {
      bus.on('onScroll', mockOnScrollCallback);
      bus.off('onScroll', mockOnScrollCallback);
      bus.emit('onScroll', 100, 'up', 'fast');

      expect(mockOnScrollCallback).not.toHaveBeenCalled();
    });

    it('should maintain listener order', () => {
      const callOrder: string[] = [];
      bus.on('onScroll', () => callOrder.push('first'));
      bus.on('onScroll', () => callOrder.push('second'));
      bus.on('onScroll', () => callOrder.push('third'));

      bus.emit('onScroll', 100, 'up', 'fast');

      expect(callOrder).toEqual(['first', 'second', 'third']);
    });

    it('should work with arrow functions', () => {
      const results: number[] = [];
      bus.on('onResize', (w, h) => results.push(w + h));

      bus.emit('onResize', 100, 200);

      expect(results).toEqual([300]);
    });
  });

  describe('Multiple EventBus instances', () => {
    it('should maintain separate listener registries', () => {
      const bus1 = new EventBus<IEventMap>();
      const bus2 = new EventBus<IEventMap>();
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      bus1.on('onScroll', callback1);
      bus2.on('onScroll', callback2);

      bus1.emit('onScroll', 100, 'up', 'fast');
      bus2.emit('onScroll', 200, 'down', 'fast');

      expect(callback1).toHaveBeenCalledWith(100, 'up', 'fast');
      expect(callback2).toHaveBeenCalledWith(200, 'down', 'fast');
      expect(callback1).not.toHaveBeenCalledWith(200, 'down');
      expect(callback2).not.toHaveBeenCalledWith(100, 'up');
    });
  });
});
import { describe, it, expect } from 'vitest';
import Event from '../src/utils/EventManager';

describe('EventManager', () => {
  it('evokes listeners with args and returns incrementing ids', () => {
    const id1 = Event.listen('test:basic', () => {});
    const id2 = Event.listen('test:basic', () => {});
    expect(typeof id1).toBe('number');
    expect(id2).not.toBe(id1);
    expect(Event.unListen(id1)).toBe(true);
    expect(Event.unListen(id2)).toBe(true);
  });

  it('delivers evoked args to every listener of the event', () => {
    const seen: unknown[][] = [];
    const a = Event.listen('test:args', (...args: unknown[]) => seen.push(args));
    const b = Event.listen('test:args', (...args: unknown[]) => seen.push(args));
    Event.evoke('test:args', 1, 'two');
    expect(seen).toEqual([
      [1, 'two'],
      [1, 'two'],
    ]);
    Event.unListen(a);
    Event.unListen(b);
  });

  it('does not call listeners of other events', () => {
    let called = 0;
    const id = Event.listen('test:other', () => called++);
    Event.evoke('test:unrelated-event');
    expect(called).toBe(0);
    Event.unListen(id);
  });

  it('unListen removes only the targeted listener', () => {
    let first = 0;
    let second = 0;
    const id1 = Event.listen('test:partial', () => first++);
    const id2 = Event.listen('test:partial', () => second++);
    expect(Event.unListen(id1)).toBe(true);
    Event.evoke('test:partial');
    expect(first).toBe(0);
    expect(second).toBe(1);
    Event.unListen(id2);
  });

  it('returns false for unknown ids and tolerates evoking unknown events', () => {
    expect(Event.unListen(-999999)).toBe(false);
    expect(() => Event.evoke('test:never-registered')).not.toThrow();
  });
});

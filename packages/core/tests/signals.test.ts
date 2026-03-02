import { describe, it, expect, vi } from 'vitest';
import { signal, effect, computed, batch, untrack } from '../src/signals.js';

describe('signal()', () => {
  it('holds an initial value', () => {
    expect(signal(42).get()).toBe(42);
  });

  it('updates on set()', () => {
    const s = signal(0);
    s.set(99);
    expect(s.get()).toBe(99);
  });

  it('peek() returns value without tracking', () => {
    const s = signal('hello');
    s.set('world');
    expect(s.peek()).toBe('world');
  });

  it('does not notify when set to same value (Object.is)', () => {
    const s = signal(1);
    const spy = vi.fn();
    effect(() => { s.get(); spy(); });
    spy.mockClear();
    s.set(1);
    expect(spy).not.toHaveBeenCalled();
  });

  it('notifies when set to different value', () => {
    const s = signal(1);
    const spy = vi.fn();
    effect(() => { s.get(); spy(); });
    spy.mockClear();
    s.set(2);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('NaN === NaN via Object.is — no spurious notification', () => {
    const s = signal(NaN);
    const spy = vi.fn();
    effect(() => { s.get(); spy(); });
    spy.mockClear();
    s.set(NaN);
    expect(spy).not.toHaveBeenCalled();
  });

  it('works with complex types', () => {
    const s = signal<{ name: string } | null>(null);
    s.set({ name: 'Alice' });
    expect(s.get()).toEqual({ name: 'Alice' });
  });
});

describe('effect()', () => {
  it('runs immediately on creation', () => {
    const spy = vi.fn();
    effect(spy);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('re-runs when a tracked signal changes', () => {
    const count = signal(0);
    const spy = vi.fn();
    effect(() => { count.get(); spy(); });
    spy.mockClear();
    count.set(1);
    count.set(2);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('does not re-run for untracked signals', () => {
    const a = signal(0);
    const b = signal(0);
    const spy = vi.fn();
    effect(() => { a.get(); spy(); });
    spy.mockClear();
    b.set(99);
    expect(spy).not.toHaveBeenCalled();
  });

  it('updates tracked dependencies dynamically (conditional branches)', () => {
    const condition = signal(true);
    const a = signal('A');
    const b = signal('B');
    const result: string[] = [];

    effect(() => { result.push(condition.get() ? a.get() : b.get()); });
    expect(result).toEqual(['A']);

    b.set('B2');
    expect(result).toEqual(['A']); // b not tracked yet

    condition.set(false);
    expect(result).toEqual(['A', 'B2']); // now tracks b

    a.set('A2');
    expect(result).toEqual(['A', 'B2']); // a no longer tracked

    b.set('B3');
    expect(result).toEqual(['A', 'B2', 'B3']);
  });

  it('runs cleanup before next execution', () => {
    const s = signal(0);
    const cleanupSpy = vi.fn();
    effect(() => { s.get(); return cleanupSpy; });
    expect(cleanupSpy).not.toHaveBeenCalled();
    s.set(1);
    expect(cleanupSpy).toHaveBeenCalledOnce();
    s.set(2);
    expect(cleanupSpy).toHaveBeenCalledTimes(2);
  });

  it('dispose() stops the effect and runs final cleanup', () => {
    const s = signal(0);
    const spy = vi.fn();
    const cleanupSpy = vi.fn();
    const { dispose } = effect(() => { s.get(); spy(); return cleanupSpy; });
    spy.mockClear();
    cleanupSpy.mockClear();
    dispose();
    expect(cleanupSpy).toHaveBeenCalledOnce();
    s.set(1);
    expect(spy).not.toHaveBeenCalled();
  });

  it('dispose() unsubscribes from all tracked signals', () => {
    const a = signal(0);
    const b = signal(0);
    const spy = vi.fn();
    const { dispose } = effect(() => { a.get(); b.get(); spy(); });
    spy.mockClear();
    dispose();
    a.set(1); b.set(1);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('computed()', () => {
  it('derives a value from signals', () => {
    const a = signal(2);
    const b = signal(3);
    expect(computed(() => a.get() + b.get()).get()).toBe(5);
  });

  it('updates when dependencies change', () => {
    const base = signal(10);
    const doubled = computed(() => base.get() * 2);
    base.set(20);
    expect(doubled.get()).toBe(40);
  });

  it('chains correctly (computed from computed)', () => {
    const x = signal(1);
    const doubled = computed(() => x.get() * 2);
    const quad = computed(() => doubled.get() * 2);
    x.set(3);
    expect(quad.get()).toBe(12);
  });

  it('is read-only — has no set() method', () => {
    const c = computed(() => 42);
    expect('set' in c).toBe(false);
  });
});

describe('batch()', () => {
  it('defers effects until end of batch — single render with final values', () => {
    const a = signal(0);
    const b = signal(0);
    const log: string[] = [];
    effect(() => { log.push(`a=${a.get()} b=${b.get()}`); });
    log.length = 0;
    batch(() => { a.set(1); a.set(2); b.set(3); });
    expect(log).toEqual(['a=2 b=3']);
  });

  it('runs each dependent effect exactly once', () => {
    const x = signal(0);
    const y = signal(0);
    const spy = vi.fn();
    effect(() => { x.get(); y.get(); spy(); });
    spy.mockClear();
    batch(() => { x.set(1); y.set(1); x.set(2); });
    expect(spy).toHaveBeenCalledOnce();
  });

  it('flushes only at the outermost nested batch', () => {
    const s = signal(0);
    const spy = vi.fn();
    effect(() => { s.get(); spy(); });
    spy.mockClear();
    batch(() => {
      batch(() => { s.set(1); expect(spy).not.toHaveBeenCalled(); });
      expect(spy).not.toHaveBeenCalled();
      s.set(2);
    });
    expect(spy).toHaveBeenCalledOnce();
    expect(s.get()).toBe(2);
  });
});

describe('untrack()', () => {
  it('reads without creating a subscription', () => {
    const s = signal(0);
    const spy = vi.fn();
    effect(() => { untrack(() => s.get()); spy(); });
    spy.mockClear();
    s.set(99);
    expect(spy).not.toHaveBeenCalled();
  });

  it('can be combined with tracked reads in the same effect', () => {
    const trigger = signal(0);
    const data = signal('initial');
    const log: string[] = [];
    effect(() => {
      trigger.get();
      log.push(untrack(() => data.get()));
    });
    data.set('updated');
    expect(log).toEqual(['initial']); // no re-run yet
    trigger.set(1);
    expect(log).toEqual(['initial', 'updated']);
  });

  it('returns the value from the callback', () => {
    const s = signal(42);
    expect(untrack(() => s.get())).toBe(42);
  });
});

describe('integration', () => {
  it('models a realistic filtered list', () => {
    const items = signal<string[]>([]);
    const filter = signal('');
    const filtered = computed(() => {
      const q = filter.get().toLowerCase();
      return items.get().filter(i => i.toLowerCase().includes(q));
    });
    const renders: string[][] = [];
    effect(() => { renders.push([...filtered.get()]); });

    batch(() => { items.set(['Apple', 'Banana', 'Apricot', 'Cherry']); });
    expect(renders.at(-1)).toEqual(['Apple', 'Banana', 'Apricot', 'Cherry']);

    filter.set('ap');
    expect(renders.at(-1)).toEqual(['Apple', 'Apricot']);

    items.set([...items.peek(), 'Grape']);
    expect(renders.at(-1)).toEqual(['Apple', 'Apricot', 'Grape']);
  });

  it('disposed effects do not leak memory — unsubscribed from all signals', () => {
    const a = signal(0);
    const c = computed(() => a.get() * 2);
    const spy = vi.fn();
    const { dispose } = effect(() => { c.get(); spy(); });
    spy.mockClear();
    dispose();
    a.set(1);
    expect(spy).not.toHaveBeenCalled();
  });
});

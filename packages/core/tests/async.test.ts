/**
 * Tests for asyncSignal()
 *
 * Run in the `node` vitest project (no DOM needed — signals are pure JS).
 * Uses fake timers + manual Promise resolution for deterministic ordering.
 */

import { describe, it, expect } from 'vitest';
import { signal } from '../src/signals.js';
import { asyncSignal } from '../src/async.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve on the next microtask tick so .then() callbacks fire. */
const tick = (): Promise<void> => Promise.resolve();

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('asyncSignal()', () => {
  it('starts with loading=true and data=undefined', () => {
    const { data, loading, error } = asyncSignal(() => new Promise(() => { /* never resolves */ }));
    expect(loading.get()).toBe(true);
    expect(data.get()).toBeUndefined();
    expect(error.get()).toBeUndefined();
  });

  it('starts with loading=false and data=initialValue when initialValue is set', () => {
    const { data, loading } = asyncSignal(
      () => new Promise(() => { /* never resolves */ }),
      { initialValue: 42 },
    );
    expect(data.get()).toBe(42);
    expect(loading.get()).toBe(false);
  });

  it('does not run the fetcher immediately when initialValue is provided (lazy default)', async () => {
    let callCount = 0;
    const { data, loading } = asyncSignal(
      async () => { callCount++; return 99; },
      { initialValue: 42 },
    );
    await tick();
    expect(callCount).toBe(0);
    expect(data.get()).toBe(42);
    expect(loading.get()).toBe(false);
  });

  it('runs the fetcher immediately when lazy: false even with initialValue', async () => {
    let callCount = 0;
    const { data, loading } = asyncSignal(
      async () => { callCount++; return 99; },
      { initialValue: 42, lazy: false },
    );
    await tick();
    expect(callCount).toBe(1);
    expect(data.get()).toBe(99);
    expect(loading.get()).toBe(false);
  });

  it('refetch() triggers a fresh fetch even after a lazy initial skip', async () => {
    let callCount = 0;
    const { data, loading, refetch } = asyncSignal(
      async () => { callCount++; return callCount * 10; },
      { initialValue: 0 },
    );
    await tick();
    expect(callCount).toBe(0); // skipped

    refetch();
    expect(loading.get()).toBe(true);
    await tick();
    expect(callCount).toBe(1);
    expect(data.get()).toBe(10);
    expect(loading.get()).toBe(false);
  });

  it('sets data and clears loading on success', async () => {
    const { data, loading, error } = asyncSignal(() => Promise.resolve('hello'));
    await tick();
    expect(data.get()).toBe('hello');
    expect(loading.get()).toBe(false);
    expect(error.get()).toBeUndefined();
  });

  it('sets error and clears loading on rejection', async () => {
    const { data, loading, error } = asyncSignal(() => Promise.reject(new Error('oops')));
    await tick();
    expect(error.get()).toBeInstanceOf(Error);
    expect((error.get() as Error).message).toBe('oops');
    expect(loading.get()).toBe(false);
    expect(data.get()).toBeUndefined();
  });

  it('converts non-Error rejections to Error', async () => {
    const { error } = asyncSignal(() => Promise.reject('string rejection'));
    await tick();
    expect(error.get()).toBeInstanceOf(Error);
    expect((error.get() as Error).message).toBe('string rejection');
  });

  it('re-runs the fetcher when a tracked signal changes', async () => {
    const id = signal(1);
    let callCount = 0;

    const { data, loading } = asyncSignal(async () => {
      callCount++;
      return id.get() * 10;
    });

    await tick();
    expect(data.get()).toBe(10);
    expect(callCount).toBe(1);

    id.set(2);       // triggers effect re-run
    await tick();
    expect(data.get()).toBe(20);
    expect(callCount).toBe(2);
    expect(loading.get()).toBe(false);
  });

  it('discards stale results when a newer fetch supersedes', async () => {
    const id = signal(1);

    // Controlled promises — resolve in reverse order to simulate race
    let resolveFirst!: (v: number) => void;
    let resolveSecond!: (v: number) => void;
    const first  = new Promise<number>(r => { resolveFirst  = r; });
    const second = new Promise<number>(r => { resolveSecond = r; });
    const fetchers = [first, second];
    let call = 0;

    const { data } = asyncSignal(() => {
      void id.get(); // track id
      return fetchers[call++]!;
    });

    // Trigger second fetch before first resolves
    id.set(2);

    // Resolve the *first* (stale) fetch — should be ignored
    resolveFirst(1);
    await tick();
    expect(data.get()).toBeUndefined(); // first result discarded

    // Resolve the *second* (current) fetch
    resolveSecond(2);
    await tick();
    expect(data.get()).toBe(2); // second result applied
  });

  it('refetch() triggers a fresh fetch without changing signal dependencies', async () => {
    let callCount = 0;
    const { data, loading, refetch } = asyncSignal(async () => {
      callCount++;
      return callCount;
    });

    await tick();
    expect(data.get()).toBe(1);
    expect(callCount).toBe(1);

    refetch();
    expect(loading.get()).toBe(true);
    await tick();
    expect(data.get()).toBe(2);
    expect(callCount).toBe(2);
  });

  it('refetch() sets loading=true and clears error before re-fetching', async () => {
    let fail = true;
    const { loading, error, refetch } = asyncSignal(() =>
      fail ? Promise.reject(new Error('fail')) : Promise.resolve('ok'),
    );

    await tick();
    expect(error.get()).toBeInstanceOf(Error);

    fail = false;
    refetch();
    expect(loading.get()).toBe(true);
    expect(error.get()).toBeUndefined(); // cleared immediately on refetch
    await tick();
    expect(loading.get()).toBe(false);
    expect(error.get()).toBeUndefined();
  });
});

/**
 * @nativeframe/core - async.ts
 *
 * Reactive async data-fetching helper.
 *
 * asyncSignal(fetcher, options?) wraps a Promise-returning function
 * in three signals — data, loading, error — and automatically
 * re-runs the fetcher whenever its reactive dependencies change
 * (the fetcher itself is run inside an effect).
 *
 * When called inside a component render the effect is lifecycle-bound
 * to that component via getCurrentScope() and is disposed on
 * disconnectedCallback. When called outside a component it uses the
 * global effect() and lives for the lifetime of the page.
 *
 * A version counter prevents stale responses from overwriting newer
 * results when the fetcher is triggered multiple times in quick succession.
 */

import { signal } from './signals.js';
import { effect } from './signals.js';
import type { Signal } from './signals.js';
import { getCurrentScope } from './html.js';

// ─── Public types ─────────────────────────────────────────────────────────────

/**
 * The reactive state object returned by asyncSignal().
 */
export interface AsyncState<T> {
  /** The last successfully resolved value, or `initialValue` / `undefined`. */
  readonly data: Signal<T | undefined>;
  /** `true` while the most recent fetch is in flight. */
  readonly loading: Signal<boolean>;
  /** The last rejection turned into an `Error`, or `undefined` on success. */
  readonly error: Signal<Error | undefined>;
  /** Manually trigger a fresh fetch (ignores reactive dependencies). */
  refetch(): void;
}

/**
 * Options for asyncSignal().
 */
export interface AsyncSignalOptions<T> {
  /**
   * Value held by `data` before the first fetch resolves.
   * Defaults to `undefined`.
   */
  readonly initialValue?: T;

  /**
   * When `true`, the fetcher is not called on the initial render.
   * `refetch()` and reactive dep changes (after the first manual fetch) still work.
   *
   * Defaults to `true` when `initialValue` is provided, `false` otherwise.
   * Set explicitly to `false` to force an immediate fetch even with `initialValue`.
   */
  readonly lazy?: boolean;
}

// ─── Implementation ───────────────────────────────────────────────────────────

/**
 * Create a reactive async data source.
 *
 * The `fetcher` is called inside an `effect`, so any signals read
 * inside it are tracked — the fetch automatically re-runs whenever
 * its dependencies change.
 *
 * @param fetcher  A function that returns a Promise. May read signals.
 * @param options  Optional configuration (see AsyncSignalOptions).
 *
 * @example
 * const { data, loading, error } = asyncSignal(() =>
 *   fetch(`/api/users/${userId.get()}`).then(r => r.json())
 * );
 *
 * html`
 *   ${() => loading.get() ? html`<p>Loading…</p>` : html`<p>${() => data.get()?.name}</p>`}
 * `
 */
export function asyncSignal<T>(
  fetcher: () => Promise<T>,
  options: AsyncSignalOptions<T> = {},
): AsyncState<T> {
  const hasInitial = options.initialValue !== undefined;
  const _data    = signal<T | undefined>(options.initialValue);
  const _loading = signal<boolean>(!hasInitial);
  const _error   = signal<Error | undefined>(undefined);

  // Version counter — each run() increments it; the .then()/.catch()
  // callback only applies its result when version still matches.
  let version = 0;

  // lazy: skip the initial effect invocation when we already have data.
  // After the first skip, reactive dep changes or refetch() run normally.
  let skipFirst = options.lazy ?? hasInitial;

  const run = (): void => {
    if (skipFirst) {
      skipFirst = false;
      return;
    }
    const thisVersion = ++version;
    _loading.set(true);
    _error.set(undefined);

    fetcher().then(
      (result) => {
        if (thisVersion !== version) return; // stale — discard
        _data.set(result);
        _loading.set(false);
      },
      (err: unknown) => {
        if (thisVersion !== version) return; // stale — discard
        _error.set(err instanceof Error ? err : new Error(String(err)));
        _loading.set(false);
      },
    );
  };

  // Route through the component's scoped effect registrar when available,
  // so the effect is disposed on disconnectedCallback.
  const registrar = getCurrentScope() ?? effect;
  registrar(run);

  return {
    data: _data,
    loading: _loading,
    error: _error,
    refetch: run,
  };
}

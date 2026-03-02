/**
 * @nativedom/store - index.ts
 *
 * Cross-component reactive store built entirely on signals.
 * Fully typed — store shape is inferred automatically from the initial state.
 * No Provider. No Context. No magic.
 */

import {
  signal,
  computed,
  batch,
  type Signal,
  type Computed,
} from "@nativedom/core";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Maps each key of T to a Signal of that key's value type.
 *
 * @example
 * SignalMap<{ count: number; name: string }>
 * → { count: Signal<number>; name: Signal<string> }
 */
export type SignalMap<T extends Record<string, unknown>> = {
  readonly [K in keyof T]: Signal<T[K]>;
};

/**
 * A NativeFrame store — a SignalMap extended with utility methods.
 */
export type Store<T extends Record<string, unknown>> = SignalMap<T> & {
  /**
   * Derive a computed value from the store's signals.
   * The result is a read-only reactive signal that updates automatically.
   *
   * @example
   * const isLoggedIn = store.derive(s => s.user.get() !== null);
   * isLoggedIn.get(); // boolean — reactive
   */
  derive<R>(fn: (signals: SignalMap<T>) => R): Computed<R>;

  /**
   * Update multiple keys atomically — all effects fire once, not per key.
   *
   * @example
   * store.update({ theme: 'light', user: null });
   */
  update(patch: Partial<T>): void;

  /**
   * Snapshot the store as a plain object.
   * Useful for SSR — serialize with JSON.stringify and embed in HTML.
   *
   * @example
   * const snap = store.snapshot();
   * // → <script>window.__STORE__ = ${JSON.stringify(snap)}</script>
   */
  snapshot(): T;

  /**
   * Rehydrate the store from a serialized snapshot.
   * Call this on the client after reading `window.__STORE__`.
   *
   * @example
   * store.rehydrate(window.__STORE__);
   */
  rehydrate(snapshot: Partial<T>): void;
};

// ─── createStore() ────────────────────────────────────────────────────────────

/**
 * Creates a reactive store from a plain initial state object.
 * Each top-level key is automatically converted into a typed Signal.
 *
 * The store type is fully inferred — no manual type annotation needed.
 *
 * @example
 * const store = createStore({
 *   user: null as User | null,
 *   theme: 'dark' as 'dark' | 'light',
 *   notifications: 0,
 * });
 *
 * // Types are inferred:
 * store.user.get();             // User | null
 * store.theme.set('light');     // ✅
 * store.theme.set('purple');    // ❌ Type error
 *
 * // Atomic update:
 * store.update({ theme: 'light', notifications: 3 });
 *
 * // Derived state:
 * const isLoggedIn = store.derive(s => s.user.get() !== null);
 */
export function createStore<T extends Record<string, unknown>>(
  initialState: T,
): Store<T> {
  // Create a signal for each top-level key, preserving the exact value type
  const signals = {} as Record<string, Signal<unknown>>;

  for (const key of Object.keys(initialState) as Array<keyof T & string>) {
    signals[key] = signal(initialState[key]);
  }

  // Cast to the correctly typed SignalMap
  const typedSignals = signals as unknown as SignalMap<T>;

  const store: Store<T> = {
    ...typedSignals,

    derive<R>(fn: (signals: SignalMap<T>) => R): Computed<R> {
      return computed(() => fn(typedSignals));
    },

    update(patch: Partial<T>): void {
      batch(() => {
        for (const key of Object.keys(patch) as Array<keyof T & string>) {
          const value = patch[key];
          if (value !== undefined && key in signals) {
            (signals[key] as Signal<T[typeof key]>).set(value as T[typeof key]);
          }
        }
      });
    },

    snapshot(): T {
      const snap = {} as T;
      for (const key of Object.keys(signals) as Array<keyof T & string>) {
        snap[key] = (signals[key] as Signal<T[typeof key]>).peek();
      }
      return snap;
    },

    rehydrate(snapshot: Partial<T>): void {
      batch(() => {
        for (const key of Object.keys(snapshot) as Array<keyof T & string>) {
          const value = snapshot[key];
          if (value !== undefined && key in signals) {
            (signals[key] as Signal<T[typeof key]>).set(value as T[typeof key]);
          }
        }
      });
    },
  };

  return store;
}

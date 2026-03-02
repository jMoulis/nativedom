import { Signal, Computed } from '@nativedom/core';

/**
 * @nativedom/store - index.ts
 *
 * Cross-component reactive store built entirely on signals.
 * Fully typed — store shape is inferred automatically from the initial state.
 * No Provider. No Context. No magic.
 */

/**
 * Maps each key of T to a Signal of that key's value type.
 *
 * @example
 * SignalMap<{ count: number; name: string }>
 * → { count: Signal<number>; name: Signal<string> }
 */
type SignalMap<T extends Record<string, unknown>> = {
    readonly [K in keyof T]: Signal<T[K]>;
};
/**
 * A NativeFrame store — a SignalMap extended with utility methods.
 */
type Store<T extends Record<string, unknown>> = SignalMap<T> & {
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
declare function createStore<T extends Record<string, unknown>>(initialState: T): Store<T>;

export { type SignalMap, type Store, createStore };

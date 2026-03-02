/**
 * @nativeframe/core - signals.ts
 *
 * Fine-grained reactivity without any Virtual DOM.
 * Zero dependencies. Pure TypeScript.
 */

// ─── Public types ─────────────────────────────────────────────────────────────

/**
 * A reactive container for a value of type T.
 * Reading inside an effect automatically subscribes to changes.
 */
export interface Signal<T> {
  /** Read the value and register the current effect as a subscriber. */
  get(): T;
  /** Write a new value and notify all subscribers. */
  set(value: T): void;
  /** Read the value WITHOUT registering as a subscriber. */
  peek(): T;
}

/**
 * A read-only derived signal. Recomputes only when its dependencies change.
 */
export interface Computed<T> {
  get(): T;
  peek(): T;
}

/**
 * Handle returned by `effect()`. Call `dispose()` to stop the effect
 * and unsubscribe from all signals it was tracking.
 */
export interface EffectHandle {
  dispose(): void;
}

/**
 * An effect function. May return a cleanup function that runs
 * before the next execution or on dispose.
 */
export type EffectFn = () => void | (() => void);

// ─── Internal types ───────────────────────────────────────────────────────────

/** An internal effect node in the dependency graph. */
interface InternalEffect {
  (): void;
  /** Set of subscriber lists this effect is currently registered in. */
  deps: Set<Set<InternalEffect>>;
}

// ─── Tracking context ─────────────────────────────────────────────────────────

let currentEffect: InternalEffect | null = null;
let batchDepth = 0;
const pendingEffects = new Set<InternalEffect>();

// ─── signal() ─────────────────────────────────────────────────────────────────

/**
 * Creates a reactive signal — the fundamental unit of state.
 *
 * @example
 * const count = signal(0);
 * count.get();     // 0 — tracked if inside an effect
 * count.set(1);    // notifies subscribers
 * count.peek();    // 1 — untracked read
 *
 * const user = signal<User | null>(null);
 * user.set({ name: 'Alice' }); // ✅
 * user.set(42);                // ❌ Type error
 */
export function signal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const subscribers = new Set<InternalEffect>();

  return {
    get(): T {
      if (currentEffect !== null) {
        subscribers.add(currentEffect);
        currentEffect.deps.add(subscribers);
      }
      return value;
    },

    set(newValue: T): void {
      console.log(newValue);
      if (Object.is(value, newValue)) return;
      value = newValue;
      notify(subscribers);
    },

    peek(): T {
      return value;
    },
  };
}

// ─── effect() ─────────────────────────────────────────────────────────────────

/**
 * Creates a reactive side-effect.
 * Automatically tracks signal reads and re-runs when any dependency changes.
 * Returns a handle to manually stop and clean up the effect.
 *
 * @example
 * const name = signal('Alice');
 *
 * const { dispose } = effect(() => {
 *   document.title = name.get(); // auto-tracked
 *   return () => console.log('cleanup'); // optional cleanup
 * });
 *
 * name.set('Bob'); // → effect re-runs
 * dispose();       // → stops the effect, runs cleanup
 */
export function effect(fn: EffectFn): EffectHandle {
  let cleanup: (() => void) | null = null;

  const effectFn: InternalEffect = () => {
    // 1. Unsubscribe from previous dependencies
    internalDispose();

    // 2. Register as current tracking context
    const prev = currentEffect;
    currentEffect = effectFn;
    effectFn.deps = new Set();

    try {
      const result = fn();
      if (typeof result === "function") {
        cleanup = result;
      }
    } finally {
      currentEffect = prev;
    }
  };

  effectFn.deps = new Set<Set<InternalEffect>>();

  function internalDispose(): void {
    if (cleanup !== null) {
      cleanup();
      cleanup = null;
    }
    effectFn.deps.forEach((subs) => {
      subs.delete(effectFn);
    });
    effectFn.deps.clear();
  }

  // Initial run — collects dependencies
  effectFn();

  return {
    dispose(): void {
      internalDispose();
    },
  };
}

// ─── computed() ───────────────────────────────────────────────────────────────

/**
 * Creates a derived, read-only signal.
 * Lazily memoized — recomputes only when its signal dependencies change.
 *
 * @example
 * const firstName = signal('Alice');
 * const lastName  = signal('Smith');
 * const fullName  = computed(() => `${firstName.get()} ${lastName.get()}`);
 *
 * fullName.get(); // 'Alice Smith'
 * lastName.set('Jones');
 * fullName.get(); // 'Alice Jones' — recomputed
 */
export function computed<T>(fn: () => T): Computed<T> {
  const s = signal<T>(untrack(fn)); // init without polluting the outer tracking context

  // Re-run fn whenever dependencies change, push result into internal signal
  effect(() => {
    s.set(fn());
  });

  return {
    get: (): T => s.get(),
    peek: (): T => s.peek(),
  };
}

// ─── batch() ──────────────────────────────────────────────────────────────────

/**
 * Groups multiple signal updates into a single notification pass.
 * Prevents intermediate renders when updating several signals at once.
 *
 * @example
 * batch(() => {
 *   x.set(1);
 *   y.set(2);
 *   z.set(3);
 * });
 * // → all effects that depend on x, y, or z run once — not three times
 */
export function batch(fn: () => void): void {
  batchDepth++;
  try {
    fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      const toRun = new Set(pendingEffects);
      pendingEffects.clear();
      toRun.forEach((e) => {
        e();
      });
    }
  }
}

// ─── untrack() ────────────────────────────────────────────────────────────────

/**
 * Reads signals inside `fn` without registering any subscriptions.
 * Useful to access current values inside effects without creating dependencies.
 *
 * @example
 * effect(() => {
 *   trigger.get(); // tracked — effect re-runs when trigger changes
 *   const snap = untrack(() => expensiveSignal.get()); // NOT tracked
 * });
 */
export function untrack<T>(fn: () => T): T {
  const prev = currentEffect;
  currentEffect = null;
  try {
    return fn();
  } finally {
    currentEffect = prev;
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function notify(subscribers: Set<InternalEffect>): void {
  if (subscribers.size === 0) return;

  if (batchDepth > 0) {
    subscribers.forEach((e) => {
      pendingEffects.add(e);
    });
  } else {
    // Copy before iterating — a subscriber may modify the set during notification
    [...subscribers].forEach((e) => {
      e();
    });
  }
}

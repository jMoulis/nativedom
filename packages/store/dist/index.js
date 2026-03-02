// src/index.ts
import {
  signal,
  computed,
  batch
} from "@nativeframe/core";
function createStore(initialState) {
  const signals = {};
  for (const key of Object.keys(initialState)) {
    signals[key] = signal(initialState[key]);
  }
  const typedSignals = signals;
  const store = {
    ...typedSignals,
    derive(fn) {
      return computed(() => fn(typedSignals));
    },
    update(patch) {
      batch(() => {
        for (const key of Object.keys(patch)) {
          const value = patch[key];
          if (value !== void 0 && key in signals) {
            signals[key].set(value);
          }
        }
      });
    },
    snapshot() {
      const snap = {};
      for (const key of Object.keys(signals)) {
        snap[key] = signals[key].peek();
      }
      return snap;
    },
    rehydrate(snapshot) {
      batch(() => {
        for (const key of Object.keys(snapshot)) {
          const value = snapshot[key];
          if (value !== void 0 && key in signals) {
            signals[key].set(value);
          }
        }
      });
    }
  };
  return store;
}
export {
  createStore
};
//# sourceMappingURL=index.js.map
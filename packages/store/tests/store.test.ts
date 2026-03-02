import { describe, it, expect, vi } from "vitest";
import { createStore } from "../src/index.js";
import { effect } from "@nativedom/core";

describe("createStore()", () => {
  it("exposes each key as a signal", () => {
    const store = createStore({ count: 0, name: "Alice" });
    expect(store.count.get()).toBe(0);
    expect(store.name.get()).toBe("Alice");
  });

  it("signals are reactive — effects re-run on change", () => {
    const store = createStore({ value: 1 });
    const spy = vi.fn();
    effect(() => {
      store.value.get();
      spy();
    });
    spy.mockClear();
    store.value.set(2);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("update() changes multiple keys atomically", () => {
    const store = createStore({ x: 0, y: 0, z: 0 });
    const spy = vi.fn();
    effect(() => {
      store.x.get();
      store.y.get();
      store.z.get();
      spy();
    });
    spy.mockClear();
    store.update({ x: 1, y: 2, z: 3 });
    expect(spy).toHaveBeenCalledOnce(); // batched — one render
    expect(store.x.get()).toBe(1);
    expect(store.y.get()).toBe(2);
    expect(store.z.get()).toBe(3);
  });

  it("update() ignores unknown keys", () => {
    const store = createStore({ count: 0 });
    expect(() => store.update({ count: 5 })).not.toThrow();
    expect(store.count.get()).toBe(5);
  });

  it("derive() creates a reactive computed from the store", () => {
    const store = createStore({ user: null as { name: string } | null });
    const isLoggedIn = store.derive((s) => s.user.get() !== null);
    expect(isLoggedIn.get()).toBe(false);
    store.user.set({ name: "Alice" });
    expect(isLoggedIn.get()).toBe(true);
  });

  it("derive() with multiple signals", () => {
    const store = createStore({ firstName: "Alice", lastName: "Smith" });
    const fullName = store.derive(
      (s) => `${s.firstName.get()} ${s.lastName.get()}`,
    );
    expect(fullName.get()).toBe("Alice Smith");
    store.lastName.set("Jones");
    expect(fullName.get()).toBe("Alice Jones");
  });

  it("snapshot() returns a plain object of current values", () => {
    const store = createStore({ count: 5, theme: "dark" as "dark" | "light" });
    const snap = store.snapshot();
    expect(snap).toEqual({ count: 5, theme: "dark" });
    expect(typeof snap.count).toBe("number");
  });

  it("snapshot() is not reactive — returns values at call time", () => {
    const store = createStore({ count: 0 });
    const snap = store.snapshot();
    store.count.set(99);
    expect(snap.count).toBe(0); // snapshot was taken before the update
  });

  it("rehydrate() restores store state from a snapshot", () => {
    const store = createStore({ count: 0, theme: "dark" as "dark" | "light" });
    store.rehydrate({ count: 42, theme: "light" });
    expect(store.count.get()).toBe(42);
    expect(store.theme.get()).toBe("light");
  });

  it("rehydrate() is batched — effects run once", () => {
    const store = createStore({ a: 0, b: 0, c: 0 });
    const spy = vi.fn();
    effect(() => {
      store.a.get();
      store.b.get();
      store.c.get();
      spy();
    });
    spy.mockClear();
    store.rehydrate({ a: 1, b: 2, c: 3 });
    expect(spy).toHaveBeenCalledOnce();
  });

  it("snapshot → rehydrate round-trip preserves values", () => {
    const original = createStore({ score: 100, player: "Bob", active: true });
    const snap = original.snapshot();
    const restored = createStore({ score: 0, player: "", active: false });
    restored.rehydrate(snap);
    expect(restored.score.get()).toBe(100);
    expect(restored.player.get()).toBe("Bob");
    expect(restored.active.get()).toBe(true);
  });
});

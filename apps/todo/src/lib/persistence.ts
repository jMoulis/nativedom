import { effect } from "@nativedom/core";
import { todoStore } from "../stores/todo-store.js";
import type { Todo } from "../types.js";

const KEY = "nf-todos";

export function loadFromStorage(): void {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = JSON.parse(raw ?? "null") as Todo[] | null;
    todoStore.todos.set(parsed ?? []);
  } catch {
    // ignore corrupt data
  }
}

export function setupPersistence(): void {
  effect(() => {
    localStorage.setItem(KEY, JSON.stringify(todoStore.todos.get()));
  });
}

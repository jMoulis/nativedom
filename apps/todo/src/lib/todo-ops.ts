import { todoStore } from "../stores/todo-store.js";
import { uiStore } from "../stores/ui-store.js";

export function addTodo(text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  todoStore.todos.set([
    ...todoStore.todos.get(),
    { id: crypto.randomUUID(), text: trimmed, done: false },
  ]);
}

export function deleteTodo(id: string): void {
  todoStore.todos.set(todoStore.todos.get().filter(t => t.id !== id));
}

export function toggleTodo(id: string): void {
  todoStore.todos.set(
    todoStore.todos.get().map(t => t.id === id ? { ...t, done: !t.done } : t),
  );
}

export function saveTodo(id: string, text: string): void {
  const trimmed = text.trim();
  if (!trimmed) {
    deleteTodo(id);
  } else {
    todoStore.todos.set(
      todoStore.todos.get().map(t => t.id === id ? { ...t, text: trimmed } : t),
    );
  }
  uiStore.editingId.set(null);
}

export function toggleAll(): void {
  const todos = todoStore.todos.get();
  const allDone = todos.length > 0 && todos.every(t => t.done);
  todoStore.todos.set(todos.map(t => ({ ...t, done: !allDone })));
}

export function clearCompleted(): void {
  todoStore.todos.set(todoStore.todos.get().filter(t => !t.done));
}

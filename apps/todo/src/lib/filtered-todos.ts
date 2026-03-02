import { computed } from "@nativeframe/core";
import { todoStore } from "../stores/todo-store.js";
import { uiStore } from "../stores/ui-store.js";

export const filteredTodos = computed(() => {
  const all = todoStore.todos.get();
  const f = uiStore.filter.get();
  if (f === "active") return all.filter(t => !t.done);
  if (f === "done") return all.filter(t => t.done);
  return all;
});

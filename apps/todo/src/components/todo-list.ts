import { component, repeat } from "@nativedom/core";
import { filteredTodos } from "../lib/filtered-todos.js";
import { TodoItem } from "./todo-item.js";

export const TodoList = component("todo-list", (_, { html }) => {
  return html`
    <ul class="todo-list">
      ${repeat(
        () => filteredTodos.get(),
        t => t.id,
        t => TodoItem({ "todo-id": t.id }),
      )}
    </ul>
  `;
});

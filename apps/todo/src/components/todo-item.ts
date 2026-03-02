import { component, computed } from "@nativedom/core";
import { todoStore } from "../stores/todo-store.js";
import { uiStore } from "../stores/ui-store.js";
import { toggleTodo, deleteTodo, saveTodo } from "../lib/todo-ops.js";

let dragSourceId: string | null = null;

export const TodoItem = component<{ "todo-id": string }>("todo-item", (props, { html }) => {
  const todoId = props["todo-id"] ?? "";

  const todo = computed(() => todoStore.todos.get().find(t => t.id === todoId));
  const isEditing = computed(() => uiStore.editingId.get() === todoId);

  return html`
    <style>
      :host { display: block; }
      li {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 8px;
        border-bottom: 1px solid #f0f0f0;
        list-style: none;
        cursor: grab;
      }
      li:active { cursor: grabbing; }
      li[data-done="true"] .text { text-decoration: line-through; color: #aaa; }
      li[data-editing="true"] .text { display: none; }
      li[data-editing="false"] .edit { display: none; }
      .toggle {
        cursor: pointer;
        background: none;
        border: none;
        font-size: 1.2rem;
        padding: 0 4px;
        flex-shrink: 0;
      }
      .text {
        flex: 1;
        font-size: 1rem;
        word-break: break-word;
        user-select: none;
      }
      .edit {
        flex: 1;
        font-size: 1rem;
        padding: 2px 6px;
        border: 1px solid #5c6bc0;
        border-radius: 3px;
        outline: none;
      }
      .delete {
        cursor: pointer;
        background: none;
        border: none;
        color: #e53935;
        font-size: 1rem;
        padding: 0 4px;
        flex-shrink: 0;
        opacity: 0;
        transition: opacity 0.15s;
      }
      li:hover .delete { opacity: 1; }
    </style>
    <li
      data-done="${() => String(todo.get()?.done ?? false)}"
      data-editing="${() => String(isEditing.get())}"
      draggable="true"
      @dragstart=${(e: Event) => {
        dragSourceId = todoId;
        (e as DragEvent).dataTransfer?.setData("text/plain", todoId);
      }}
      @dragover=${(e: Event) => {
        e.preventDefault();
      }}
      @drop=${(e: Event) => {
        e.preventDefault();
        if (dragSourceId === null || dragSourceId === todoId) return;
        const todos = todoStore.todos.get();
        const sourceIdx = todos.findIndex(t => t.id === dragSourceId);
        const targetIdx = todos.findIndex(t => t.id === todoId);
        if (sourceIdx === -1 || targetIdx === -1) return;
        const next = [...todos];
        const [moved] = next.splice(sourceIdx, 1);
        if (moved !== undefined) next.splice(targetIdx, 0, moved);
        todoStore.todos.set(next);
        dragSourceId = null;
      }}
    >
      <button
        class="toggle"
        @click=${() => { toggleTodo(todoId); }}
      >${() => todo.get()?.done ? "✓" : "○"}</button>
      <span
        class="text"
        @dblclick=${(e: Event) => {
          uiStore.editingId.set(todoId);
          const root = (e.target as Element).getRootNode() as ShadowRoot | Document;
          const input = root.querySelector(".edit") as HTMLInputElement | null;
          if (input !== null) {
            requestAnimationFrame(() => { input.focus(); });
          }
        }}
      >${() => todo.get()?.text ?? ""}</span>
      <input
        class="edit"
        type="text"
        .value="${() => todo.get()?.text ?? ""}"
        @keydown=${(e: Event) => {
          const ke = e as KeyboardEvent;
          const input = e.target as HTMLInputElement;
          if (ke.key === "Enter") {
            saveTodo(todoId, input.value);
          } else if (ke.key === "Escape") {
            uiStore.editingId.set(null);
            input.blur();
          }
        }}
        @blur=${(e: Event) => {
          if (isEditing.get()) {
            saveTodo(todoId, (e.target as HTMLInputElement).value);
          }
        }}
      />
      <button
        class="delete"
        @click=${() => { deleteTodo(todoId); }}
      >✕</button>
    </li>
  `;
}, { observedAttrs: ["todo-id"] });

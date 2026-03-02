import { component } from "@nativeframe/core";
import { todoStore } from "../stores/todo-store.js";
import { uiStore } from "../stores/ui-store.js";
import { toggleAll, clearCompleted } from "../lib/todo-ops.js";

export const TodoFooter = component("todo-footer", (_, { html, computed }) => {
  const activeCount = computed(() => todoStore.todos.get().filter(t => !t.done).length);
  const hasCompleted = computed(() => todoStore.todos.get().some(t => t.done));
  const hasTodos = computed(() => todoStore.todos.get().length > 0);

  return html`
    <style>
      :host { display: block; }
      footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
        padding: 10px 8px;
        border-top: 1px solid #e0e0e0;
        font-size: 0.9rem;
        color: #555;
      }
      footer[data-visible="false"] { display: none; }
      .count { min-width: 6ch; }
      .filters { display: flex; gap: 4px; }
      .filters button {
        padding: 3px 10px;
        border: 1px solid transparent;
        border-radius: 3px;
        background: none;
        cursor: pointer;
        font-size: 0.85rem;
        color: inherit;
      }
      .filters button:hover { border-color: #ccc; }
      .filters button[data-active="true"] {
        border-color: #5c6bc0;
        color: #3f51b5;
        font-weight: 600;
      }
      .actions { display: flex; gap: 8px; }
      .actions button {
        padding: 3px 10px;
        border: 1px solid #ccc;
        border-radius: 3px;
        background: none;
        cursor: pointer;
        font-size: 0.85rem;
        color: inherit;
      }
      .actions button:hover { background: #f5f5f5; }
      .actions button[data-visible="false"] { display: none; }
    </style>
    <footer data-visible="${() => hasTodos.get() ? 'true' : 'false'}">
      <span class="count">${() => activeCount.get()} item${() => activeCount.get() === 1 ? '' : 's'} left</span>
      <div class="filters">
        <button
          data-active="${() => uiStore.filter.get() === 'all' ? 'true' : 'false'}"
          @click=${() => { uiStore.filter.set("all"); }}
        >All</button>
        <button
          data-active="${() => uiStore.filter.get() === 'active' ? 'true' : 'false'}"
          @click=${() => { uiStore.filter.set("active"); }}
        >Active</button>
        <button
          data-active="${() => uiStore.filter.get() === 'done' ? 'true' : 'false'}"
          @click=${() => { uiStore.filter.set("done"); }}
        >Done</button>
      </div>
      <div class="actions">
        <button @click=${() => { toggleAll(); }}>Mark all ✓</button>
        <button
          data-visible="${() => hasCompleted.get() ? 'true' : 'false'}"
          @click=${() => { clearCompleted(); }}
        >Clear completed</button>
      </div>
    </footer>
  `;
});

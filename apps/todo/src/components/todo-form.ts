import { component } from "@nativedom/core";
import { addTodo } from "../lib/todo-ops.js";

export const TodoForm = component("todo-form", (_, { html }) => {
  return html`
    <style>
      :host { display: block; }
      form {
        display: flex;
        gap: 8px;
        padding: 12px 0;
        border-bottom: 1px solid #e0e0e0;
      }
      input {
        flex: 1;
        padding: 8px 12px;
        font-size: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        outline: none;
      }
      input:focus { border-color: #5c6bc0; }
      button {
        padding: 8px 16px;
        font-size: 1rem;
        background: #5c6bc0;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      button:hover { background: #3f51b5; }
    </style>
    <form
      @submit=${(e: Event) => {
        e.preventDefault();
        const input = (e.target as HTMLFormElement).querySelector("input") as HTMLInputElement;
        const text = input.value.trim();
        if (text) {
          addTodo(text);
          input.value = "";
        }
      }}
    >
      <input type="text" placeholder="What needs to be done?" autofocus />
      <button type="submit">Add</button>
    </form>
  `;
});

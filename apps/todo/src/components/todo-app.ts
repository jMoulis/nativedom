import { component, ssrRender } from "@nativeframe/core";

export const TodoApp = component("todo-app", () => `
  <style>
    .todo-app {
      font-family: system-ui, sans-serif;
      max-width: 560px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    h1 {
      text-align: center;
      font-size: 2.5rem;
      font-weight: 300;
      color: #5c6bc0;
      margin-bottom: 1rem;
      letter-spacing: 0.05em;
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.12);
      overflow: hidden;
    }
  </style>
  <section class="todo-app">
    <h1>todos</h1>
    <div class="card">
      ${ssrRender("todo-form", {})}
      ${ssrRender("todo-list", {})}
      ${ssrRender("todo-footer", {})}
    </div>
  </section>
`, { shadow: false });

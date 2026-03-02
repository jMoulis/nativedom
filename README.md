# NativeDOM (Fully AI generated)

A lightweight, isomorphic Web Components framework with fine-grained reactivity. Build interactive UIs using native browser primitives — no virtual DOM, no magic, just signals and standard Custom Elements.

## Features

- **Fine-grained signals** — reactive primitives with zero overhead on untouched nodes
- **Isomorphic components** — the same component definition works on server (SSR) and client
- **`html` tagged templates** — ergonomic DOM bindings with a minimal syntax
- **Scoped CSS** — per-component styles via `@scope` or Shadow DOM
- **Signal-backed router** — client-side SPA routing with reactive params
- **Reactive global store** — snapshot/rehydrate for SSR hydration
- **Async signals** — race-condition-safe data fetching, lifecycle-bound
- **Error boundaries** — per-component `onError` fallback rendering

---

## Packages

| Package                                | Version | Description                                 |
| -------------------------------------- | ------- | ------------------------------------------- |
| [`@nativedom/core`](packages/core)     | 0.1.0   | Signals, components, `html` template engine |
| [`@nativedom/store`](packages/store)   | 0.1.0   | Reactive global store with SSR snapshot     |
| [`@nativedom/router`](packages/router) | 0.1.0   | Signal-backed client-side router            |
| [`@nativedom/server`](packages/server) | 0.1.0   | Server-side rendering & streaming           |

---

## Getting Started

```bash
npm install @nativedom/core
```

### Basic component

```ts
import { component, signal, html } from '@nativedom/core';

component('my-counter', (ctx) => {
  const count = signal(0);

  return html`
    <p>Count: ${() => count.get()}</p>
    <button @click=${() => count.set(count.get() + 1)}>Increment</button>
  `;
});
```

```html
<my-counter></my-counter>
```

---

## Core API

### Signals

```ts
import { signal, computed, effect, batch, untrack } from '@nativedom/core';

const name = signal('Alice');
const greeting = computed(() => `Hello, ${name.get()}`);

effect(() => console.log(greeting.get())); // runs when greeting changes

batch(() => {
  name.set('Bob'); // batched — effect fires once
});

untrack(() => name.get()); // read without tracking
```

### `component(name, fn, options?)`

```ts
component('my-element', (ctx) => {
  // ctx.prop(name, defaultValue) — reactive attribute/property
  const label = ctx.prop<string>('label', 'default');

  // ctx.effect(() => ...) — scoped effect, disposed on disconnect
  ctx.effect(() => console.log(label.get()));

  // ctx.watch(getter, callback) — fires on change, not on init
  ctx.watch(() => label.get(), (next, prev) => console.log(next, prev));

  return html`<span>${() => label.get()}</span>`;
}, {
  shadow: false,          // use light DOM (default: false)
  styles: `p { color: red }`, // scoped CSS
  onError: (err) => html`<p>Error: ${err.message}</p>`,
});
```

### `html` template syntax

| Syntax                              | Purpose                                        |
| ----------------------------------- | ---------------------------------------------- |
| `${() => sig.get()}`                | Reactive text / node content                   |
| `attr="${() => val}"`               | Reactive attribute                             |
| `.propName="${() => val}"`          | IDL property binding (bypasses `setAttribute`) |
| `@eventName=${handler}`             | Event listener (no-op in SSR)                  |
| `${() => list.map(x => html`...`)}` | List rendering                                 |
| `${trustedHtml(str)}`               | Interpolate raw HTML strings                   |

```ts
import { html, trustedHtml } from '@nativedom/core';

html`
  <input
    .value="${() => text.get()}"
    @input=${(e: Event) => text.set((e.target as HTMLInputElement).value)}
  />
  <div class="${() => active.get() ? 'on' : 'off'}">
    ${() => items.get().map(item => html`<li>${item.name}</li>`)}
  </div>
`;
```

> **Note:** Never use `${...}` inside `<textarea>` — use `.value="${() => sig.get()}"` instead.

### `asyncSignal(fetcher, options?)`

```ts
import { asyncSignal } from '@nativedom/core';

component('user-card', (ctx) => {
  const id = ctx.prop<string>('user-id', '');

  const user = asyncSignal(
    () => fetch(`/api/users/${id.get()}`).then(r => r.json()),
    { initialValue: null }
  );

  return html`
    ${() => user.loading.get() ? html`<p>Loading...</p>` : ''}
    ${() => user.error.get()  ? html`<p>Error</p>` : ''}
    ${() => user.data.get()   ? html`<p>${() => user.data.get()?.name}</p>` : ''}
  `;
});
```

The fetcher re-runs automatically when any signal read inside it changes. Results from stale fetches are discarded.

### Context

```ts
import { createContext } from '@nativedom/core';

const ThemeContext = createContext('light');

// Provider
component('theme-provider', (ctx) => {
  ctx.provide(ThemeContext, 'dark');
  return html`<slot></slot>`;
});

// Consumer
component('themed-child', (ctx) => {
  const theme = ctx.consume(ThemeContext);
  return html`<p>Theme: ${() => theme.get()}</p>`;
});
```

### Refs

```ts
import { createRef } from '@nativedom/core';

component('focus-input', (ctx) => {
  const inputRef = createRef<HTMLInputElement>();

  ctx.effect(() => inputRef.current?.focus());

  return html`<input ref=${inputRef} />`;
});
```

---

## Store

```ts
import { createStore } from '@nativedom/store';

const store = createStore({ count: 0, user: null });

// Read & write
store.count.set(store.count.get() + 1);

// SSR: serialize state for the client
const snapshot = store.snapshot(); // → plain object

// Client: rehydrate from server snapshot
store.rehydrate(snapshot);
```

---

## Router

```ts
import { createRouter } from '@nativedom/router';
import { html } from '@nativedom/core';

const router = createRouter([
  { path: '/',           render: ()       => html`<home-page></home-page>` },
  { path: '/users/:id',  render: (params) => html`<user-page user-id="${params.id}"></user-page>` },
]);

component('my-app', () => {
  const outlet = (): NodeValue => router.outlet() as NodeValue;

  return html`
    <nav>
      <a href="/"       @click=${router.link}>Home</a>
      <a href="/users/1" @click=${router.link}>User 1</a>
    </nav>
    <main>${outlet}</main>
  `;
});
```

**Options:**

```ts
createRouter(routes, {
  mode: 'history', // or 'hash'
  ssrPath: '/current/path', // for server-side rendering
});
```

**Reactive route info:**

```ts
router.currentPath.get();    // → '/users/42'
router.currentParams.get();  // → { id: '42' }
router.navigate('/other');   // programmatic navigation
```

---

## Server-Side Rendering

```ts
import { ssrRender, renderPage, renderFragment, getComponentStyles } from '@nativedom/core';
import { renderToString } from '@nativedom/server';

// Full HTML page
const html = renderPage('my-app', props, {
  title: 'My App',
  storeSnapshot: store.snapshot(),
  scripts: ['<script src="/client.js" type="module"></script>'],
  head: `<link rel="stylesheet" href="/styles.css">`,
  lang: 'en',
});

// Single component fragment
const fragment = renderFragment('my-component', props);

// Inject scoped CSS (shadow:false components)
const styles = getComponentStyles();
```

Components marked with `island: true` are rendered statically on the server and skip client-side re-rendering. Omit `island` (default `false`) for fully interactive components.

---

## Demo Apps

| App                      | Description                          | Commands                        |
| ------------------------ | ------------------------------------ | ------------------------------- |
| [`apps/todo`](apps/todo) | TodoMVC — SSR + client hydration     | `npm run serve` (port 3001)     |
| [`apps/hn`](apps/hn)     | Hacker News reader — client-side SPA | `npm run dev` / `npm run build` |
| [`apps/shop`](apps/shop) | Shop with admin panel — SSR + router | `npm run serve`                 |

---

## Monorepo Development

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Build all packages

```bash
npm run build
```

### Run tests

```bash
npm test               # run once
npm run test:watch     # watch mode
npm run test:ui        # Vitest UI
npm run test:coverage  # coverage report
```

### Typecheck

```bash
npm run typecheck
```

### Clean

```bash
npm run clean
```

### Develop a package

```bash
cd packages/core
npm run dev   # tsup in watch mode
```

### Run a demo app

```bash
cd apps/todo
npm run serve   # starts SSR server on port 3001
```

---

## Project Structure

```
nativedom/
├── packages/
│   ├── core/          # Signals, components, html template engine
│   ├── store/         # Reactive global store
│   ├── router/        # Client-side router
│   └── server/        # SSR renderer
├── apps/
│   ├── todo/          # TodoMVC demo (SSR + hydration)
│   ├── hn/            # Hacker News SPA
│   └── shop/          # Shop demo (SSR + router)
├── tsconfig.base.json
└── package.json
```

---

## TypeScript

All packages are written in strict TypeScript (ES2022, `moduleResolution: "Bundler"`). Key compiler options:

- `strict: true`
- `verbatimModuleSyntax: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`

---

## License

MIT

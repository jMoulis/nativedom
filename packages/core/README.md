# @nativedom/core

Fine-grained signals, isomorphic Web Components, and a zero-dependency `html` tagged template.

Build reactive UIs with native Custom Elements — no virtual DOM, no compiler, no framework lock-in. Works on both client and server.

## Install

```bash
npm install @nativedom/core
```

## Quick start

```ts
import { component, signal, html } from '@nativedom/core';

component('app-counter', (_, { signal, html }) => {
  const count = signal(0);

  return html`
    <button @click=${() => count.set(count.get() - 1)}>−</button>
    <span>${() => count.get()}</span>
    <button @click=${() => count.set(count.get() + 1)}>+</button>
  `;
});
```

```html
<app-counter></app-counter>
```

## Core concepts

### Signals

Reactive state primitives. Reading a signal inside an effect creates a subscription.

```ts
import { signal, computed, effect, batch, untrack } from '@nativedom/core';

const count = signal(0);
const doubled = computed(() => count.get() * 2);

effect(() => {
  console.log(doubled.get()); // runs whenever count changes
});

batch(() => {
  count.set(1); // grouped — subscribers notified once
  count.set(2);
});

const snap = untrack(() => count.get()); // read without subscribing
```

### component()

Defines an isomorphic Web Component. Same function runs on the server (returns HTML string) and client (returns a live `DocumentFragment`).

```ts
import { component } from '@nativedom/core';

interface Props {
  'initial-count'?: string;
}

const Counter = component<Props>(
  'app-counter',
  ({ 'initial-count': init = '0' }, { signal, computed, html }) => {
    const count = signal(Number(init));
    const isEven = computed(() => count.get() % 2 === 0);

    return html`
      <p>Count: ${() => count.get()} (${() => isEven.get() ? 'even' : 'odd'})</p>
      <button @click=${() => count.set(count.get() + 1)}>+1</button>
    `;
  },
  { shadow: false }
);

// Type-safe factory — use inside other html`` templates:
html`${Counter({ 'initial-count': '5' })}`
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `shadow` | `boolean` | `true` | Use Shadow DOM |
| `shadowMode` | `'open' \| 'closed'` | `'open'` | Shadow DOM mode |
| `island` | `boolean` | `false` | SSR island — skips client re-render |
| `observedAttrs` | `string[]` | `[]` | Attribute changes that trigger re-render |
| `styles` | `string` | — | Scoped CSS (see below) |
| `onError` | `(err) => Interpolation` | — | Error boundary fallback |

### html\`\`

Tagged template literal for building DOM. Reactive bindings are attached directly to nodes — no diffing.

```ts
const name  = signal('world');
const bold  = signal(false);
const items = signal(['a', 'b', 'c']);

html`
  <!-- content binding (reactive) -->
  <p>Hello, ${() => name.get()}!</p>

  <!-- attribute binding -->
  <p class="${() => bold.get() ? 'bold' : ''}">text</p>

  <!-- IDL property binding (bypasses setAttribute) -->
  <input .value="${() => name.get()}" @input=${(e) => name.set(e.target.value)} />

  <!-- event listener -->
  <button @click=${() => name.set('NativeDOM')}>reset</button>

  <!-- list rendering -->
  <ul>${() => items.get().map(i => html`<li>${i}</li>`)}</ul>
`
```

### Scoped styles

```ts
component('my-card', (_, { html }) => html`<div class="card">...</div>`, {
  shadow: false,
  styles: `
    :scope        { display: block; }   /* the my-card element itself */
    .card         { border-radius: 8px; padding: 1rem; }
    .card:hover   { box-shadow: 0 2px 8px rgba(0,0,0,.1); }
  `,
});
```

For `shadow: false` components, styles are injected once into `<head>` wrapped in `@scope (tag-name) { }`.

### asyncSignal

Reactive data fetching. The fetcher re-runs whenever its signal dependencies change.

```ts
import { component, asyncSignal } from '@nativedom/core';

component('user-profile', ({ id }, { html }) => {
  const { data, loading, error, refetch } = asyncSignal(() =>
    fetch(`/api/users/${id}`).then(r => r.json())
  );

  return html`
    ${() => loading.get()
      ? html`<p>Loading…</p>`
      : html`<h1>${() => data.get()?.name}</h1>`
    }
  `;
});
```

### ctx.watch()

Imperative watcher — like `effect` but skips the initial run.

```ts
component('search-box', (_, { signal, watch, html }) => {
  const query = signal('');

  watch(
    () => query.get(),
    (newVal, oldVal) => {
      console.log(`changed from "${oldVal}" to "${newVal}"`);
    }
  );

  return html`<input .value="${() => query.get()}" @input=${e => query.set(e.target.value)} />`;
});
```

### trustedHtml()

Insert a pre-rendered HTML string without escaping. Use for server-generated content only.

```ts
import { trustedHtml } from '@nativedom/core';

html`<div>${trustedHtml('<strong>bold</strong>')}</div>`
```

### SSR helpers

```ts
import { ssrRender, getComponentStyles } from '@nativedom/core';

// Render a component to an HTML string (server-side)
const html = ssrRender('my-card', { title: 'Hello' });

// Collect all @scope CSS for shadow:false components (inject into <head>)
const css = getComponentStyles();
```

### Context

```ts
import { createContext, component } from '@nativedom/core';

const ThemeCtx = createContext<'light' | 'dark'>('light');

component('theme-provider', (_, { provide, html }) => {
  provide(ThemeCtx, 'dark');
  return html`<slot></slot>`;
});

component('themed-card', (_, { inject, html }) => {
  const theme = inject(ThemeCtx); // 'dark'
  return html`<div class="card ${theme}">...</div>`;
});
```

## SSR island pattern

Mark components as `island: true` to freeze their SSR output on the client — zero JavaScript, perfect for SEO.

```ts
component('product-card', ({ id }) => {
  const product = db.findById(id);
  return `<article>...</article>`; // plain string — server only
}, { island: true, shadow: false });
```

## Related packages

- [`@nativedom/server`](https://www.npmjs.com/package/@nativedom/server) — `renderPage()` and `streamPage()` for full SSR documents
- [`@nativedom/router`](https://www.npmjs.com/package/@nativedom/router) — Signal-backed client-side router
- [`@nativedom/store`](https://www.npmjs.com/package/@nativedom/store) — Global reactive store with SSR hydration

## License

MIT

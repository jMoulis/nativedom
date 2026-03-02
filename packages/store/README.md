# @nativedom/store

Global reactive store with SSR snapshot and client rehydration for [NativeDOM](https://www.npmjs.com/package/@nativedom/core).

## Install

```bash
npm install @nativedom/core @nativedom/store
```

## Quick start

```ts
// store.ts
import { createStore } from '@nativedom/store';

export const appStore = createStore({
  theme: 'light' as 'light' | 'dark',
  user: null as { name: string } | null,
  count: 0,
});

// Read
appStore.theme.get();       // 'light'

// Write
appStore.theme.set('dark');

// All values are signals — reactive in effects, computed, and html`` bindings
```

## API

### createStore(initial)

Creates a store from a plain object. Each key becomes a reactive `Signal`.

```ts
import { createStore } from '@nativedom/store';

const store = createStore({
  count: 0,
  name: 'Alice',
  items: [] as string[],
});

// Each field is a Signal<T>:
store.count.get();          // 0
store.count.set(1);
store.count.peek();         // untracked read

store.name.set('Bob');
store.items.set(['a', 'b']);
```

### store.snapshot()

Serializes all current signal values to a plain object. Use on the server to capture state for client hydration.

```ts
const snap = store.snapshot();
// → { count: 0, name: 'Alice', items: [] }

// Inject into the page (via @nativedom/server renderPage options):
renderPage('app-root', {}, {
  storeSnapshot: store.snapshot(),
});
```

### store.rehydrate(snapshot)

Restores signal values from a snapshot. Call on the client before any components render.

```ts
// client entry point
import { appStore } from './store.js';

appStore.rehydrate(window.__NF_STORE__);
```

## Usage in components

Store signals work exactly like local `signal()` values inside `html` bindings:

```ts
import { component } from '@nativedom/core';
import { appStore } from './store.js';

component('theme-toggle', (_, { html }) => html`
  <button @click=${() =>
    appStore.theme.set(appStore.theme.get() === 'light' ? 'dark' : 'light')
  }>
    Current: ${() => appStore.theme.get()}
  </button>
`);
```

## Full SSR example

```ts
// server.ts
import { createStore } from '@nativedom/store';
import { renderPage } from '@nativedom/server';

const store = createStore({ user: req.session.user ?? null, theme: 'light' });

const { html } = renderPage('app-root', {}, {
  storeSnapshot: store.snapshot(),
  scripts: ['/dist/client.js'],
});

// client.ts
import { appStore } from './store.js';

// Rehydrate before components connect to the DOM
appStore.rehydrate(window.__NF_STORE__ ?? {});
```

## TypeScript

Store types are fully inferred from the initial value:

```ts
const store = createStore({
  count: 0,           // Signal<number>
  name: '',           // Signal<string>
  active: false,      // Signal<boolean>
  tags: [] as string[], // Signal<string[]>
});

store.count.set('bad'); // ✗ Type error — expected number
store.count.set(1);     // ✓
```

## Related packages

- [`@nativedom/core`](https://www.npmjs.com/package/@nativedom/core) — Signals, components, html\`\`
- [`@nativedom/server`](https://www.npmjs.com/package/@nativedom/server) — SSR rendering and `storeSnapshot` injection
- [`@nativedom/router`](https://www.npmjs.com/package/@nativedom/router) — Signal-backed client-side router

## License

MIT

# @nativedom/server

Server-side rendering for [NativeDOM](https://www.npmjs.com/package/@nativedom/core) components. Render full HTML documents or stream them chunk-by-chunk — no client JavaScript required for the initial paint.

## Install

```bash
npm install @nativedom/core @nativedom/server
```

## Quick start

```ts
import { component } from '@nativedom/core';
import { streamPage } from '@nativedom/server';
import * as http from 'node:http';

// Register components server-side
import './components/my-app.js';

http.createServer(async (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  for await (const chunk of streamPage('my-app', {}, {
    title: 'My App',
    scripts: ['/dist/client.js'],
  })) {
    res.write(chunk);
  }
  res.end();
}).listen(3000);
```

## API

### streamPage(component, props, options?)

Async generator that yields the HTML document in three chunks: `<head>`, component body, closing tags. The shell arrives at the browser immediately so asset loading starts before the component finishes rendering.

```ts
import { streamPage } from '@nativedom/server';

// Node.js http
for await (const chunk of streamPage('app-root', { user: 'alice' }, {
  title: 'My App',
  head: '<link rel="stylesheet" href="/app.css">',
  scripts: ['/dist/client.js'],
})) {
  res.write(chunk);
}
res.end();

// Web standard (Fetch / Bun / Deno / Cloudflare Workers)
const stream = ReadableStream.from(streamPage('app-root', props, options));
return new Response(stream, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
```

### renderPage(component, props, options?)

Renders the full HTML document to a string in one call.

```ts
import { renderPage } from '@nativedom/server';

const { html, status, headers } = renderPage('app-root', { user: 'alice' }, {
  title: 'My App',
  scripts: ['/dist/client.js'],
});

res.writeHead(status, headers);
res.end(html);
```

### renderFragment(component, props?)

Renders a single component to an HTML string fragment — useful for partial rendering or edge functions.

```ts
import { renderFragment } from '@nativedom/server';

const html = renderFragment('product-card', { id: '42' });
// → '<product-card id="42">...</product-card>'
```

## Options

All three functions accept the same `RenderOptions`:

| Option | Type | Description |
|--------|------|-------------|
| `title` | `string` | `<title>` content |
| `head` | `string` | Raw HTML injected into `<head>` (CSS links, meta tags, component styles) |
| `scripts` | `string[]` | Module script `src` paths, injected before `</body>` |
| `storeSnapshot` | `Record<string, unknown>` | Serialized store state injected as `window.__NF_STORE__` |
| `lang` | `string` | `<html lang="">` attribute (default: `'en'`) |

## Injecting component styles

For `shadow: false` components, collect and inject their `@scope` CSS via `getComponentStyles()` from `@nativedom/core`:

```ts
import { getComponentStyles } from '@nativedom/core';
import { streamPage } from '@nativedom/server';

// Import all components first so they register their styles
import './components/my-card.js';
import './components/my-nav.js';

for await (const chunk of streamPage('app-root', {}, {
  head: `<style>${getComponentStyles()}</style>`,
  scripts: ['/dist/client.js'],
})) {
  res.write(chunk);
}
```

## SSR islands

Components marked `island: true` emit a `nf-ssr` attribute. The client runtime detects this and skips re-rendering — the SSR HTML is used as-is with zero JavaScript:

```ts
component('product-card', ({ id }) => {
  const product = db.findById(id);
  return `<article>...</article>`;
}, { island: true, shadow: false });
```

## Store hydration

Serialize server-side store state and rehydrate it on the client:

```ts
// server
import { createStore } from '@nativedom/store';

const store = createStore({ theme: 'dark', user: req.user });

renderPage('app-root', {}, {
  storeSnapshot: store.snapshot(),
});

// client
import { createStore } from '@nativedom/store';

const store = createStore({ theme: 'light', user: null });
store.rehydrate(window.__NF_STORE__);
```

## Related packages

- [`@nativedom/core`](https://www.npmjs.com/package/@nativedom/core) — Signals, components, html\`\`
- [`@nativedom/router`](https://www.npmjs.com/package/@nativedom/router) — Signal-backed client-side router
- [`@nativedom/store`](https://www.npmjs.com/package/@nativedom/store) — Global reactive store

## License

MIT

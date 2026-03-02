# @nativedom/router

Signal-backed client-side router for [NativeDOM](https://www.npmjs.com/package/@nativedom/core). History API and hash mode. No dependencies beyond `@nativedom/core`.

## Install

```bash
npm install @nativedom/core @nativedom/router
```

## Quick start

```ts
import { component, html } from '@nativedom/core';
import { createRouter } from '@nativedom/router';

const router = createRouter([
  { path: '/',          render: ()       => html`<home-page></home-page>` },
  { path: '/about',     render: ()       => html`<about-page></about-page>` },
  { path: '/posts/:id', render: ({ id }) => html`<post-detail post-id="${id}"></post-detail>` },
  { path: '*',          render: ()       => html`<not-found-page></not-found-page>` },
]);

component('app-root', (_, { html }) => html`
  <nav>
    <a href="/"      @click=${router.link}>Home</a>
    <a href="/about" @click=${router.link}>About</a>
  </nav>
  <main>${() => router.outlet()}</main>
`, { shadow: false });
```

## API

### createRouter(routes, options?)

```ts
import { createRouter } from '@nativedom/router';

const router = createRouter(routes, options);
```

**Routes** — matched in order, first match wins:

```ts
[
  { path: '/posts/:year/:slug', render: ({ year, slug }) => PostDetail({ year, slug }) },
  { path: '*', render: () => html`<not-found></not-found>` },
]
```

- `:param` segments are captured and passed to `render`
- `*` is a catch-all (use last)
- `path` matching is case-sensitive and ignores trailing slashes

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `'history' \| 'hash'` | `'history'` | Routing strategy |
| `ssrPath` | `string` | `'/'` | Initial path for server-side rendering |
| `interceptLinks` | `boolean` | `false` | Auto-intercept same-origin `<a href>` clicks |

### router.outlet()

Returns the rendered content for the current route. Use as a reactive interpolation:

```ts
html`<main>${() => router.outlet()}</main>`
```

Returns `null` while a lazy `load` is in flight.

### router.navigate(to)

Programmatic navigation. Updates the URL bar and the reactive path signal.

```ts
router.navigate('/posts/42');
router.navigate('/search?q=hello'); // query strings supported
```

No-op on the server.

### router.link

Click handler for `<a>` tags — prevents full-page reload and calls `navigate()`.

```ts
html`<a href="/about" @click=${router.link}>About</a>`
```

Not needed when `interceptLinks: true` is set.

### router.currentPath

Reactive `Computed<string>` of the current path (without query string).

```ts
effect(() => {
  console.log('path changed:', router.currentPath.get());
});
```

### router.currentParams

Reactive `Computed<Record<string, string>>` of the params extracted from the current route.

### router.currentQuery

Reactive `Computed<Record<string, string>>` of the parsed query string.

## Lazy loading

Load route modules on demand — the route renders `null` while the import is in flight, then automatically re-renders:

```ts
createRouter([
  {
    path: '/settings',
    load: () => import('./pages/settings.js'),
    render: () => html`<settings-page></settings-page>`,
  },
]);
```

## Hash mode

For environments without server-side URL rewriting:

```ts
const router = createRouter(routes, { mode: 'hash' });
// URLs look like: /#/posts/42
```

## SSR usage

Pass the request path via `ssrPath` so the server renders the correct route:

```ts
// server.ts
const router = createRouter(routes, { ssrPath: req.url });
```

## Global link interception

Instead of adding `@click=${router.link}` to every anchor, intercept all same-origin links at the document level:

```ts
const router = createRouter(routes, { interceptLinks: true });
// External links, mailto:, and target="_blank" are left alone
```

## Related packages

- [`@nativedom/core`](https://www.npmjs.com/package/@nativedom/core) — Signals, components, html\`\`
- [`@nativedom/server`](https://www.npmjs.com/package/@nativedom/server) — SSR rendering
- [`@nativedom/store`](https://www.npmjs.com/package/@nativedom/store) — Global reactive store

## License

MIT

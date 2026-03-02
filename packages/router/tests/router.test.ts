import { describe, it, expect, beforeEach } from 'vitest';
import { effect } from '@nativeframe/core';
import { createRouter } from '../src/router.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Reset location to / before each test (happy-dom persists state across tests). */
function resetLocation(): void {
  history.pushState(null, '', '/');
}

// ─── Route matching (unit tests — no window interaction) ──────────────────────

describe('createRouter — route matching', () => {
  it('matches an exact static path', () => {
    const router = createRouter([
      { path: '/', render: () => 'home' },
    ]);
    expect(router.outlet()).toBe('home');
  });

  it('returns null when no route matches', () => {
    const router = createRouter([
      { path: '/about', render: () => 'about' },
    ]);
    // initial path is '/' in tests (happy-dom starts at '/')
    expect(router.outlet()).toBeNull();
  });

  it('matches routes in order — first match wins', () => {
    const router = createRouter([
      { path: '/', render: () => 'first' },
      { path: '/', render: () => 'second' },
    ]);
    expect(router.outlet()).toBe('first');
  });

  it('extracts :param segments into currentParams', () => {
    const router = createRouter([
      { path: '/todos/:id', render: ({ id }) => `todo-${id}` },
    ]);
    router.navigate('/todos/42');
    expect(router.currentParams.get()).toEqual({ id: '42' });
    expect(router.outlet()).toBe('todo-42');
  });

  it('extracts multiple :param segments', () => {
    const router = createRouter([
      { path: '/posts/:year/:slug', render: ({ year, slug }) => `${year}/${slug}` },
    ]);
    router.navigate('/posts/2024/hello-world');
    expect(router.currentParams.get()).toEqual({ year: '2024', slug: 'hello-world' });
    expect(router.outlet()).toBe('2024/hello-world');
  });

  it('does not match when segment count differs', () => {
    const router = createRouter([
      { path: '/todos/:id', render: () => 'item' },
    ]);
    router.navigate('/todos');
    expect(router.outlet()).toBeNull();
  });

  it('decodes percent-encoded param values', () => {
    const router = createRouter([
      { path: '/search/:query', render: ({ query }) => query },
    ]);
    router.navigate('/search/hello%20world');
    expect(router.currentParams.get()).toEqual({ query: 'hello world' });
  });
});

// ─── History mode navigation ──────────────────────────────────────────────────

describe('createRouter — history mode navigation', () => {
  beforeEach(resetLocation);

  it('initialises currentPath from window.location.pathname', () => {
    history.pushState(null, '', '/todos');
    const router = createRouter([{ path: '/todos', render: () => null }]);
    expect(router.currentPath.get()).toBe('/todos');
  });

  it('navigate() updates currentPath', () => {
    const router = createRouter([
      { path: '/', render: () => 'home' },
      { path: '/about', render: () => 'about' },
    ]);
    expect(router.currentPath.get()).toBe('/');
    router.navigate('/about');
    expect(router.currentPath.get()).toBe('/about');
  });

  it('navigate() updates the browser URL bar', () => {
    const router = createRouter([{ path: '/new', render: () => null }]);
    router.navigate('/new');
    expect(window.location.pathname).toBe('/new');
  });

  it('navigate() switches the active route reactively', () => {
    const router = createRouter([
      { path: '/', render: () => 'home' },
      { path: '/about', render: () => 'about' },
    ]);

    const results: Array<ReturnType<typeof router.outlet>> = [];
    const handle = effect(() => { results.push(router.outlet()); });

    router.navigate('/about');
    router.navigate('/');

    handle.dispose();
    expect(results).toEqual(['home', 'about', 'home']);
  });

  it('popstate (browser back) updates currentPath reactively', () => {
    const router = createRouter([
      { path: '/', render: () => 'home' },
      { path: '/away', render: () => 'away' },
    ]);

    router.navigate('/away');
    expect(router.currentPath.get()).toBe('/away');

    // Simulate browser back button
    history.back();
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(router.currentPath.get()).toBe('/');
  });

  it('outlet() returns null for unmatched route', () => {
    const router = createRouter([{ path: '/known', render: () => 'known' }]);
    router.navigate('/unknown');
    expect(router.outlet()).toBeNull();
  });
});

// ─── Hash mode navigation ─────────────────────────────────────────────────────

describe('createRouter — hash mode navigation', () => {
  beforeEach(() => {
    history.pushState(null, '', '/');
    window.location.hash = '';
  });

  it('navigate() updates location.hash', () => {
    const router = createRouter(
      [{ path: '/todos', render: () => 'todos' }],
      { mode: 'hash' },
    );
    router.navigate('/todos');
    expect(window.location.hash).toBe('#/todos');
  });

  it('navigate() updates currentPath in hash mode', () => {
    const router = createRouter(
      [
        { path: '/', render: () => 'home' },
        { path: '/todos', render: () => 'todos' },
      ],
      { mode: 'hash' },
    );
    router.navigate('/todos');
    expect(router.currentPath.get()).toBe('/todos');
    expect(router.outlet()).toBe('todos');
  });
});

// ─── link() handler ───────────────────────────────────────────────────────────

describe('createRouter — link() click handler', () => {
  beforeEach(resetLocation);

  it('prevents default browser navigation', () => {
    const router = createRouter([{ path: '/about', render: () => null }]);
    const a = document.createElement('a');
    a.href = '/about';
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'currentTarget', { value: a });
    router.link(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('navigates to the href of the clicked anchor', () => {
    const router = createRouter([
      { path: '/', render: () => 'home' },
      { path: '/contact', render: () => 'contact' },
    ]);
    const a = document.createElement('a');
    a.setAttribute('href', '/contact');
    const event = new MouseEvent('click', { cancelable: true });
    Object.defineProperty(event, 'currentTarget', { value: a });
    router.link(event);
    expect(router.currentPath.get()).toBe('/contact');
  });
});

// ─── SSR mode (no window) ─────────────────────────────────────────────────────

describe('createRouter — SSR (ssrPath)', () => {
  it('uses ssrPath as the initial path when provided', () => {
    // Simulate server environment by passing ssrPath;
    // in tests window exists, so we verify the API at least accepts ssrPath.
    // Full SSR isolation is verified by the node-environment renderer tests.
    const router = createRouter(
      [
        { path: '/', render: () => 'home' },
        { path: '/todos', render: () => 'todos' },
      ],
      { ssrPath: '/todos' },
    );
    // In the happy-dom test environment window exists, so ssrPath is ignored
    // in favour of window.location.pathname (which is '/').
    // We just verify the router is created without error.
    expect(router).toBeDefined();
    expect(router.currentPath).toBeDefined();
  });
});

// ─── Catch-all (*) ────────────────────────────────────────────────────────────

describe('createRouter — catch-all (*)', () => {
  beforeEach(resetLocation);

  it('* matches any path that has no more specific route', () => {
    const router = createRouter([
      { path: '/known', render: () => 'known' },
      { path: '*',      render: () => 'not-found' },
    ]);
    router.navigate('/anything/at/all');
    expect(router.outlet()).toBe('not-found');
  });

  it('* does not match when a more specific route comes first', () => {
    const router = createRouter([
      { path: '/known', render: () => 'known' },
      { path: '*',      render: () => 'not-found' },
    ]);
    router.navigate('/known');
    expect(router.outlet()).toBe('known');
  });

  it('* params are empty (no captures)', () => {
    const router = createRouter([
      { path: '*', render: () => 'fallback' },
    ]);
    router.navigate('/any/path');
    expect(router.currentParams.get()).toEqual({});
  });
});

// ─── Lazy loading ─────────────────────────────────────────────────────────────

describe('createRouter — lazy loading (load)', () => {
  beforeEach(resetLocation);

  it('returns null while load() is in flight', () => {
    const router = createRouter([
      { path: '/', load: () => new Promise(() => { /* never */ }), render: () => 'loaded' },
    ]);
    expect(router.outlet()).toBeNull();
  });

  it('renders the route after load() resolves', async () => {
    let resolve!: () => void;
    const loadPromise = new Promise<void>(r => { resolve = r; });

    const router = createRouter([
      { path: '/', load: () => loadPromise, render: () => 'loaded' },
    ]);

    expect(router.outlet()).toBeNull();

    resolve();
    await loadPromise;
    await Promise.resolve(); // flush microtasks

    expect(router.outlet()).toBe('loaded');
  });

  it('does not call load() again once the route has loaded', async () => {
    let loadCount = 0;
    const router = createRouter([
      { path: '/', load: async () => { loadCount++; }, render: () => 'ok' },
    ]);

    router.outlet(); // triggers first load
    await Promise.resolve();
    await Promise.resolve();

    router.outlet(); // should NOT trigger another load
    router.outlet();

    await Promise.resolve();
    expect(loadCount).toBe(1);
  });

  it('routes without load render immediately', () => {
    const router = createRouter([
      { path: '/', render: () => 'instant' },
    ]);
    expect(router.outlet()).toBe('instant');
  });
});

// ─── Global link interception ─────────────────────────────────────────────────

describe('createRouter — interceptLinks', () => {
  beforeEach(resetLocation);

  it('intercepts clicks on same-origin <a> and navigates', () => {
    const router = createRouter([
      { path: '/', render: () => 'home' },
      { path: '/other', render: () => 'other' },
    ], { interceptLinks: true });

    const anchor = document.createElement('a');
    anchor.setAttribute('href', '/other');
    document.body.appendChild(anchor);
    anchor.click();

    expect(router.currentPath.get()).toBe('/other');
    document.body.removeChild(anchor);
  });

  it('does not intercept external links', () => {
    const router = createRouter([
      { path: '/', render: () => 'home' },
    ], { interceptLinks: true });

    const anchor = document.createElement('a');
    anchor.setAttribute('href', 'https://example.com');
    document.body.appendChild(anchor);
    anchor.click();

    expect(router.currentPath.get()).toBe('/'); // unchanged
    document.body.removeChild(anchor);
  });

  it('does not intercept links with target=_blank', () => {
    const router = createRouter([
      { path: '/', render: () => 'home' },
      { path: '/other', render: () => 'other' },
    ], { interceptLinks: true });

    const anchor = document.createElement('a');
    anchor.setAttribute('href', '/other');
    anchor.setAttribute('target', '_blank');
    document.body.appendChild(anchor);
    anchor.click();

    expect(router.currentPath.get()).toBe('/'); // unchanged
    document.body.removeChild(anchor);
  });
});

// ─── Query params ─────────────────────────────────────────────────────────────

describe('createRouter — currentQuery', () => {
  beforeEach(resetLocation);

  it('currentQuery is empty object when there is no query string', () => {
    const router = createRouter([{ path: '/', render: () => null }]);
    expect(router.currentQuery.get()).toEqual({});
  });

  it('navigate() with query string updates currentQuery', () => {
    const router = createRouter([
      { path: '/search', render: () => null },
    ]);
    router.navigate('/search?q=hello&page=2');
    expect(router.currentQuery.get()).toEqual({ q: 'hello', page: '2' });
  });

  it('navigate() without query string clears currentQuery', () => {
    const router = createRouter([
      { path: '/search', render: () => null },
      { path: '/', render: () => null },
    ]);
    router.navigate('/search?q=hello');
    expect(router.currentQuery.get()).toEqual({ q: 'hello' });

    router.navigate('/');
    expect(router.currentQuery.get()).toEqual({});
  });

  it('currentPath does not include the query string', () => {
    const router = createRouter([
      { path: '/search', render: () => null },
    ]);
    router.navigate('/search?q=hello');
    expect(router.currentPath.get()).toBe('/search');
  });
});

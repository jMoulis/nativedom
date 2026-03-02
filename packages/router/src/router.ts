/**
 * @nativeframe/router
 *
 * Signal-backed client-side router built on the History API.
 * Works isomorphically: resolves once on the server, stays reactive on the client.
 *
 * Design principles:
 * - Current path is a signal → routes update reactively, no re-mount
 * - No global state — each createRouter() is fully independent
 * - DOM-native: History API for history mode, hashchange for hash mode
 * - SSR-safe: accepts an explicit path when window is undefined
 */

import { signal, computed, type Computed } from '@nativeframe/core';
import type { Interpolation } from '@nativeframe/core';

// ─── Public types ─────────────────────────────────────────────────────────────

/**
 * A single route definition.
 *
 * @example
 * { path: '/todos/:id', render: ({ id }) => html`<todo-detail todo-id="${id}"></todo-detail>` }
 */
export interface Route {
  /**
   * URL pattern to match against the current path.
   * Segments prefixed with `:` are captured as named params.
   * Use `*` as the sole pattern for a catch-all (e.g. a 404 page).
   * @example '/', '/todos', '/todos/:id', '/posts/:year/:slug', '*'
   */
  readonly path: string;

  /**
   * Optional async module to load before this route is rendered.
   * The route renders `null` while the load is in flight, then automatically
   * re-renders once the promise resolves — no manual loading state needed.
   *
   * Ideal for code-splitting: the component's module is only downloaded
   * when the user first visits that route.
   *
   * @example
   * load: () => import('./pages/settings.js')
   */
  readonly load?: () => Promise<unknown>;

  /**
   * Called with the extracted params when this route is active.
   * Return value is rendered into the outlet.
   */
  readonly render: (params: Record<string, string>) => Interpolation;
}

/**
 * Options for createRouter().
 */
export interface RouterOptions {
  /**
   * Routing strategy.
   * - `'history'` (default): uses `pushState` + `popstate`. Clean URLs,
   *   requires server-side catch-all for direct navigation.
   * - `'hash'`: uses `location.hash` + `hashchange`. Works without server config.
   */
  readonly mode?: 'history' | 'hash';

  /**
   * Initial path for server-side rendering.
   * When `window` is undefined (Node/Deno), the router uses this value.
   * Typically set from the incoming request URL.
   * @default '/'
   */
  readonly ssrPath?: string;

  /**
   * When `true`, adds a single `document`-level click listener that intercepts
   * clicks on same-origin `<a href>` elements and routes them through
   * `navigate()` instead of triggering a full page reload.
   *
   * External links (`http://`, `//`), mailto links, and anchors with a
   * non-default `target` attribute are left alone.
   *
   * With this option you do **not** need `@click=${router.link}` on every anchor.
   *
   * @default false
   */
  readonly interceptLinks?: boolean;
}

/**
 * A router instance returned by createRouter().
 */
export interface Router {
  /**
   * Returns the rendered content for the current route.
   * Returns `null` when no route matches (render a 404 component here).
   * Returns `null` while a `load` promise is in flight, then re-renders
   * automatically once the module has loaded.
   *
   * Designed for use as a reactive interpolation inside `html``:
   * @example
   * html`<main>${() => router.outlet()}</main>`
   */
  outlet(): Interpolation;

  /**
   * Navigate programmatically to a path.
   * Updates the URL bar and the reactive path signal.
   * Supports query strings: navigate('/search?q=hello')
   * No-op when called on the server.
   */
  navigate(to: string): void;

  /**
   * Click handler for `<a>` tags.
   * Prevents the default browser navigation and calls navigate() instead.
   * Not needed when `interceptLinks: true` is set.
   *
   * @example
   * html`<a href="/todos" @click=${router.link}>Todos</a>`
   */
  link(e: Event): void;

  /** The current path as a reactive computed value (without query string). */
  readonly currentPath: Computed<string>;

  /** The params extracted from the current matched route. */
  readonly currentParams: Computed<Record<string, string>>;

  /** The parsed query string parameters for the current URL. */
  readonly currentQuery: Computed<Record<string, string>>;
}

// ─── Route matching ───────────────────────────────────────────────────────────

interface MatchResult {
  readonly route: Route;
  readonly params: Record<string, string>;
}

/**
 * Try to match a URL pattern against a concrete path.
 * Returns the extracted params on success, or null on mismatch.
 *
 * Matching rules:
 * - `*` matches any path (catch-all)
 * - Segments prefixed with `:` capture the corresponding path segment
 * - All other segments must match exactly (case-sensitive)
 * - Trailing slashes are normalized away before comparison
 */
function matchRoute(pattern: string, path: string): Record<string, string> | null {
  if (pattern === '*') return {};

  const normalize = (s: string): string[] => s.split('/').filter(Boolean);
  const patternParts = normalize(pattern);
  const pathParts = normalize(path);

  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const seg = patternParts[i] ?? '';
    const val = pathParts[i] ?? '';

    if (seg.startsWith(':')) {
      params[seg.slice(1)] = decodeURIComponent(val);
    } else if (seg !== val) {
      return null;
    }
  }

  return params;
}

/**
 * Find the first matching route for a path, returning route + extracted params.
 * Returns null if no route matches (→ 404 scenario).
 */
function resolveMatch(routes: readonly Route[], path: string): MatchResult | null {
  for (const route of routes) {
    const params = matchRoute(route.path, path);
    if (params !== null) return { route, params };
  }
  return null;
}

// ─── Query string helpers ─────────────────────────────────────────────────────

function parseQuery(search: string): Record<string, string> {
  const params: Record<string, string> = {};
  new URLSearchParams(search).forEach((v, k) => { params[k] = v; });
  return params;
}

// ─── createRouter() ───────────────────────────────────────────────────────────

/**
 * Create a signal-backed router.
 *
 * Routes are matched in order — put more specific paths before catch-alls.
 * Use `{ path: '*', render: () => html`<not-found-page></not-found-page>` }` as
 * the last route for a 404 fallback.
 *
 * @example
 * const router = createRouter([
 *   { path: '/',          render: ()       => html`<home-page></home-page>` },
 *   { path: '/todos',     render: ()       => html`<todo-list></todo-list>` },
 *   { path: '/todos/:id', render: ({ id }) => html`<todo-detail todo-id="${id}"></todo-detail>` },
 *   // Lazy-loaded route — module downloaded only when first visited:
 *   { path: '/settings',  load: () => import('./pages/settings.js'),
 *                         render: ()       => html`<settings-page></settings-page>` },
 *   { path: '*',          render: ()       => html`<not-found-page></not-found-page>` },
 * ], { interceptLinks: true });
 *
 * // In a component:
 * html`
 *   <nav>
 *     <a href="/">Home</a>
 *     <a href="/todos">Todos</a>
 *   </nav>
 *   <main>${() => router.outlet()}</main>
 * `
 */
export function createRouter(
  routes: readonly Route[],
  options: RouterOptions = {},
): Router {
  const mode = options.mode ?? 'history';
  const isClient = typeof window !== 'undefined';

  // ── Initial location ──────────────────────────────────────────────────────

  const getPath = (): string => {
    if (!isClient) return options.ssrPath ?? '/';
    if (mode === 'hash') return window.location.hash.slice(1) || '/';
    return window.location.pathname;
  };

  const getQuery = (): Record<string, string> =>
    isClient ? parseQuery(window.location.search) : {};

  // ── Reactive state ────────────────────────────────────────────────────────

  const _path  = signal(getPath());
  const _query = signal(getQuery());

  const currentPath   = computed(() => _path.get());
  const currentQuery  = computed(() => _query.get());
  const currentMatch  = computed(() => resolveMatch(routes, _path.get()));
  const currentParams = computed(() => currentMatch.get()?.params ?? {});

  // ── Lazy-load tracking ────────────────────────────────────────────────────

  // _loadVersion is a plain counter signal — incrementing it triggers outlet()
  // to re-evaluate, at which point the route is already in loadedRoutes.
  const _loadVersion = signal(0);
  const loadedRoutes = new Set<Route>();
  const pendingRoutes = new Set<Route>();

  // ── Navigation ────────────────────────────────────────────────────────────

  const navigate = (to: string): void => {
    if (!isClient) return;
    const qIdx = to.indexOf('?');
    const pathname = qIdx >= 0 ? to.slice(0, qIdx) : to;
    const search   = qIdx >= 0 ? to.slice(qIdx) : '';

    if (mode === 'hash') {
      window.location.hash = pathname;
    } else {
      history.pushState(null, '', to);
    }

    _path.set(pathname);
    _query.set(parseQuery(search));
  };

  // ── Browser back/forward ──────────────────────────────────────────────────

  if (isClient) {
    if (mode === 'hash') {
      window.addEventListener('hashchange', () => {
        _path.set(window.location.hash.slice(1) || '/');
        _query.set(parseQuery(window.location.search));
      });
    } else {
      window.addEventListener('popstate', () => {
        _path.set(window.location.pathname);
        _query.set(parseQuery(window.location.search));
      });
    }
  }

  // ── Global link interception ──────────────────────────────────────────────

  if (isClient && options.interceptLinks === true) {
    document.addEventListener('click', (e: Event) => {
      const anchor = (e.target as Element).closest<HTMLAnchorElement>('a[href]');
      if (anchor === null) return;

      const href = anchor.getAttribute('href');
      if (
        href === null ||
        href.startsWith('http') ||
        href.startsWith('//') ||
        href.startsWith('mailto:') ||
        (anchor.target !== '' && anchor.target !== '_self')
      ) return;

      e.preventDefault();
      navigate(href);
    });
  }

  // ── Outlet ────────────────────────────────────────────────────────────────

  const outlet = (): Interpolation => {
    const match = currentMatch.get();
    if (match === null) return null;

    const { route, params } = match;

    if (route.load !== undefined) {
      _loadVersion.get(); // subscribe — re-renders when any load finishes

      if (!loadedRoutes.has(route)) {
        if (!pendingRoutes.has(route)) {
          pendingRoutes.add(route);
          route.load().then(
            () => {
              loadedRoutes.add(route);
              pendingRoutes.delete(route);
              _loadVersion.set(_loadVersion.peek() + 1);
            },
            () => {
              // Load failed — remove from pending so it can be retried on next render
              pendingRoutes.delete(route);
            },
          );
        }
        return null; // loading — render nothing until module is ready
      }
    }

    return route.render(params);
  };

  // ── link() ────────────────────────────────────────────────────────────────

  const link = (e: Event): void => {
    e.preventDefault();
    const href = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
    if (href !== null) navigate(href);
  };

  return { outlet, navigate, link, currentPath, currentParams, currentQuery };
}

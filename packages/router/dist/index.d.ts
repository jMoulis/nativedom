import { Interpolation, Computed } from '@nativeframe/core';

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

/**
 * A single route definition.
 *
 * @example
 * { path: '/todos/:id', render: ({ id }) => html`<todo-detail todo-id="${id}"></todo-detail>` }
 */
interface Route {
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
interface RouterOptions {
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
interface Router {
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
declare function createRouter(routes: readonly Route[], options?: RouterOptions): Router;

export { type Route, type Router, type RouterOptions, createRouter };

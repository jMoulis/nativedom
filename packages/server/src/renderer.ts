/**
 * @nativedom/server - renderer.ts
 *
 * Server-side rendering utilities.
 * Composes ssrRender() calls into full HTML documents with
 * Declarative Shadow DOM and store hydration.
 */

import { ssrRender } from "@nativedom/core";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RenderOptions {
  /**
   * Title for the HTML document.
   * @default ''
   */
  readonly title?: string;

  /**
   * Initial store state to serialize into the HTML.
   * Will be injected as `window.__NF_STORE__` and picked up by `store.rehydrate()`.
   */
  readonly storeSnapshot?: Record<string, unknown>;

  /**
   * Additional `<head>` content (CSS links, meta tags, etc.)
   */
  readonly head?: string;

  /**
   * JavaScript module entry point(s) to load on the client.
   * @example ['./dist/app.js']
   */
  readonly scripts?: readonly string[];

  /**
   * Language attribute for the `<html>` element.
   * @default 'en'
   */
  readonly lang?: string;
}

export interface RenderedPage {
  /** Full HTML string ready to send as an HTTP response. */
  readonly html: string;
  /** HTTP status code (always 200 from this renderer). */
  readonly status: 200;
  /** Response headers. */
  readonly headers: Readonly<Record<string, string>>;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function buildShell(options: RenderOptions): string {
  const { title = "", head = "", lang = "en" } = options;
  return (
    `<!DOCTYPE html>\n` +
    `<html lang="${escapeAttr(lang)}">\n` +
    `<head>\n` +
    `  <meta charset="UTF-8" />\n` +
    `  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n` +
    (title ? `  <title>${escapeHtml(title)}</title>\n` : "") +
    (head ? `  ${head}\n` : "") +
    `</head>\n` +
    `<body>\n`
  );
}

function buildTail(options: RenderOptions): string {
  const { storeSnapshot, scripts = [] } = options;
  const storeScript =
    storeSnapshot !== undefined
      ? `<script>window.__NF_STORE__ = ${JSON.stringify(storeSnapshot)};</script>`
      : "";
  const scriptTags = scripts
    .map((src) => `<script type="module" src="${escapeAttr(src)}"></script>`)
    .join("\n    ");
  return (
    (storeScript ? `  ${storeScript}\n` : "") +
    (scriptTags ? `  ${scriptTags}\n` : "") +
    `</body>\n` +
    `</html>`
  );
}

// ─── renderPage() ─────────────────────────────────────────────────────────────

/**
 * Render a full HTML page from a component tree.
 *
 * Emits:
 * - Declarative Shadow DOM for island components
 * - Serialized store state as `window.__NF_STORE__` for client rehydration
 * - Module script tags for the client bundle
 *
 * @example
 * // In your server route handler:
 * const page = renderPage('app-root', { user: req.user }, {
 *   title: 'My App',
 *   storeSnapshot: { theme: 'dark', user: req.user },
 *   scripts: ['/dist/app.js'],
 * });
 *
 * res.setHeader('Content-Type', page.headers['Content-Type']);
 * res.status(page.status).send(page.html);
 */
export function renderPage<P extends Record<string, unknown>>(
  rootComponent: string,
  props: P = {} as P,
  options: RenderOptions = {},
): RenderedPage {
  const html =
    buildShell(options) +
    `  ${ssrRender(rootComponent, props)}\n` +
    buildTail(options);

  return {
    html,
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  };
}

// ─── streamPage() ─────────────────────────────────────────────────────────────

/**
 * Stream a full HTML page as an async iterable of string chunks.
 * The shell (<head>) is yielded first so the browser can begin
 * fetching assets before the component body is sent.
 *
 * @example — Node.js http
 * res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
 * for await (const chunk of streamPage('app-root', props, options)) {
 *   res.write(chunk);
 * }
 * res.end();
 *
 * @example — Web standard (Fetch / Bun / Deno / Cloudflare Workers)
 * const stream = ReadableStream.from(streamPage('app-root', props, options));
 * return new Response(stream, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
 */
export async function* streamPage<P extends Record<string, unknown>>(
  rootComponent: string,
  props: P = {} as P,
  options: RenderOptions = {},
): AsyncGenerator<string> {
  yield buildShell(options);
  yield `  ${ssrRender(rootComponent, props)}\n`;
  yield buildTail(options);
}

// ─── renderFragment() ─────────────────────────────────────────────────────────

/**
 * Render a single component to an HTML string fragment.
 * Useful for partial rendering (e.g., streaming, edge rendering).
 *
 * @example
 * const html = renderFragment('app-card', { title: 'Hello' });
 * // → '<app-card title="Hello"><template shadowrootmode="open">...</template></app-card>'
 */
export function renderFragment<P extends Record<string, unknown>>(
  component: string,
  props: P = {} as P,
): string {
  return ssrRender(component, props);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, "&quot;");
}

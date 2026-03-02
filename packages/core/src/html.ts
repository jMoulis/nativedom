/**
 * @nativedom/core - html.ts
 *
 * Isomorphic tagged template literal.
 * - Client → builds real DOM nodes with reactive effects attached directly
 * - Server → produces an HTML string with signals resolved statically
 *
 * Same syntax, two runtimes, zero VDOM.
 */

import { effect, type EffectFn, type EffectHandle } from "./signals.js";
import { DIRECTIVE_BRAND, isContentDirective, type ContentDirective } from "./directives.js";
import { isRef, type Ref } from "./ref.js";

// ─── Types ────────────────────────────────────────────────────────────────────

/** A reactive getter function used as a template interpolation. */
export type ReactiveGetter<T extends Primitive = Primitive> = () => T;

/** Primitive types allowed as static interpolations. */
type Primitive = string | number | boolean | null | undefined;

/** An event handler interpolation (prefixed with @ in templates). */
export type EventHandler<E extends Event = Event> = (event: E) => void;

/** A DOM node or collection of nodes that can be interpolated as children. */
export type NodeValue = Node | Node[] | DocumentFragment;

/** A reactive getter returning node(s) — for list/component interpolation. */
export type NodeGetter = () => NodeValue | readonly string[];

/**
 * Any value allowed as an interpolation inside html``.
 * - Functions are treated as reactive bindings (wrapped in effects)
 * - EventHandlers are attached via addEventListener
 * - Primitives are set once, statically
 * - NodeValue / string[] enable list/component interpolation
 */
export type Interpolation =
  | ReactiveGetter
  | NodeGetter
  | EventHandler
  | Primitive
  | NodeValue
  | readonly string[]
  | ContentDirective
  | Ref<Element>;

/** Binding descriptor produced during template parsing. */
interface ContentBinding {
  readonly type: "content";
  readonly node: Comment;
  readonly index: number;
}

interface AttrBinding {
  readonly type: "attr";
  readonly node: Element;
  readonly index: number;
  readonly attrName: string;
}

interface EventBinding {
  readonly type: "event";
  readonly node: Element;
  readonly index: number;
  readonly eventName: string;
}

interface PropBinding {
  readonly type: "prop";
  readonly node: Element;
  readonly index: number;
  readonly propName: string;
}

interface RefBinding {
  readonly type: "ref";
  readonly node: Element;
  readonly index: number;
}

type Binding = ContentBinding | AttrBinding | EventBinding | PropBinding | RefBinding;

// ─── Constants ────────────────────────────────────────────────────────────────

const MARKER = "__NF__";
const CONTENT_MARKER_RE = /^__NF__(\d+)$/;
const ATTR_MARKER_RE = /__NF__(\d+)/g;
const EVENT_PREFIX = "@";
const PROP_PREFIX  = ".";

// ─── Template cache ───────────────────────────────────────────────────────────

// TemplateStringsArray is the identity key — same template literal = same object reference
const templateCache = new WeakMap<TemplateStringsArray, HTMLTemplateElement>();

// ─── Effect scope ─────────────────────────────────────────────────────────────

/**
 * Module-level pointer to the current component's effect registrar.
 * Set by withEffectScope() during component render; null outside of that.
 */
let _currentScope: ((fn: EffectFn) => EffectHandle) | null = null;

/**
 * Run `run()` with all reactive effects created by html`` bindings
 * routed through `scopedEffect` instead of the global effect().
 *
 * Used by component.ts so html binding effects are lifecycle-bound
 * to the component and disposed on disconnectedCallback.
 */
export function withEffectScope<T>(
  scopedEffect: (fn: EffectFn) => EffectHandle,
  run: () => T,
): T {
  _currentScope = scopedEffect;
  try { return run(); }
  finally { _currentScope = null; }
}

/**
 * Return the currently-active effect registrar, or null if called
 * outside a component render.
 *
 * Used by asyncSignal() so async effects are lifecycle-bound to the
 * enclosing component and disposed on disconnectedCallback.
 */
export function getCurrentScope(): ((fn: EffectFn) => EffectHandle) | null {
  return _currentScope;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Tagged template literal for building DOM or HTML strings.
 *
 * On the **client**: returns a live `DocumentFragment` with reactive
 * effects attached directly to the affected DOM nodes. No VDOM diff.
 *
 * On the **server**: returns a plain `string` with signal values
 * resolved once. Event bindings are silently dropped.
 *
 * @example
 * const count = signal(0);
 *
 * html`
 *   <button @click=${() => count.set(count.get() + 1)}>
 *     Clicked ${() => count.get()} times
 *   </button>
 * `
 */
export function html(
  strings: TemplateStringsArray,
  ...values: readonly Interpolation[]
): DocumentFragment | string {
  if (typeof window === "undefined") {
    return ssrHtml(strings, values);
  }
  return clientHtml(strings, values);
}

// ─── Client implementation ────────────────────────────────────────────────────

function clientHtml(
  strings: TemplateStringsArray,
  values: readonly Interpolation[],
): DocumentFragment {
  // 1. Get or build the cached <template> element
  let template = templateCache.get(strings);
  if (template === undefined) {
    template = buildTemplate(strings);
    templateCache.set(strings, template);
  }

  // 2. Clone — O(n) structural copy, no re-parsing
  const fragment = template.content.cloneNode(true) as DocumentFragment;

  // 3. Locate all binding markers in the clone
  const bindings = collectBindings(fragment);

  // 4. Apply each value to its binding
  for (const binding of bindings) {
    const value = values[binding.index];
    if (value !== undefined) {
      applyBinding(binding, value);
    }
  }

  return fragment;
}

/**
 * Parse the template strings into a cached `<template>` element.
 * Inserts HTML comment nodes as stable anchors for content bindings,
 * and inline markers for attribute bindings.
 */
function buildTemplate(strings: TemplateStringsArray): HTMLTemplateElement {
  let raw = "";

  for (let i = 0; i < strings.length; i++) {
    raw += strings[i];
    if (i < strings.length - 1) {
      // Detect whether we're inside a tag (attribute binding) or in content
      const lastOpen = raw.lastIndexOf("<");
      const lastClose = raw.lastIndexOf(">");
      const inTag = lastOpen > lastClose;

      if (inTag) {
        raw += `${MARKER}${i}`;
      } else {
        raw += `<!--${MARKER}${i}-->`;
      }
    }
  }

  const tmpl = document.createElement("template");
  tmpl.innerHTML = raw;
  return tmpl;
}

/**
 * Walk the cloned fragment to find all binding markers.
 * Uses TreeWalker for efficient DOM traversal without recursion.
 */
function collectBindings(fragment: DocumentFragment): Binding[] {
  const bindings: Binding[] = [];

  const walker = document.createTreeWalker(
    fragment,
    NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_ELEMENT,
  );

  let node: Node | null;
  while ((node = walker.nextNode()) !== null) {
    if (node.nodeType === Node.COMMENT_NODE) {
      const match = CONTENT_MARKER_RE.exec((node as Comment).nodeValue ?? "");
      if (match !== null) {
        bindings.push({
          type: "content",
          node: node as Comment,
          index: parseInt(match[1] ?? "0", 10),
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      // Iterate a snapshot of attributes — we may remove some
      for (const attr of [...el.attributes]) {
        if (attr.name.startsWith(EVENT_PREFIX)) {
          const attrMatch = ATTR_MARKER_RE.exec(attr.value);
          ATTR_MARKER_RE.lastIndex = 0; // reset stateful regex
          if (attrMatch !== null) {
            bindings.push({
              type: "event",
              node: el,
              index: parseInt(attrMatch[1] ?? "0", 10),
              eventName: attr.name.slice(EVENT_PREFIX.length),
            });
          }
        } else if (attr.name.startsWith(PROP_PREFIX)) {
          const attrMatch = ATTR_MARKER_RE.exec(attr.value);
          ATTR_MARKER_RE.lastIndex = 0;
          if (attrMatch !== null) {
            bindings.push({
              type: "prop",
              node: el,
              index: parseInt(attrMatch[1] ?? "0", 10),
              propName: attr.name.slice(PROP_PREFIX.length),
            });
          }
        } else if (attr.name === "ref") {
          const attrMatch = ATTR_MARKER_RE.exec(attr.value);
          ATTR_MARKER_RE.lastIndex = 0;
          if (attrMatch !== null) {
            bindings.push({
              type: "ref",
              node: el,
              index: parseInt(attrMatch[1] ?? "0", 10),
            });
          }
        } else {
          const attrMatch = ATTR_MARKER_RE.exec(attr.value);
          ATTR_MARKER_RE.lastIndex = 0;
          if (attrMatch !== null) {
            bindings.push({
              type: "attr",
              node: el,
              index: parseInt(attrMatch[1] ?? "0", 10),
              attrName: attr.name,
            });
          }
        }
      }
    }
  }

  return bindings;
}

/**
 * Apply a single binding value to its target node.
 *
 * - `content`: replace the comment marker with reactive children (text, node, or array)
 * - `attr`: set an attribute (reactively if value is a function)
 * - `prop`: set an IDL property directly (reactively if value is a function)
 * - `event`: attach an event listener and remove the @attr from DOM
 */
function applyBinding(binding: Binding, value: Interpolation): void {
  const scopedEffect = _currentScope ?? effect;

  switch (binding.type) {
    case "event": {
      if (typeof value === "function") {
        binding.node.addEventListener(
          binding.eventName,
          value as EventListener,
        );
      }
      binding.node.removeAttribute(`${EVENT_PREFIX}${binding.eventName}`);
      break;
    }

    case "prop": {
      binding.node.removeAttribute(`${PROP_PREFIX}${binding.propName}`);
      const setProp = (val: unknown): void => {
        (binding.node as unknown as Record<string, unknown>)[binding.propName] = val;
      };
      if (typeof value === "function") {
        scopedEffect(() => { setProp((value as ReactiveGetter)()); });
      } else {
        setProp(value);
      }
      break;
    }

    case "content": {
      const anchor = binding.node;

      // Content directives (e.g. repeat()) take direct control of the anchor.
      if (isContentDirective(value)) {
        value._apply(anchor, scopedEffect);
        break;
      }

      // Keep the comment node as a stable end-anchor so we can insert/remove
      // sibling nodes before it on each reactive update.
      let currentNodes: ChildNode[] = [];

      const replace = (val: unknown): void => {
        for (const n of currentNodes) n.parentNode?.removeChild(n);
        currentNodes = [];
        for (const n of toNodes(val)) {
          anchor.parentNode?.insertBefore(n, anchor);
          currentNodes.push(n as ChildNode);
        }
      };

      if (typeof value === "function") {
        scopedEffect(() => replace((value as () => unknown)()));
      } else {
        replace(value);
      }
      break;
    }

    case "ref": {
      binding.node.removeAttribute("ref");
      if (isRef(value)) {
        (value as Ref<Element>).el = binding.node;
      }
      break;
    }

    case "attr": {
      if (typeof value === "function") {
        scopedEffect(() => {
          binding.node.setAttribute(
            binding.attrName,
            stringify((value as ReactiveGetter)()),
          );
        });
      } else {
        binding.node.setAttribute(
          binding.attrName,
          stringify(value as Primitive),
        );
      }
      break;
    }
  }
}

// ─── Server implementation ────────────────────────────────────────────────────

/**
 * Server-side tagged template implementation.
 * Resolves reactive getters once (no effects registered).
 * Event handlers are silently dropped — they have no meaning on the server.
 *
 * @internal — called automatically by `html` when `window` is undefined
 */
export function ssrHtml(
  strings: TemplateStringsArray | readonly string[],
  values: readonly Interpolation[],
): string {
  let result = "";

  for (let i = 0; i < strings.length; i++) {
    const str = strings[i] ?? "";

    if (i < values.length) {
      const value = values[i];

      // Detect event/prop attribute: the current string ends with `@eventName=` or `.propName=`
      // e.g. `<button @click=` or `<input .value=` — strip it from the already-appended str
      const isSkippedAttr = /\s([@.][\w:-]+|ref)=["']?$/.test(str.trimEnd());

      if (isSkippedAttr) {
        // Strip the `@eventName=` / `.propName=` / `ref=` part from the string before appending
        result += str.replace(/\s([@.][\w:-]+|ref)=["']?$/, "");
        // Drop the value (meaningless on server)
        continue;
      }

      result += str;

      // Resolve reactive getters; then handle arrays (pre-rendered html`` strings)
      // vs primitives (user content that must be escaped).
      const resolved = typeof value === "function"
        ? (value as () => unknown)()
        : value;

      if (isContentDirective(resolved)) {
        result += resolved._ssr();
      } else if (Array.isArray(resolved)) {
        // Treat string arrays as trusted HTML (produced by server-side html`` map())
        result += (resolved as unknown[]).map(v =>
          typeof v === "string" ? v : escapeHtml(stringify(v as Primitive)),
        ).join("");
      } else {
        result += escapeHtml(stringify(resolved as Primitive));
      }
    } else {
      result += str;
    }
  }

  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert any interpolation value to an array of DOM Nodes.
 * - DocumentFragment → its child nodes (transferred out of the fragment)
 * - Node → wrapped in array
 * - Array → recursively flattened
 * - Anything else → text node
 */
function toNodes(val: unknown): Node[] {
  if (val instanceof DocumentFragment) return [...val.childNodes];
  if (val instanceof Node) return [val];
  if (Array.isArray(val)) return (val as unknown[]).flatMap(toNodes);
  return [document.createTextNode(stringify(val as Primitive))];
}

function stringify(value: Primitive): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── Slot type ────────────────────────────────────────────────────────────────

/**
 * The type for component slot props (children, named slots).
 *
 * A convenient alias for Interpolation — use this to declare that a component
 * prop accepts projected content:
 *
 * @example
 * type CardProps = { title: string; children?: Slot; footer?: Slot };
 *
 * const Card = component<CardProps>('my-card', ({ title, children, footer }, { html }) =>
 *   html`
 *     <h2>${title}</h2>
 *     <div class="body">${children}</div>
 *     <div class="footer">${footer}</div>
 *   `
 * );
 *
 * // Usage — any Interpolation is valid: DocumentFragment, reactive getter,
 * // repeat() directive, plain string, etc.
 * Card({
 *   title: 'Hello',
 *   children: html`<p>Body content</p>`,
 *   footer: () => `Updated: ${new Date().toLocaleDateString()}`,
 * })
 */
export type Slot = Interpolation;

// ─── trustedHtml ──────────────────────────────────────────────────────────────

/**
 * Wrap a pre-rendered HTML string as a slot-compatible value that will be
 * inserted **without escaping** — both on the server and the client.
 *
 * This is the right tool for passing server-rendered children through
 * `ssrRender()` without double-escaping:
 *
 * @example
 * // Server-side
 * ssrRender('my-card', {
 *   children: trustedHtml(ssrRender('inner-component', {})),
 * });
 *
 * On the client the string is parsed into DOM nodes via a `<template>` element.
 * Event handlers and reactive bindings inside the string will NOT be active —
 * use `html\`\`` template literals for live client content.
 */
export function trustedHtml(htmlStr: string): ContentDirective {
  return {
    [DIRECTIVE_BRAND]: true,
    _apply(anchor: Comment): void {
      const tmp = document.createElement("template");
      tmp.innerHTML = htmlStr;
      anchor.parentNode?.insertBefore(tmp.content, anchor);
    },
    _ssr(): string { return htmlStr; },
  };
}

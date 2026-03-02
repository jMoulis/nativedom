/**
 * @nativeframe/core - component.ts
 *
 * Isomorphic component system built on Custom Elements.
 * One definition → Custom Element on the client, Declarative Shadow DOM on the server.
 */

import { type Signal, type Computed, type EffectHandle, type EffectFn, signal, effect, computed, batch } from './signals.js';
import { html, ssrHtml, withEffectScope, type Interpolation } from './html.js';
import { DIRECTIVE_BRAND, type ContentDirective } from './directives.js';
import { type Context } from './context.js';
import { type Ref, createRef } from './ref.js';

// ─── Public types ─────────────────────────────────────────────────────────────

/**
 * The context object passed to every component render function.
 * Provides reactive primitives scoped to the component lifecycle.
 */
export interface ComponentContext {
  /** Create a signal scoped to this component. Auto-disposed on unmount. */
  signal<T>(initialValue: T): Signal<T>;

  /** Create a computed scoped to this component. */
  computed<T>(fn: () => T): Computed<T>;

  /** Batch multiple signal updates. */
  batch(fn: () => void): void;

  /** Create an effect scoped to this component. Auto-disposed on unmount. */
  effect(fn: EffectFn): EffectHandle;

  /**
   * Watch a reactive getter and call callback whenever its value changes.
   * Unlike `effect`, the callback is NOT called on the initial run (mount).
   * The getter is tracked immediately so signal dependencies are established.
   * Disposed automatically on disconnectedCallback.
   */
  watch<T>(getter: () => T, callback: (newVal: T, oldVal: T) => void): void;

  /** The html tagged template literal. */
  html: typeof html;

  /** Register a callback to run after the element mounts into the DOM. */
  onMount(callback: () => void): void;

  /** Register a callback to run before the element unmounts from the DOM. */
  onUnmount(callback: () => void): void;

  /**
   * Make a value available to all descendant components that call `inject`.
   * If T is a Signal, descendants receive the live signal and can react to changes.
   */
  provide<T>(context: Context<T>, value: T): void;

  /**
   * Retrieve the nearest ancestor's provided value for this context.
   * Returns `context._defaultValue` when no ancestor has called `provide`.
   */
  inject<T>(context: Context<T>): T;

  /**
   * Create a ref that will be populated with the target DOM element when
   * the template renders. Access via `ref.el` in `onMount` or event handlers.
   *
   * @example
   * const inputRef = ctx.ref<HTMLInputElement>();
   * ctx.onMount(() => { inputRef.el?.focus(); });
   * return html`<input ref="${inputRef}" type="text" />`;
   */
  ref<T extends Element>(): Ref<T>;
}

/**
 * A component render function.
 * Receives typed props and a reactive context.
 * Returns a DocumentFragment (client) or string (server).
 */
export type ComponentFn<P extends object> = (
  props: Readonly<P>,
  ctx: ComponentContext,
) => DocumentFragment | string;

/**
 * A typed factory function returned by `component()`.
 *
 * Calling the factory creates the component's element with fully type-checked
 * props, making it suitable for use inside `html` templates as a replacement
 * for raw string attribute interpolation.
 *
 * On the **client** it returns an `HTMLElement` (a DOM `NodeValue`).
 * On the **server** it returns a `ContentDirective` that emits the element's
 * opening/closing tags with serialized attributes.
 *
 * @example
 * export const TodoItem = component<{ 'todo-id': string; done: boolean }>(
 *   'todo-item', (props, ctx) => { ... }
 * );
 *
 * // Type-checked — TS error if prop name/type is wrong:
 * html`<ul>${() => todos.map(t => TodoItem({ 'todo-id': t.id, done: t.done }))}</ul>`
 */
export type ComponentFactory<P extends object> =
  (props?: Partial<P>) => Interpolation;

/**
 * Options controlling Shadow DOM, SSR behavior, and attribute observation.
 */
export interface ComponentOptions {
  /**
   * Whether to use Shadow DOM.
   * @default true
   */
  readonly shadow?: boolean;

  /**
   * Shadow DOM encapsulation mode.
   * @default 'open'
   */
  readonly shadowMode?: 'open' | 'closed';

  /**
   * HTML attribute names to observe for changes.
   * Observed attributes trigger a re-render when changed.
   * @default []
   */
  readonly observedAttrs?: readonly string[];

  /**
   * Mark this component as an SSR island.
   * Islands emit a `nf-ssr` attribute in server output,
   * signaling the client runtime to hydrate (not re-render) on load.
   * @default false
   */
  readonly island?: boolean;

  /**
   * Called when the component's render function or a reactive effect throws.
   * Return a fallback Interpolation to display in place of the crashed content.
   * If not provided, errors are re-thrown (preserving existing behaviour).
   */
  onError?: (err: unknown) => Interpolation;

  /**
   * CSS string scoped to this component.
   * - `shadow: true`  → adopted as a Constructable Stylesheet on each shadow root instance.
   * - `shadow: false` → injected once into <head> wrapped in `@scope (tag-name) { ... }`.
   * Use `:scope` to target the component root element, `.class` for descendants.
   * SSR: call `getComponentStyles()` and inject the result into renderPage's `head` option.
   */
  styles?: string;
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface ComponentDefinition<P extends object> {
  readonly name: string;
  readonly fn: ComponentFn<P>;
  readonly options: {
    readonly shadow: boolean;
    readonly shadowMode: 'open' | 'closed';
    readonly observedAttrs: readonly string[];
    readonly island: boolean;
    readonly onError: ((err: unknown) => Interpolation) | undefined;
    readonly styles: string | undefined;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDefinition = ComponentDefinition<any>;

// ─── Provider map ─────────────────────────────────────────────────────────────

/** Maps each provider element to its provided context values. */
const providerMap = new WeakMap<Element, Map<symbol, unknown>>();

// ─── Registry ─────────────────────────────────────────────────────────────────

const registry = new Map<string, AnyDefinition>();

// ─── component() ─────────────────────────────────────────────────────────────

/**
 * Define a new NativeFrame component.
 *
 * The same definition is used on both client and server:
 * - **Client**: registers a Custom Element with full signal reactivity
 * - **Server**: registers a render function that emits Declarative Shadow DOM
 *
 * @example
 * interface CounterProps {
 *   initialCount?: number;
 * }
 *
 * component<CounterProps>('app-counter', (props, { signal, html }) => {
 *   const count = signal(props.initialCount ?? 0);
 *
 *   return html`
 *     <button @click=${() => count.set(count.get() - 1)}>−</button>
 *     <span>${() => count.get()}</span>
 *     <button @click=${() => count.set(count.get() + 1)}>+</button>
 *   `;
 * }, { island: true });
 */
export function component<P extends object = Record<string, unknown>>(
  name: string,
  fn: ComponentFn<P>,
  options: ComponentOptions = {},
): ComponentFactory<P> {
  if (!name.includes('-')) {
    throw new Error(
      `[nativeframe] Component name "${name}" must contain a hyphen (Custom Elements spec).`,
    );
  }

  const definition: ComponentDefinition<P> = {
    name,
    fn,
    options: {
      shadow: options.shadow ?? true,
      shadowMode: options.shadowMode ?? 'open',
      observedAttrs: options.observedAttrs ?? [],
      island: options.island ?? false,
      onError: options.onError,
      styles: options.styles,
    },
  };

  registry.set(name, definition);

  if (typeof window !== 'undefined') {
    registerClientElement(definition);
  }

  return createFactory<P>(name);
}

// ─── ssrRender() ──────────────────────────────────────────────────────────────

/**
 * Server-side render a component to an HTML string.
 * Wraps output in a Declarative Shadow DOM `<template shadowrootmode>` if `shadow: true`.
 *
 * The browser attaches this Shadow DOM natively before any JS executes,
 * giving true SSR with zero Flash of Unstyled Content (FOUC).
 *
 * @example
 * ssrRender('app-counter', { initialCount: 5 });
 * // → '<app-counter nf-ssr initialcount="5"><template shadowrootmode="open">...</template></app-counter>'
 */
export function ssrRender<P extends object>(
  name: string,
  props: P = {} as P,
): string {
  const def = registry.get(name);
  if (def === undefined) {
    throw new Error(`[nativeframe] Unknown component: "${name}". Did you forget to import it?`);
  }

  const ctx = buildServerContext();
  // Establish a no-op effect scope so that asyncSignal() (and anything else
  // using getCurrentScope()) receives a safe registrar instead of falling
  // back to the global effect(), which would leak on the server.
  const noOp = (_fn: EffectFn): EffectHandle => ({ dispose: () => {} });
  const content = withEffectScope(noOp, () => def.fn(props, ctx));
  const attrsHtml = serializeAttrs(props as Record<string, unknown>, def.options.island);

  if (def.options.shadow) {
    return (
      `<${name}${attrsHtml}>` +
      `<template shadowrootmode="${def.options.shadowMode}">` +
      (def.options.styles ? `<style>${def.options.styles}</style>` : '') +
      String(content) +
      `</template>` +
      `</${name}>`
    );
  }

  return `<${name}${attrsHtml}>${String(content)}</${name}>`;
}

// ─── Scoped CSS helpers ───────────────────────────────────────────────────────

function injectStyles(name: string, css: string): void {
  if (document.querySelector(`style[data-nf="${name}"]`) !== null) return;
  const style = document.createElement('style');
  style.dataset['nf'] = name;
  style.textContent = `@scope (${name}) {\n${css}\n}`;
  document.head.appendChild(style);
}

// ─── Client Custom Element ────────────────────────────────────────────────────

function registerClientElement<P extends object>(
  def: ComponentDefinition<P>,
): void {
  const { name, fn, options } = def;

  if (customElements.get(name) !== undefined) return;

  // Inject scoped styles once for shadow:false components.
  if (!options.shadow && options.styles !== undefined) {
    injectStyles(name, options.styles);
  }

  // Constructable Stylesheet for shadow:true — created once per component type.
  let componentSheet: CSSStyleSheet | undefined;
  if (options.shadow && options.styles !== undefined) {
    try {
      componentSheet = new CSSStyleSheet();
      componentSheet.replaceSync(options.styles);
    } catch { /* env doesn't support CSSStyleSheet — fallback used in #render */ }
  }

  class NativeFrameElement extends HTMLElement {
    readonly #effectHandles: EffectHandle[] = [];
    readonly #mountCallbacks: Array<() => void> = [];
    readonly #unmountCallbacks: Array<() => void> = [];
    readonly #refs: Ref<Element>[] = [];

    static get observedAttributes(): readonly string[] {
      return options.observedAttrs;
    }

    connectedCallback(): void {
      // Adopt the constructable stylesheet on each shadow root instance.
      if (componentSheet !== undefined) {
        const sr = this.shadowRoot ?? this.attachShadow({ mode: options.shadowMode });
        if (!sr.adoptedStyleSheets.includes(componentSheet)) {
          sr.adoptedStyleSheets = [componentSheet, ...sr.adoptedStyleSheets];
        }
      }
      this.#render();
      this.#mountCallbacks.forEach(cb => { cb(); });
    }

    disconnectedCallback(): void {
      this.#effectHandles.forEach(h => { h.dispose(); });
      this.#effectHandles.length = 0;
      this.#unmountCallbacks.forEach(cb => { cb(); });
      for (const r of this.#refs) { r.el = null; }
      this.#refs.length = 0;
    }

    attributeChangedCallback(_name: string, oldVal: string | null, newVal: string | null): void {
      if (oldVal === newVal) return;
      this.#render();
    }

    #render(): void {
      const root: ShadowRoot | this = options.shadow
        ? (this.shadowRoot ?? this.attachShadow({ mode: options.shadowMode }))
        : this;

      // Hydration path — DOM already built by Declarative Shadow DOM; skip re-render entirely.
      // fn() is NOT called: no orphaned effects, no wasted work.
      if (root.childNodes.length > 0 && this.hasAttribute('nf-ssr')) {
        this.removeAttribute('nf-ssr');
        return;
      }

      // Null out refs from the previous render before fn() creates new ones.
      for (const r of this.#refs) { r.el = null; }
      this.#refs.length = 0;

      const ctx = this.#buildContext();
      const props = this.#parseProps();

      // Fallback <style> for shadow:true when CSSStyleSheet isn't supported.
      if (options.shadow && options.styles !== undefined && componentSheet === undefined) {
        if (root.querySelector('style[data-nf]') === null) {
          const style = document.createElement('style');
          style.dataset['nf'] = name;
          style.textContent = options.styles;
          root.appendChild(style);
        }
      }

      const effectsBefore = this.#effectHandles.length;
      try {
        // Route all html`` binding effects through ctx.effect so they are
        // tracked in #effectHandles and disposed on disconnectedCallback.
        const fragment = withEffectScope(ctx.effect, () => fn(props, ctx));
        root.replaceChildren(fragment);
      } catch (err) {
        // Dispose effects registered during the failed render only.
        for (let i = effectsBefore; i < this.#effectHandles.length; i++) {
          this.#effectHandles[i]?.dispose();
        }
        this.#effectHandles.length = effectsBefore;

        if (options.onError !== undefined) {
          console.error(`[nativeframe] <${this.tagName.toLowerCase()}>:`, err);
          try {
            const fallback = options.onError(err);
            if (fallback instanceof DocumentFragment) {
              root.replaceChildren(fallback);
            } else {
              root.innerHTML = typeof fallback === 'string' ? fallback : String(fallback ?? '');
            }
          } catch { root.innerHTML = ''; }
        } else {
          throw err;
        }
      }
    }

    #parseProps(): P {
      const props: Record<string, unknown> = {};

      for (const attr of this.attributes) {
        if (attr.name === 'nf-ssr') continue;
        try {
          props[attr.name] = JSON.parse(attr.value) as unknown;
        } catch {
          props[attr.name] = attr.value;
        }
      }

      // Merge JS-level props (for non-serializable values: objects, functions, signals)
      const jsProps = (this as unknown as { _nfProps?: Record<string, unknown> })._nfProps;
      if (jsProps !== undefined) {
        Object.assign(props, jsProps);
      }

      return props as P;
    }

    #buildContext(): ComponentContext {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;

      return {
        signal<T>(initialValue: T): Signal<T> {
          return signal(initialValue);
        },

        computed<T>(fn: () => T): Computed<T> {
          return computed(fn);
        },

        batch,

        effect(fn: EffectFn): EffectHandle {
          const handle = options.onError !== undefined
            ? effect(() => {
                try { fn(); }
                catch (err) {
                  console.error(`[nativeframe] effect error in <${self.tagName.toLowerCase()}>:`, err);
                }
              })
            : effect(fn);
          self.#effectHandles.push(handle);
          return handle;
        },

        watch<T>(getter: () => T, callback: (newVal: T, oldVal: T) => void): void {
          let prev!: T;
          let initialized = false;
          const handle = effect(() => {
            const cur = getter();
            if (!initialized) { initialized = true; prev = cur; return; }
            callback(cur, prev);
            prev = cur;
          });
          self.#effectHandles.push(handle);
        },

        html,

        onMount(callback: () => void): void {
          self.#mountCallbacks.push(callback);
        },

        onUnmount(callback: () => void): void {
          self.#unmountCallbacks.push(callback);
        },

        provide<T>(context: Context<T>, value: T): void {
          let map = providerMap.get(self);
          if (map === undefined) {
            map = new Map<symbol, unknown>();
            providerMap.set(self, map);
          }
          map.set(context._id, value);
        },

        inject<T>(context: Context<T>): T {
          let el: Element | null = self.parentElement;
          while (el !== null) {
            const map = providerMap.get(el);
            if (map !== undefined && map.has(context._id)) {
              return map.get(context._id) as T;
            }
            el = el.parentElement;
          }
          return context._defaultValue;
        },

        ref<T extends Element>(): Ref<T> {
          const r = createRef<T>();
          self.#refs.push(r as Ref<Element>);
          return r;
        },
      };
    }
  }

  customElements.define(name, NativeFrameElement);
}

// ─── Server context ───────────────────────────────────────────────────────────

/**
 * Build a static, no-op context for server-side rendering.
 * Signals hold initial values. Effects are never registered.
 */
function buildServerContext(): ComponentContext {
  return {
    signal<T>(initialValue: T): Signal<T> {
      return {
        get: () => initialValue,
        peek: () => initialValue,
        set: () => { /* no-op on server */ },
      };
    },

    computed<T>(fn: () => T): Computed<T> {
      const value = fn();
      return { get: () => value, peek: () => value };
    },

    batch(fn: () => void): void { fn(); },

    effect(_fn: EffectFn): EffectHandle {
      return { dispose: () => { /* no-op */ } };
    },

    watch: () => { /* no-op on server */ },

    html: (strings: TemplateStringsArray, ...values: Interpolation[]) =>
      ssrHtml(strings, values),

    onMount: () => { /* no-op on server */ },
    onUnmount: () => { /* no-op on server */ },

    provide: () => { /* no-op on server — no DOM tree */ },
    inject: <T>(context: Context<T>): T => context._defaultValue,
    ref: <T extends Element>(): Ref<T> => createRef<T>(),
  };
}

// ─── Component factory ────────────────────────────────────────────────────────

/**
 * Build the isomorphic typed factory for a registered component.
 *
 * - Client: creates an HTMLElement and sets primitives as attributes,
 *   non-primitives via the _nfProps JS property.
 * - Server: returns a ContentDirective whose _ssr() emits the element tag
 *   with serialized attributes (raw, unescaped — trusted internal output).
 */
function createFactory<P extends object>(name: string): ComponentFactory<P> {
  return (props?: Partial<P>): Interpolation => {
    if (typeof window === 'undefined') {
      // Server path — return a directive so ssrHtml inserts raw HTML rather
      // than escaping the tag string as user content.
      const directive: ContentDirective = {
        [DIRECTIVE_BRAND]: true,
        _apply() { /* no-op on server */ },
        _ssr(): string {
          return `<${name}${propsToAttrs(props)}></${name}>`;
        },
      };
      return directive;
    }

    // Client path — create the real Custom Element.
    const el = document.createElement(name);
    if (props) {
      const jsProps: Record<string, unknown> = {};
      let hasJsProps = false;
      for (const [key, value] of Object.entries(props)) {
        if (value === null || value === undefined) continue;
        if (typeof value === 'object' || typeof value === 'function') {
          jsProps[key] = value;
          hasJsProps = true;
        } else {
          el.setAttribute(key, String(value));
        }
      }
      if (hasJsProps) {
        (el as unknown as { _nfProps: Record<string, unknown> })._nfProps = jsProps;
      }
    }
    return el;
  };
}

/** Serialize a props object into an HTML attribute string, e.g. ` foo="bar" count="3"`. */
function propsToAttrs(props: Partial<Record<string, unknown>> | undefined): string {
  if (!props) return '';
  let attrs = '';
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'object' || typeof value === 'function') continue;
    attrs += ` ${key}="${String(value).replace(/"/g, '&quot;')}"`;
  }
  return attrs;
}

// ─── Serialization helpers ────────────────────────────────────────────────────

function serializeAttrs(props: Record<string, unknown>, isIsland: boolean): string {
  let attrs = isIsland ? ' nf-ssr' : '';

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'function') continue;
    const serialized = typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);
    attrs += ` ${key}="${serialized.replace(/"/g, '&quot;')}"`;
  }

  return attrs;
}

// ─── SSR style helpers ────────────────────────────────────────────────────────

/**
 * Collect all `@scope`-wrapped CSS for `shadow:false` components.
 * Inject the result into `renderPage`'s `head` option:
 *
 * @example
 * renderPage('my-app', {}, { head: `<style>${getComponentStyles()}</style>` })
 */
export function getComponentStyles(): string {
  let css = '';
  for (const [name, def] of registry) {
    if (def.options.styles === undefined || def.options.shadow) continue;
    css += `@scope (${name}) {\n${def.options.styles}\n}\n`;
  }
  return css;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export { registry };

/**
 * @nativedom/core - signals.ts
 *
 * Fine-grained reactivity without any Virtual DOM.
 * Zero dependencies. Pure TypeScript.
 */
/**
 * A reactive container for a value of type T.
 * Reading inside an effect automatically subscribes to changes.
 */
interface Signal<T> {
    /** Read the value and register the current effect as a subscriber. */
    get(): T;
    /** Write a new value and notify all subscribers. */
    set(value: T): void;
    /** Read the value WITHOUT registering as a subscriber. */
    peek(): T;
}
/**
 * A read-only derived signal. Recomputes only when its dependencies change.
 */
interface Computed<T> {
    get(): T;
    peek(): T;
}
/**
 * Handle returned by `effect()`. Call `dispose()` to stop the effect
 * and unsubscribe from all signals it was tracking.
 */
interface EffectHandle {
    dispose(): void;
}
/**
 * An effect function. May return a cleanup function that runs
 * before the next execution or on dispose.
 */
type EffectFn = () => void | (() => void);
/**
 * Creates a reactive signal — the fundamental unit of state.
 *
 * @example
 * const count = signal(0);
 * count.get();     // 0 — tracked if inside an effect
 * count.set(1);    // notifies subscribers
 * count.peek();    // 1 — untracked read
 *
 * const user = signal<User | null>(null);
 * user.set({ name: 'Alice' }); // ✅
 * user.set(42);                // ❌ Type error
 */
declare function signal<T>(initialValue: T): Signal<T>;
/**
 * Creates a reactive side-effect.
 * Automatically tracks signal reads and re-runs when any dependency changes.
 * Returns a handle to manually stop and clean up the effect.
 *
 * @example
 * const name = signal('Alice');
 *
 * const { dispose } = effect(() => {
 *   document.title = name.get(); // auto-tracked
 *   return () => console.log('cleanup'); // optional cleanup
 * });
 *
 * name.set('Bob'); // → effect re-runs
 * dispose();       // → stops the effect, runs cleanup
 */
declare function effect(fn: EffectFn): EffectHandle;
/**
 * Creates a derived, read-only signal.
 * Lazily memoized — recomputes only when its signal dependencies change.
 *
 * @example
 * const firstName = signal('Alice');
 * const lastName  = signal('Smith');
 * const fullName  = computed(() => `${firstName.get()} ${lastName.get()}`);
 *
 * fullName.get(); // 'Alice Smith'
 * lastName.set('Jones');
 * fullName.get(); // 'Alice Jones' — recomputed
 */
declare function computed<T>(fn: () => T): Computed<T>;
/**
 * Groups multiple signal updates into a single notification pass.
 * Prevents intermediate renders when updating several signals at once.
 *
 * @example
 * batch(() => {
 *   x.set(1);
 *   y.set(2);
 *   z.set(3);
 * });
 * // → all effects that depend on x, y, or z run once — not three times
 */
declare function batch(fn: () => void): void;
/**
 * Reads signals inside `fn` without registering any subscriptions.
 * Useful to access current values inside effects without creating dependencies.
 *
 * @example
 * effect(() => {
 *   trigger.get(); // tracked — effect re-runs when trigger changes
 *   const snap = untrack(() => expensiveSignal.get()); // NOT tracked
 * });
 */
declare function untrack<T>(fn: () => T): T;

/**
 * @nativedom/core - context.ts
 *
 * Provide/inject — pass data down the component tree without explicit prop threading.
 *
 * @example
 * const ThemeCtx = createContext<'light' | 'dark'>('light');
 *
 * // Provider component:
 * component('app-shell', (_, ctx) => {
 *   ctx.provide(ThemeCtx, 'dark');
 *   return html`...`;
 * });
 *
 * // Consumer component (any descendant):
 * component('app-button', (_, ctx) => {
 *   const theme = ctx.inject(ThemeCtx); // 'dark'
 *   return html`<button class="${theme}">...</button>`;
 * });
 *
 * For reactive context, set T = Signal<...> and provide a signal:
 *
 * const UserCtx = createContext<Signal<User | null>>(signal(null));
 * ctx.provide(UserCtx, userSignal);
 *
 * const user = ctx.inject(UserCtx); // Signal<User | null>
 * html`<span>${() => user.get()?.name}</span>`
 */
/**
 * A typed context descriptor created by `createContext()`.
 * Pass it to `ctx.provide()` and `ctx.inject()`.
 */
interface Context<T> {
    /** Unique symbol identifying this context. */
    readonly _id: symbol;
    /** Fallback value returned when no provider is found in the tree. */
    readonly _defaultValue: T;
}
/**
 * Create a new context descriptor with a default value.
 * The default is returned by `inject` when no ancestor has called `provide`.
 */
declare function createContext<T>(defaultValue: T): Context<T>;

/**
 * @nativedom/core - ref.ts
 *
 * Refs — a way to get a direct handle to a DOM element from inside a template.
 *
 * @example
 * component('my-input', (_, ctx) => {
 *   const inputRef = ctx.ref<HTMLInputElement>();
 *
 *   ctx.onMount(() => { inputRef.el?.focus(); });
 *
 *   return html`<input ref="${inputRef}" type="text" />`;
 * });
 */
declare const REF_BRAND: unique symbol;
/**
 * A ref object whose `el` property is populated when the element mounts.
 * Pass it to a `ref="${refObj}"` binding in an html`` template.
 *
 * `el` is typed as `T | null`:
 *   - `null` before the component mounts or after it disconnects
 *   - `T` while the component is connected to the DOM
 */
interface Ref<T extends Element = Element> {
    readonly [REF_BRAND]: true;
    el: T | null;
}
declare function createRef<T extends Element>(): Ref<T>;

/**
 * @nativedom/core - directives.ts
 *
 * Base infrastructure for content directives — special interpolation values
 * that take direct control over a content binding's anchor node.
 *
 * Kept separate from html.ts to avoid circular imports:
 *   html.ts  → directives.ts  (no cycle)
 *   repeat.ts → directives.ts (no cycle)
 *   repeat.ts → html.ts       (no cycle)
 */

/** Unique symbol used to brand content directives at runtime. */
declare const DIRECTIVE_BRAND: unique symbol;
/**
 * A content directive controls a binding's anchor node directly,
 * enabling optimised DOM management (e.g. keyed list reconciliation).
 *
 * Produced by helpers such as repeat(). Not intended to be implemented
 * by end users.
 */
interface ContentDirective {
    readonly [DIRECTIVE_BRAND]: true;
    /**
     * Client: install reactive behaviour against the anchor comment node.
     * @param anchor        Stable end-anchor comment node for this binding's DOM range.
     * @param scopedEffect  Effect registrar scoped to the owning component's lifecycle.
     */
    _apply(anchor: Comment, scopedEffect: (fn: EffectFn) => EffectHandle): void;
    /** Server: produce an HTML string (no DOM, no effects). */
    _ssr(): string;
}
declare function isContentDirective(value: unknown): value is ContentDirective;

/**
 * @nativedom/core - html.ts
 *
 * Isomorphic tagged template literal.
 * - Client → builds real DOM nodes with reactive effects attached directly
 * - Server → produces an HTML string with signals resolved statically
 *
 * Same syntax, two runtimes, zero VDOM.
 */

/** A reactive getter function used as a template interpolation. */
type ReactiveGetter<T extends Primitive = Primitive> = () => T;
/** Primitive types allowed as static interpolations. */
type Primitive = string | number | boolean | null | undefined;
/** An event handler interpolation (prefixed with @ in templates). */
type EventHandler<E extends Event = Event> = (event: E) => void;
/** A DOM node or collection of nodes that can be interpolated as children. */
type NodeValue = Node | Node[] | DocumentFragment;
/** A reactive getter returning node(s) — for list/component interpolation. */
type NodeGetter = () => NodeValue | readonly string[];
/**
 * Any value allowed as an interpolation inside html``.
 * - Functions are treated as reactive bindings (wrapped in effects)
 * - EventHandlers are attached via addEventListener
 * - Primitives are set once, statically
 * - NodeValue / string[] enable list/component interpolation
 */
type Interpolation = ReactiveGetter | NodeGetter | EventHandler | Primitive | NodeValue | readonly string[] | ContentDirective | Ref<Element>;
/**
 * Run `run()` with all reactive effects created by html`` bindings
 * routed through `scopedEffect` instead of the global effect().
 *
 * Used by component.ts so html binding effects are lifecycle-bound
 * to the component and disposed on disconnectedCallback.
 */
declare function withEffectScope<T>(scopedEffect: (fn: EffectFn) => EffectHandle, run: () => T): T;
/**
 * Return the currently-active effect registrar, or null if called
 * outside a component render.
 *
 * Used by asyncSignal() so async effects are lifecycle-bound to the
 * enclosing component and disposed on disconnectedCallback.
 */
declare function getCurrentScope(): ((fn: EffectFn) => EffectHandle) | null;
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
declare function html(strings: TemplateStringsArray, ...values: readonly Interpolation[]): DocumentFragment | string;
/**
 * Server-side tagged template implementation.
 * Resolves reactive getters once (no effects registered).
 * Event handlers are silently dropped — they have no meaning on the server.
 *
 * @internal — called automatically by `html` when `window` is undefined
 */
declare function ssrHtml(strings: TemplateStringsArray | readonly string[], values: readonly Interpolation[]): string;
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
type Slot = Interpolation;
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
declare function trustedHtml(htmlStr: string): ContentDirective;

/**
 * @nativedom/core - component.ts
 *
 * Isomorphic component system built on Custom Elements.
 * One definition → Custom Element on the client, Declarative Shadow DOM on the server.
 */

/**
 * The context object passed to every component render function.
 * Provides reactive primitives scoped to the component lifecycle.
 */
interface ComponentContext {
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
type ComponentFn<P extends object> = (props: Readonly<P>, ctx: ComponentContext) => DocumentFragment | string;
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
type ComponentFactory<P extends object> = (props?: Partial<P>) => Interpolation;
/**
 * Options controlling Shadow DOM, SSR behavior, and attribute observation.
 */
interface ComponentOptions {
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
type AnyDefinition = ComponentDefinition<any>;
declare const registry: Map<string, AnyDefinition>;
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
declare function component<P extends object = Record<string, unknown>>(name: string, fn: ComponentFn<P>, options?: ComponentOptions): ComponentFactory<P>;
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
declare function ssrRender<P extends object>(name: string, props?: P): string;
/**
 * Collect all `@scope`-wrapped CSS for `shadow:false` components.
 * Inject the result into `renderPage`'s `head` option:
 *
 * @example
 * renderPage('my-app', {}, { head: `<style>${getComponentStyles()}</style>` })
 */
declare function getComponentStyles(): string;

/**
 * @nativedom/core - repeat.ts
 *
 * Keyed list reconciliation for html`` templates.
 *
 * repeat(getter, keyFn, renderFn) produces a ContentDirective that maintains
 * a stable Map<key → ChildNode[]>. On each reactive update it:
 *   1. Removes nodes whose keys are no longer present
 *   2. Creates nodes for new keys (rendered once, never re-rendered by repeat)
 *   3. Moves existing nodes into the correct order using a right-to-left
 *      insertion pass — only nodes that are out of position are touched
 *
 * This means Custom Elements keep their identity across list mutations:
 * connectedCallback / disconnectedCallback only fire on actual add/remove,
 * not on every signal change, and internal reactive effects survive intact.
 */

/**
 * Keyed list renderer for use inside html`` templates.
 *
 * Routes DOM mutations through a stable key→nodes map so that unchanged
 * items keep their existing DOM nodes across reactive updates.
 *
 * @param getter    Reactive getter returning the current item array.
 *                  Tracked as a signal dependency — the list reconciles
 *                  whenever this returns a new array.
 * @param keyFn     Returns a stable, unique key for each item.
 *                  Keys are used to match old nodes to new positions.
 * @param renderFn  Called once per new key to produce DOM content.
 *                  For Custom Elements, the element itself handles reactive
 *                  updates to its own content — renderFn is not called again
 *                  for items already in the list.
 *
 * @example
 * html`
 *   <ul>
 *     ${repeat(
 *       () => todos.get(),
 *       t => t.id,
 *       t => html`<todo-item todo-id="${t.id}"></todo-item>`,
 *     )}
 *   </ul>
 * `
 */
declare function repeat<T>(getter: () => T[], keyFn: (item: T, index: number) => string | number, renderFn: (item: T, index: number) => Interpolation): ContentDirective;

/**
 * @nativedom/core - transition.ts
 *
 * CSS transition directive for html`` templates.
 *
 * transition(getter, options) watches a reactive getter and animates content
 * changes using CSS class hooks:
 *
 *   Enter: `{name}-enter-from` + `{name}-enter-active` added immediately,
 *          `{name}-enter-from` removed on next animation frame (triggers transition
 *          from the "from" state to the element's natural state),
 *          `{name}-enter-active` removed after transitionend/animationend (or duration ms).
 *
 *   Leave: `{name}-leave-active` + `{name}-leave-to` added to outgoing node,
 *          node removed from DOM after transitionend/animationend (or duration ms).
 *
 * The first render (page load) is not animated to avoid a flash of invisible content.
 * SSR: renders the initial getter value as a plain string without animation classes.
 *
 * @example
 * // CSS:
 * //   .fade-enter-active, .fade-leave-active { transition: opacity 250ms ease; }
 * //   .fade-enter-from, .fade-leave-to { opacity: 0; }
 *
 * html`<div>${transition(() => router.outlet(), { name: 'fade' })}</div>`
 */

interface TransitionOptions {
    /** CSS class name prefix. Default: 'nf'. */
    name?: string;
    /** Fallback removal delay in ms when transitionend/animationend never fires. Default: 300. */
    duration?: number;
}
/**
 * Animate content changes with enter/leave CSS transitions.
 *
 * Watches a reactive getter and applies CSS classes to entering/leaving nodes
 * whenever the content changes. The class naming convention matches Vue's
 * transition system for familiar CSS authoring.
 *
 * Classes applied to the first Element node in the content:
 * - **Enter**: `{name}-enter-from` + `{name}-enter-active` (enter-from removed on rAF)
 * - **Leave**: `{name}-leave-active` + `{name}-leave-to`
 *
 * If no CSS transition is defined on the element, a fallback `setTimeout` of
 * `duration` ms ensures nodes are eventually removed/cleaned up.
 *
 * @param getter  Reactive getter returning the content to display. Tracked as a
 *                signal dependency — content swaps whenever this returns a new value.
 * @param options Optional `name` (CSS prefix, default 'nf') and `duration` (fallback ms).
 */
declare function transition(getter: () => Interpolation, options?: TransitionOptions): ContentDirective;

/**
 * @nativedom/core - async.ts
 *
 * Reactive async data-fetching helper.
 *
 * asyncSignal(fetcher, options?) wraps a Promise-returning function
 * in three signals — data, loading, error — and automatically
 * re-runs the fetcher whenever its reactive dependencies change
 * (the fetcher itself is run inside an effect).
 *
 * When called inside a component render the effect is lifecycle-bound
 * to that component via getCurrentScope() and is disposed on
 * disconnectedCallback. When called outside a component it uses the
 * global effect() and lives for the lifetime of the page.
 *
 * A version counter prevents stale responses from overwriting newer
 * results when the fetcher is triggered multiple times in quick succession.
 */

/**
 * The reactive state object returned by asyncSignal().
 */
interface AsyncState<T> {
    /** The last successfully resolved value, or `initialValue` / `undefined`. */
    readonly data: Signal<T | undefined>;
    /** `true` while the most recent fetch is in flight. */
    readonly loading: Signal<boolean>;
    /** The last rejection turned into an `Error`, or `undefined` on success. */
    readonly error: Signal<Error | undefined>;
    /** Manually trigger a fresh fetch (ignores reactive dependencies). */
    refetch(): void;
}
/**
 * Options for asyncSignal().
 */
interface AsyncSignalOptions<T> {
    /**
     * Value held by `data` before the first fetch resolves.
     * Defaults to `undefined`.
     */
    readonly initialValue?: T;
    /**
     * When `true`, the fetcher is not called on the initial render.
     * `refetch()` and reactive dep changes (after the first manual fetch) still work.
     *
     * Defaults to `true` when `initialValue` is provided, `false` otherwise.
     * Set explicitly to `false` to force an immediate fetch even with `initialValue`.
     */
    readonly lazy?: boolean;
}
/**
 * Create a reactive async data source.
 *
 * The `fetcher` is called inside an `effect`, so any signals read
 * inside it are tracked — the fetch automatically re-runs whenever
 * its dependencies change.
 *
 * @param fetcher  A function that returns a Promise. May read signals.
 * @param options  Optional configuration (see AsyncSignalOptions).
 *
 * @example
 * const { data, loading, error } = asyncSignal(() =>
 *   fetch(`/api/users/${userId.get()}`).then(r => r.json())
 * );
 *
 * html`
 *   ${() => loading.get() ? html`<p>Loading…</p>` : html`<p>${() => data.get()?.name}</p>`}
 * `
 */
declare function asyncSignal<T>(fetcher: () => Promise<T>, options?: AsyncSignalOptions<T>): AsyncState<T>;

export { type AsyncSignalOptions, type AsyncState, type ComponentContext, type ComponentFactory, type ComponentFn, type ComponentOptions, type Computed, type ContentDirective, type Context, DIRECTIVE_BRAND, type EffectFn, type EffectHandle, type EventHandler, type Interpolation, type NodeGetter, type NodeValue, type ReactiveGetter, type Ref, type Signal, type Slot, type TransitionOptions, asyncSignal, batch, component, computed, createContext, createRef, effect, getComponentStyles, getCurrentScope, html, isContentDirective, registry, repeat, signal, ssrHtml, ssrRender, transition, trustedHtml, untrack, withEffectScope };

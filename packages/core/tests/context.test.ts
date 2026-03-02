/**
 * Tests for createContext / ctx.provide / ctx.inject.
 *
 * Run in the `dom` vitest project (needs Custom Elements + happy-dom).
 */

import { describe, it, expect } from 'vitest';
import { signal } from '../src/signals.js';
import { html } from '../src/html.js';
import { component, createContext } from '../src/index.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Mount an element in a real document.body subtree so connectedCallback fires. */
function mount(el: Element): () => void {
  document.body.appendChild(el);
  return () => { el.remove(); };
}

// ─── createContext ────────────────────────────────────────────────────────────

describe('createContext', () => {
  it('returns a Context with a unique _id and the given default', () => {
    const ctx = createContext(42);
    expect(typeof ctx._id).toBe('symbol');
    expect(ctx._defaultValue).toBe(42);
  });

  it('two createContext() calls produce distinct contexts', () => {
    const a = createContext(0);
    const b = createContext(0);
    expect(a._id).not.toBe(b._id);
  });
});

// ─── inject — no provider ────────────────────────────────────────────────────

describe('inject — no provider in tree', () => {
  it('returns the default value when no ancestor provides', () => {
    const NumCtx = createContext<number>(99);
    let captured = -1;

    component('ctx-no-provider', (_, ctx) => {
      captured = ctx.inject(NumCtx);
      return html`<span></span>`;
    }, { shadow: false });

    const el = document.createElement('ctx-no-provider');
    const unmount = mount(el);
    expect(captured).toBe(99);
    unmount();
  });
});

// ─── provide / inject — basic ────────────────────────────────────────────────

describe('provide / inject — basic', () => {
  it('child receives the value provided by its direct parent', () => {
    const StrCtx = createContext<string>('default');
    let received = '';

    component('ctx-parent-a', (_, ctx) => {
      ctx.provide(StrCtx, 'hello');
      return html`<ctx-child-a></ctx-child-a>`;
    }, { shadow: false });

    component('ctx-child-a', (_, ctx) => {
      received = ctx.inject(StrCtx);
      return html`<span></span>`;
    }, { shadow: false });

    const parent = document.createElement('ctx-parent-a');
    const unmount = mount(parent);
    expect(received).toBe('hello');
    unmount();
  });

  it('child receives value from a grandparent when direct parent does not provide', () => {
    const NumCtx2 = createContext<number>(0);
    let received = -1;

    component('ctx-grandparent', (_, ctx) => {
      ctx.provide(NumCtx2, 777);
      return html`<ctx-middle></ctx-middle>`;
    }, { shadow: false });

    component('ctx-middle', (_, { html }) => {
      // middle does NOT provide — just renders the grandchild
      return html`<ctx-grandchild></ctx-grandchild>`;
    }, { shadow: false });

    component('ctx-grandchild', (_, ctx) => {
      received = ctx.inject(NumCtx2);
      return html`<span></span>`;
    }, { shadow: false });

    const gp = document.createElement('ctx-grandparent');
    const unmount = mount(gp);
    expect(received).toBe(777);
    unmount();
  });

  it('nearest provider wins when multiple ancestors provide', () => {
    const BoolCtx = createContext<boolean>(false);
    let received: boolean | null = null;

    component('ctx-outer', (_, ctx) => {
      ctx.provide(BoolCtx, false); // outer provides false
      return html`<ctx-inner></ctx-inner>`;
    }, { shadow: false });

    component('ctx-inner', (_, ctx) => {
      ctx.provide(BoolCtx, true); // inner overrides with true
      return html`<ctx-leaf></ctx-leaf>`;
    }, { shadow: false });

    component('ctx-leaf', (_, ctx) => {
      received = ctx.inject(BoolCtx);
      return html`<span></span>`;
    }, { shadow: false });

    const outer = document.createElement('ctx-outer');
    const unmount = mount(outer);
    expect(received).toBe(true); // nearest wins
    unmount();
  });

  it('two sibling subtrees each get their own provider value', () => {
    const SibCtx = createContext<string>('none');
    const results: string[] = [];

    component('ctx-sib-provider', (props: { value: string }, ctx) => {
      ctx.provide(SibCtx, props.value);
      return html`<ctx-sib-consumer></ctx-sib-consumer>`;
    }, { shadow: false });

    component('ctx-sib-consumer', (_, ctx) => {
      results.push(ctx.inject(SibCtx));
      return html`<span></span>`;
    }, { shadow: false });

    const a = document.createElement('ctx-sib-provider');
    a.setAttribute('value', 'A');
    const b = document.createElement('ctx-sib-provider');
    b.setAttribute('value', 'B');

    const unmountA = mount(a);
    const unmountB = mount(b);

    expect(results).toEqual(['A', 'B']);
    unmountA();
    unmountB();
  });
});

// ─── provide / inject — reactive (Signal as value) ───────────────────────────

describe('provide / inject — reactive context via Signal', () => {
  it('consumer reacts to signal changes provided by ancestor', () => {
    type ThemeSignal = ReturnType<typeof signal<string>>;
    const ThemeCtx = createContext<ThemeSignal | null>(null);

    let injectedSignal: ThemeSignal | null = null;

    component('ctx-theme-provider', (_, ctx) => {
      const theme = signal('light');
      ctx.provide(ThemeCtx, theme);
      // expose so the test can update it
      (document.body as unknown as Record<string, unknown>)['_themeSignal'] = theme;
      return html`<ctx-theme-consumer></ctx-theme-consumer>`;
    }, { shadow: false });

    component('ctx-theme-consumer', (_, ctx) => {
      injectedSignal = ctx.inject(ThemeCtx);
      return html`<span></span>`;
    }, { shadow: false });

    const el = document.createElement('ctx-theme-provider');
    const unmount = mount(el);

    expect(injectedSignal).not.toBeNull();
    expect(injectedSignal!.get()).toBe('light');

    injectedSignal!.set('dark');
    expect(injectedSignal!.get()).toBe('dark');

    unmount();
  });
});

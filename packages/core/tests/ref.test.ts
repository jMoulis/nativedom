/**
 * Tests for ctx.ref() and the ref="${refObj}" template binding.
 *
 * Run in the `dom` vitest project (needs Custom Elements + happy-dom).
 */

import { describe, it, expect } from 'vitest';
import { signal } from '../src/signals.js';
import { html, ssrHtml } from '../src/html.js';
import { component } from '../src/component.js';
import { createRef, REF_BRAND, type Ref } from '../src/ref.js';

// ─── Helper ───────────────────────────────────────────────────────────────────

function mount(el: Element): () => void {
  document.body.appendChild(el);
  return () => { el.remove(); };
}

// ─── createRef ────────────────────────────────────────────────────────────────

describe('createRef', () => {
  it('starts with el = null', () => {
    const r = createRef<HTMLInputElement>();
    expect(r.el).toBeNull();
  });

  it('has the REF_BRAND symbol', () => {
    const r = createRef();
    expect(r[REF_BRAND]).toBe(true);
  });
});

// ─── ctx.ref() — basic lifecycle ─────────────────────────────────────────────

describe('ctx.ref() — basic lifecycle', () => {
  it('el is null before the element is connected', () => {
    let capturedRef: Ref<HTMLInputElement> | null = null;

    component('ref-pre-mount', (_, ctx) => {
      capturedRef = ctx.ref<HTMLInputElement>();
      return html`<input ref="${capturedRef}" type="text" />` as DocumentFragment;
    }, { shadow: false });

    // Create but do NOT mount yet
    document.createElement('ref-pre-mount');
    expect(capturedRef).toBeNull(); // fn not called until connectedCallback
  });

  it('el is set to the bound element after mount', () => {
    let capturedRef: Ref<HTMLInputElement> | null = null;

    component('ref-after-mount', (_, ctx) => {
      capturedRef = ctx.ref<HTMLInputElement>();
      return html`<input ref="${capturedRef}" type="text" />` as DocumentFragment;
    }, { shadow: false });

    const el = document.createElement('ref-after-mount');
    const unmount = mount(el);

    expect(capturedRef).not.toBeNull();
    expect(capturedRef!.el).not.toBeNull();
    expect(capturedRef!.el!.tagName.toLowerCase()).toBe('input');
    unmount();
  });

  it('el is accessible in onMount callback', () => {
    let mountedTagName = '';

    component('ref-on-mount', (_, ctx) => {
      const inputRef = ctx.ref<HTMLInputElement>();
      ctx.onMount(() => { mountedTagName = inputRef.el?.tagName.toLowerCase() ?? ''; });
      return html`<input ref="${inputRef}" type="text" />` as DocumentFragment;
    }, { shadow: false });

    const el = document.createElement('ref-on-mount');
    const unmount = mount(el);

    expect(mountedTagName).toBe('input');
    unmount();
  });

  it('el is cleared to null on disconnect', () => {
    let capturedRef: Ref<HTMLInputElement> | null = null;

    component('ref-disconnect', (_, ctx) => {
      capturedRef = ctx.ref<HTMLInputElement>();
      return html`<input ref="${capturedRef}" type="text" />` as DocumentFragment;
    }, { shadow: false });

    const el = document.createElement('ref-disconnect');
    const unmount = mount(el);
    expect(capturedRef!.el).not.toBeNull();

    unmount();
    expect(capturedRef!.el).toBeNull();
  });

  it('ref attribute is not present in the final DOM', () => {
    component('ref-no-attr', (_, ctx) => {
      const inputRef = ctx.ref<HTMLInputElement>();
      return html`<input ref="${inputRef}" type="text" />` as DocumentFragment;
    }, { shadow: false });

    const el = document.createElement('ref-no-attr');
    const unmount = mount(el);

    const input = el.querySelector('input');
    expect(input?.hasAttribute('ref')).toBe(false);
    unmount();
  });
});

// ─── ctx.ref() — in event handlers ───────────────────────────────────────────

describe('ctx.ref() — used in event handlers', () => {
  it('el is accessible inside event handlers', () => {
    let clickedTagName = '';

    component('ref-in-handler', (_, ctx) => {
      const divRef = ctx.ref<HTMLDivElement>();
      return html`
        <div ref="${divRef}">
          <button @click=${() => { clickedTagName = divRef.el?.tagName.toLowerCase() ?? ''; }}>click</button>
        </div>
      ` as DocumentFragment;
    }, { shadow: false });

    const el = document.createElement('ref-in-handler');
    const unmount = mount(el);

    el.querySelector('button')!.click();
    expect(clickedTagName).toBe('div');
    unmount();
  });
});

// ─── ctx.ref() — re-render ────────────────────────────────────────────────────

describe('ctx.ref() — re-render via observedAttrs', () => {
  it('ref.el points to the re-rendered element after an attribute change', () => {
    let lastRef: Ref<HTMLInputElement> | null = null;

    component<{ label: string }>('ref-rerender', (props, ctx) => {
      const inputRef = ctx.ref<HTMLInputElement>();
      lastRef = inputRef; // capture the ref from the current render
      return html`<input ref="${inputRef}" type="text" data-label="${props.label}" />` as DocumentFragment;
    }, { shadow: false, observedAttrs: ['label'] });

    const el = document.createElement('ref-rerender');
    el.setAttribute('label', 'a');
    const unmount = mount(el);

    expect(lastRef!.el?.getAttribute('data-label')).toBe('a');

    el.setAttribute('label', 'b'); // triggers synchronous re-render
    expect(lastRef!.el?.getAttribute('data-label')).toBe('b');

    unmount();
  });
});

// ─── SSR — ref attribute is stripped ─────────────────────────────────────────

describe('SSR — ref binding is silently dropped', () => {
  it('ref= attribute does not appear in SSR output', () => {
    const fakeRef = createRef();
    const result = ssrHtml(
      ['<input ref=', ' type="text" />'] as unknown as TemplateStringsArray,
      [fakeRef],
    );
    expect(result).not.toContain('ref=');
    expect(result).toContain('<input');
    expect(result).toContain('type="text"');
  });
});

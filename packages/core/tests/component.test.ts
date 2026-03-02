/**
 * Tests for component() and the ComponentFactory it returns.
 *
 * Run in the `dom` vitest project (needs custom element registration + happy-dom).
 */

import { describe, it, expect } from 'vitest';
import { signal } from '../src/signals.js';
import { html } from '../src/html.js';
import { component } from '../src/component.js';
import type { ComponentFactory } from '../src/component.js';

// ─── component() registration ─────────────────────────────────────────────────

describe('component() — registration', () => {
  it('throws when the name has no hyphen', () => {
    expect(() => component('nocustom', () => document.createDocumentFragment()))
      .toThrow('must contain a hyphen');
  });

  it('registers the custom element in the DOM', () => {
    component('test-register', (_, { html }) => html`<span>ok</span>`, { shadow: false });
    expect(customElements.get('test-register')).toBeDefined();
  });

  it('returns a ComponentFactory function', () => {
    const factory = component('test-factory-type', (_, { html }) => html`<div></div>`);
    expect(typeof factory).toBe('function');
  });
});

// ─── ComponentFactory — client (DOM) ──────────────────────────────────────────

describe('ComponentFactory — client', () => {
  it('creates an element with the correct tag name', () => {
    const MyEl = component<{ label: string }>('test-tagname-el', (_, { html }) => html`<span></span>`);
    const el = MyEl({ label: 'hi' }) as Element;
    expect(el.tagName.toLowerCase()).toBe('test-tagname-el');
  });

  it('sets string props as HTML attributes', () => {
    const MyEl = component<{ 'item-id': string }>('test-str-attr', (_, { html }) => html`<span></span>`);
    const el = MyEl({ 'item-id': 'abc' }) as Element;
    expect(el.getAttribute('item-id')).toBe('abc');
  });

  it('sets number props as serialized attributes', () => {
    const MyEl = component<{ count: number }>('test-num-attr', (_, { html }) => html`<span></span>`);
    const el = MyEl({ count: 42 }) as Element;
    expect(el.getAttribute('count')).toBe('42');
  });

  it('sets boolean props as serialized attributes', () => {
    const MyEl = component<{ done: boolean }>('test-bool-attr', (_, { html }) => html`<span></span>`);
    const elTrue  = MyEl({ done: true  }) as Element;
    const elFalse = MyEl({ done: false }) as Element;
    expect(elTrue.getAttribute('done')).toBe('true');
    expect(elFalse.getAttribute('done')).toBe('false');
  });

  it('skips undefined props', () => {
    const MyEl = component<{ label: string; opt?: string }>('test-skip-null', (_, { html }) => html`<span></span>`);
    const el = MyEl({ label: 'x' }) as Element; // opt omitted
    expect(el.hasAttribute('opt')).toBe(false);
  });

  it('sets object props via _nfProps, not as attribute', () => {
    const MyEl = component<{ data: Record<string, unknown> }>('test-obj-prop', (_, { html }) => html`<span></span>`);
    const el = MyEl({ data: { x: 1 } });
    const domEl = el as Element & { _nfProps?: Record<string, unknown> };
    expect(domEl._nfProps?.['data']).toEqual({ x: 1 });
    expect(domEl.hasAttribute?.('data')).toBe(false);
  });

  it('calling with no props creates an empty element', () => {
    const MyEl = component<{ label?: string }>('test-no-props', (_, { html }) => html`<span></span>`);
    const el = MyEl() as Element;
    expect(el.tagName.toLowerCase()).toBe('test-no-props');
    expect(el.attributes.length).toBe(0);
  });

  it('factory signature is typed correctly (compile-time guarantee)', () => {
    // type (not interface) is used to satisfy the `extends object` constraint.
    // If prop names/types were wrong, this file would fail to compile.
    type Props = { 'story-id': string; score: number };
    const factory: ComponentFactory<Props> = component<Props>(
      'test-typed-props',
      (_, { html }) => html`<span></span>`,
    );
    const el = factory({ 'story-id': 'abc', score: 10 }) as Element;
    expect(el.getAttribute('story-id')).toBe('abc');
    expect(el.getAttribute('score')).toBe('10');
  });
});

// ─── ComponentFactory — in html`` templates ────────────────────────────────────

describe('ComponentFactory — in html`` templates', () => {
  it('can be used as a static content interpolation', () => {
    const Item = component<{ value: string }>('test-interp-item', (_, { html }) => html`<b></b>`);

    const container = document.createElement('div');
    container.appendChild(html`<ul>${Item({ value: 'x' })}</ul>` as DocumentFragment);

    const found = container.querySelector('test-interp-item');
    expect(found).not.toBeNull();
    expect(found?.getAttribute('value')).toBe('x');
  });

  it('can be used inside a reactive getter — updates when signal changes', () => {
    const Badge = component<{ count: number }>('test-reactive-badge', (_, { html }) => html`<span></span>`);

    const count = signal(1);
    const frag = html`<div>${() => Badge({ count: count.get() })}</div>` as DocumentFragment;
    const container = document.createElement('div');
    container.appendChild(frag);

    expect(container.querySelector('test-reactive-badge')?.getAttribute('count')).toBe('1');

    count.set(2);
    // The reactive binding replaces the old element with a new one
    expect(container.querySelector('test-reactive-badge')?.getAttribute('count')).toBe('2');
  });

  it('renders multiple items via reactive map()', () => {
    const Row = component<{ id: string }>('test-map-row', (_, { html }) => html`<span></span>`);

    const items = ['a', 'b', 'c'];
    // Wrap in a reactive getter so the array is treated as a node getter, not a raw value
    const frag = html`<div>${() => items.map(id => Row({ id }) as Node)}</div>` as DocumentFragment;
    const container = document.createElement('div');
    container.appendChild(frag);

    const rows = container.querySelectorAll('test-map-row');
    expect(rows.length).toBe(3);
    expect(rows[1]?.getAttribute('id')).toBe('b');
  });
});

/**
 * Tests for the Slot pattern (children/named slots via component props)
 * and the trustedHtml() helper.
 *
 * Run in the `dom` vitest project (needs Custom Elements + happy-dom).
 */

import { describe, it, expect } from 'vitest';
import { signal } from '../src/signals.js';
import { html, ssrHtml, trustedHtml, type Slot } from '../src/html.js';
import { component } from '../src/component.js';
import { repeat } from '../src/repeat.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mount(el: Element): () => void {
  document.body.appendChild(el);
  return () => { el.remove(); };
}

// ─── DocumentFragment children ────────────────────────────────────────────────

describe('Slot — DocumentFragment children', () => {
  it('renders fragment children inside the component', () => {
    const Card = component<{ children?: Slot }>('slot-card-a', ({ children }, { html }) =>
      html`<div class="card">${children}</div>` as DocumentFragment,
      { shadow: false }
    );

    const el = Card({ children: html`<p class="inner">Hello</p>` as DocumentFragment }) as Element;
    const unmount = mount(el);

    expect(el.querySelector('p.inner')?.textContent).toBe('Hello');
    unmount();
  });

  it('renders nothing when children is omitted', () => {
    const Card2 = component<{ children?: Slot }>('slot-card-b', ({ children }, { html }) =>
      html`<div class="card">${children}</div>` as DocumentFragment,
      { shadow: false }
    );

    const el = Card2() as Element;
    const unmount = mount(el);

    expect(el.querySelector('.card')?.childNodes.length).toBe(
      1, // only the anchor comment node
    );
    unmount();
  });
});

// ─── String children ─────────────────────────────────────────────────────────

describe('Slot — string / primitive children', () => {
  it('renders a plain string as text content', () => {
    const Label = component<{ children?: Slot }>('slot-label', ({ children }, { html }) =>
      html`<span>${children}</span>` as DocumentFragment,
      { shadow: false }
    );

    const el = Label({ children: 'click me' }) as Element;
    const unmount = mount(el);

    expect(el.querySelector('span')?.textContent).toBe('click me');
    unmount();
  });
});

// ─── Reactive getter children ─────────────────────────────────────────────────

describe('Slot — reactive getter children', () => {
  it('children as () => string updates reactively', () => {
    const count = signal(0);

    const Counter = component<{ children?: Slot }>('slot-counter', ({ children }, { html }) =>
      html`<div>${children}</div>` as DocumentFragment,
      { shadow: false }
    );

    const el = Counter({ children: () => `count: ${count.get()}` }) as Element;
    const unmount = mount(el);

    expect(el.querySelector('div')?.textContent).toBe('count: 0');
    count.set(5);
    expect(el.querySelector('div')?.textContent).toBe('count: 5');
    unmount();
  });
});

// ─── ContentDirective children (repeat) ──────────────────────────────────────

describe('Slot — ContentDirective children (repeat)', () => {
  it('renders a repeat() directive passed as children', () => {
    const items = signal(['a', 'b', 'c']);

    const List = component<{ children?: Slot }>('slot-list', ({ children }, { html }) =>
      html`<ul>${children}</ul>` as DocumentFragment,
      { shadow: false }
    );

    const listDirective = repeat(
      () => items.get(),
      item => item,
      item => html`<li>${item}</li>` as DocumentFragment,
    );

    const el = List({ children: listDirective }) as Element;
    const unmount = mount(el);

    expect(el.querySelectorAll('li').length).toBe(3);
    expect(el.querySelectorAll('li')[1]?.textContent).toBe('b');

    items.set(['x', 'y']);
    expect(el.querySelectorAll('li').length).toBe(2);
    expect(el.querySelectorAll('li')[0]?.textContent).toBe('x');

    unmount();
  });
});

// ─── Named slots ─────────────────────────────────────────────────────────────

describe('Slot — named slots', () => {
  it('renders multiple named slot props in their respective positions', () => {
    type LayoutProps = { header?: Slot; children?: Slot; footer?: Slot };

    const Layout = component<LayoutProps>('slot-layout', ({ header, children, footer }, { html }) =>
      html`
        <div>
          <header class="h">${header}</header>
          <main class="m">${children}</main>
          <footer class="f">${footer}</footer>
        </div>
      ` as DocumentFragment,
      { shadow: false }
    );

    const el = Layout({
      header:   html`<span>Header</span>` as DocumentFragment,
      children: html`<p>Body</p>` as DocumentFragment,
      footer:   html`<small>Footer</small>` as DocumentFragment,
    }) as Element;
    const unmount = mount(el);

    expect(el.querySelector('.h span')?.textContent).toBe('Header');
    expect(el.querySelector('.m p')?.textContent).toBe('Body');
    expect(el.querySelector('.f small')?.textContent).toBe('Footer');
    unmount();
  });
});

// ─── trustedHtml ──────────────────────────────────────────────────────────────

describe('trustedHtml()', () => {
  it('SSR: emits the raw HTML string without escaping', () => {
    const result = ssrHtml(
      ['<div>', '</div>'] as unknown as TemplateStringsArray,
      [trustedHtml('<p class="inner">hello</p>')],
    );
    expect(result).toBe('<div><p class="inner">hello</p></div>');
  });

  it('SSR: is composable — can nest ssrRender-style strings', () => {
    const innerHtml = '<span>inner</span>';
    const result = ssrHtml(
      ['<section>', '</section>'] as unknown as TemplateStringsArray,
      [trustedHtml(innerHtml)],
    );
    expect(result).toBe('<section><span>inner</span></section>');
  });

  it('client: inserts parsed HTML nodes into the DOM', () => {
    const Wrap = component<{ children?: Slot }>('slot-trusted', ({ children }, { html }) =>
      html`<div class="wrap">${children}</div>` as DocumentFragment,
      { shadow: false }
    );

    const el = Wrap({ children: trustedHtml('<em>hi</em>') }) as Element;
    const unmount = mount(el);

    expect(el.querySelector('em')?.textContent).toBe('hi');
    unmount();
  });
});

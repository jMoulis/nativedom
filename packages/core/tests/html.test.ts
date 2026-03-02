import { describe, it, expect } from 'vitest';
import { signal, effect, type EffectFn, type EffectHandle } from '../src/signals.js';
import { html, ssrHtml, withEffectScope } from '../src/html.js';
import { repeat } from '../src/repeat.js';

// ─── SSR path (string output) ─────────────────────────────────────────────────
// We test ssrHtml directly since `html` delegates to it on the server.
// In happy-dom, `window` exists — so we test ssrHtml explicitly for SSR behavior,
// and `html` for client DOM behavior.

describe('ssrHtml() — server string output', () => {
  it('renders static content', () => {
    const result = ssrHtml(['<span>hello</span>'] as unknown as TemplateStringsArray, []);
    expect(result).toBe('<span>hello</span>');
  });

  it('interpolates static string values', () => {
    const result = ssrHtml(
      ['<span>', '</span>'] as unknown as TemplateStringsArray,
      ['world']
    );
    expect(result).toBe('<span>world</span>');
  });

  it('resolves reactive getter functions to their current value', () => {
    const count = signal(42);
    const result = ssrHtml(
      ['<span>', '</span>'] as unknown as TemplateStringsArray,
      [() => count.get()]
    );
    expect(result).toBe('<span>42</span>');
  });

  it('escapes HTML in interpolated values', () => {
    const result = ssrHtml(
      ['<span>', '</span>'] as unknown as TemplateStringsArray,
      ['<script>alert("xss")</script>']
    );
    expect(result).toContain('&lt;script&gt;');
    expect(result).not.toContain('<script>');
  });

  it('handles null and undefined as empty strings', () => {
    const r1 = ssrHtml(['<span>', '</span>'] as unknown as TemplateStringsArray, [null]);
    const r2 = ssrHtml(['<span>', '</span>'] as unknown as TemplateStringsArray, [undefined]);
    expect(r1).toBe('<span></span>');
    expect(r2).toBe('<span></span>');
  });

  it('silently drops event handler bindings (@event)', () => {
    const result = ssrHtml(
      ['<button @click=', '>click</button>'] as unknown as TemplateStringsArray,
      [() => {}]
    );
    // Event handlers should not appear in SSR output
    expect(result).not.toContain('@click');
    expect(result).toContain('click</button>');
  });
});

// ─── Client DOM path ──────────────────────────────────────────────────────────

describe('html`` — client DOM output', () => {
  it('returns a DocumentFragment', () => {
    const frag = html`<span>hello</span>`;
    expect(frag).toBeInstanceOf(DocumentFragment);
  });

  it('renders static content into the fragment', () => {
    const container = document.createElement('div');
    container.appendChild(html`<p>static</p>` as DocumentFragment);
    expect(container.querySelector('p')?.textContent).toBe('static');
  });

  it('renders static interpolations', () => {
    const name = 'Alice';
    const container = document.createElement('div');
    container.appendChild(html`<span>${name}</span>` as DocumentFragment);
    expect(container.querySelector('span')?.textContent).toBe('Alice');
  });

  it('renders reactive getters — updates text node when signal changes', () => {
    const count = signal(0);
    const container = document.createElement('div');
    container.appendChild(html`<span>${() => count.get()}</span>` as DocumentFragment);

    expect(container.querySelector('span')?.textContent).toBe('0');
    count.set(5);
    expect(container.querySelector('span')?.textContent).toBe('5');
    count.set(99);
    expect(container.querySelector('span')?.textContent).toBe('99');
  });

  it('attaches event listeners with @event syntax', () => {
    let clicked = false;
    const frag = html`<button @click=${() => { clicked = true; }}>click</button>` as DocumentFragment;
    const container = document.createElement('div');
    container.appendChild(frag);
    container.querySelector('button')?.click();
    expect(clicked).toBe(true);
  });

  it('removes @event attributes from the final DOM', () => {
    const frag = html`<button @click=${() => {}}>btn</button>` as DocumentFragment;
    const container = document.createElement('div');
    container.appendChild(frag);
    const btn = container.querySelector('button');
    expect(btn?.hasAttribute('@click')).toBe(false);
    expect(btn?.hasAttribute('click')).toBe(false);
  });

  it('handles multiple reactive bindings in one template', () => {
    const a = signal('A');
    const b = signal('B');
    const container = document.createElement('div');
    container.appendChild(html`<span>${() => a.get()}</span><span>${() => b.get()}</span>` as DocumentFragment);

    const spans = container.querySelectorAll('span');
    expect(spans[0]?.textContent).toBe('A');
    expect(spans[1]?.textContent).toBe('B');

    a.set('A2');
    expect(spans[0]?.textContent).toBe('A2');
    expect(spans[1]?.textContent).toBe('B'); // unchanged

    b.set('B2');
    expect(spans[1]?.textContent).toBe('B2');
  });

  it('reuses the same <template> element for identical template literals', () => {
    // Call the same tagged template twice — should hit the cache
    const make = () => html`<div class="cached">item</div>`;
    const frag1 = make();
    const frag2 = make();
    // Both should produce valid DOM (cache hit doesn't break anything)
    const c1 = document.createElement('div');
    const c2 = document.createElement('div');
    c1.appendChild(frag1 as DocumentFragment);
    c2.appendChild(frag2 as DocumentFragment);
    expect(c1.querySelector('.cached')?.textContent).toBe('item');
    expect(c2.querySelector('.cached')?.textContent).toBe('item');
  });
});

// ─── Property binding (.prop syntax) ─────────────────────────────────────────

describe('ssrHtml() — property binding (.prop) in SSR', () => {
  it('silently drops property bindings (.prop) in SSR output', () => {
    const result = ssrHtml(
      ['<input .value=', ' />'] as unknown as TemplateStringsArray,
      [() => 'hello']
    );
    expect(result).not.toContain('.value');
    expect(result).toContain('<input');
    expect(result).toContain('/>');
  });
});

describe('html`` — .prop binding (client DOM)', () => {
  it('sets IDL property directly with .prop binding (static)', () => {
    const frag = html`<input .value=${'hello'} type="text" />` as DocumentFragment;
    const container = document.createElement('div');
    container.appendChild(frag);
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('hello');
    expect(input.hasAttribute('.value')).toBe(false); // attribute cleaned up
  });

  it('sets IDL property reactively with .prop binding', () => {
    const text = signal('initial');
    const frag = html`<input .value=${() => text.get()} type="text" />` as DocumentFragment;
    const container = document.createElement('div');
    container.appendChild(frag);
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('initial');
    text.set('updated');
    expect(input.value).toBe('updated');
  });

  it('.prop binding does not create an HTML attribute — uses IDL property', () => {
    const frag = html`<input .value=${'test'} />` as DocumentFragment;
    const container = document.createElement('div');
    container.appendChild(frag);
    const input = container.querySelector('input') as HTMLInputElement;
    // setAttribute("value", ...) would give '' for input.value after focus
    // IDL property assignment gives the actual value immediately
    expect(input.getAttribute('value')).toBeNull(); // no HTML attribute set
    expect(input.value).toBe('test');               // IDL property set
  });
});

// ─── Fix C: withEffectScope — scoped effect tracking ─────────────────────────

describe('withEffectScope() — scoped html binding effects', () => {
  it('routes html binding effects through the provided scope function', () => {
    const count = signal(0);
    const registered: EffectHandle[] = [];

    const scopedEffect = (fn: EffectFn): EffectHandle => {
      const handle = effect(fn);
      registered.push(handle);
      return handle;
    };

    const frag = withEffectScope(scopedEffect, () =>
      html`<span>${() => count.get()}</span>`
    ) as DocumentFragment;

    const container = document.createElement('div');
    container.appendChild(frag);

    expect(registered.length).toBe(1);
    expect(container.querySelector('span')?.textContent).toBe('0');
    count.set(5);
    expect(container.querySelector('span')?.textContent).toBe('5');

    // Disposing through the scope stops updates
    registered.forEach(h => { h.dispose(); });
    count.set(99);
    expect(container.querySelector('span')?.textContent).toBe('5'); // unchanged
  });

  it('routes attr binding effects through the scope', () => {
    const cls = signal('a');
    const registered: EffectHandle[] = [];

    const scopedEffect = (fn: EffectFn): EffectHandle => {
      const handle = effect(fn);
      registered.push(handle);
      return handle;
    };

    const frag = withEffectScope(scopedEffect, () =>
      html`<div class="${() => cls.get()}"></div>`
    ) as DocumentFragment;

    const container = document.createElement('div');
    container.appendChild(frag);

    expect(registered.length).toBe(1);
    expect(container.querySelector('div')?.className).toBe('a');
    cls.set('b');
    expect(container.querySelector('div')?.className).toBe('b');

    registered.forEach(h => { h.dispose(); });
    cls.set('c');
    expect(container.querySelector('div')?.className).toBe('b'); // unchanged
  });
});

// ─── Fix D: node/array interpolation ─────────────────────────────────────────

describe('ssrHtml() — array interpolation', () => {
  it('renders a static array of HTML strings without escaping', () => {
    const items = ['<li>one</li>', '<li>two</li>'];
    const result = ssrHtml(
      ['<ul>', '</ul>'] as unknown as TemplateStringsArray,
      [items]
    );
    expect(result).toBe('<ul><li>one</li><li>two</li></ul>');
  });

  it('renders a getter returning an array of HTML strings', () => {
    const todos = [{ text: 'alpha' }, { text: 'beta' }];
    const result = ssrHtml(
      ['<ul>', '</ul>'] as unknown as TemplateStringsArray,
      [() => todos.map(t => `<li>${t.text}</li>`)]
    );
    expect(result).toBe('<ul><li>alpha</li><li>beta</li></ul>');
  });
});

describe('html`` — node/array interpolation (client DOM)', () => {
  it('interpolates a static DocumentFragment as child nodes', () => {
    const inner = html`<b>bold</b>` as DocumentFragment;
    const frag = html`<p>${inner}</p>` as DocumentFragment;
    const container = document.createElement('div');
    container.appendChild(frag);
    expect(container.querySelector('p b')?.textContent).toBe('bold');
  });

  it('interpolates a reactive array of fragments', () => {
    const items = signal(['a', 'b']);
    const frag = html`<ul>${() => items.get().map(x => html`<li>${x}</li>`)}</ul>` as DocumentFragment;
    const container = document.createElement('div');
    container.appendChild(frag);

    expect(container.querySelectorAll('li').length).toBe(2);
    expect(container.querySelectorAll('li')[0]?.textContent).toBe('a');
    expect(container.querySelectorAll('li')[1]?.textContent).toBe('b');

    items.set(['x', 'y', 'z']);
    expect(container.querySelectorAll('li').length).toBe(3);
    expect(container.querySelectorAll('li')[2]?.textContent).toBe('z');
  });

  it('removes old nodes when reactive array shrinks', () => {
    const items = signal(['a', 'b', 'c']);
    const frag = html`<ul>${() => items.get().map(x => html`<li>${x}</li>`)}</ul>` as DocumentFragment;
    const container = document.createElement('div');
    container.appendChild(frag);

    expect(container.querySelectorAll('li').length).toBe(3);
    items.set(['only']);
    expect(container.querySelectorAll('li').length).toBe(1);
    expect(container.querySelectorAll('li')[0]?.textContent).toBe('only');
  });

  it('handles empty array (renders nothing between anchors)', () => {
    const items = signal(['a']);
    const frag = html`<ul>${() => items.get().map(x => html`<li>${x}</li>`)}</ul>` as DocumentFragment;
    const container = document.createElement('div');
    container.appendChild(frag);

    expect(container.querySelectorAll('li').length).toBe(1);
    items.set([]);
    expect(container.querySelectorAll('li').length).toBe(0);
    expect(container.querySelector('ul')).not.toBeNull(); // ul itself stays
  });
});

// ─── repeat() — keyed reconciliation ─────────────────────────────────────────

describe('ssrHtml() — repeat() directive', () => {
  it('renders a static list via repeat()', () => {
    const items = [{ id: '1', text: 'one' }, { id: '2', text: 'two' }];
    const result = ssrHtml(
      ['<ul>', '</ul>'] as unknown as TemplateStringsArray,
      [repeat(() => items, i => i.id, i => `<li>${i.text}</li>`)]
    );
    expect(result).toBe('<ul><li>one</li><li>two</li></ul>');
  });

  it('renders an empty list via repeat()', () => {
    const result = ssrHtml(
      ['<ul>', '</ul>'] as unknown as TemplateStringsArray,
      [repeat(() => [], i => i, () => '')]
    );
    expect(result).toBe('<ul></ul>');
  });
});

describe('html`` — repeat() keyed reconciliation (client DOM)', () => {
  it('renders the initial list in correct order', () => {
    const items = signal([{ id: 'a', text: 'Alpha' }, { id: 'b', text: 'Beta' }]);
    const frag = html`<ul>${repeat(() => items.get(), i => i.id, i => html`<li id="${i.id}">${i.text}</li>`)}</ul>` as DocumentFragment;
    const container = document.createElement('div');
    container.appendChild(frag);

    const lis = container.querySelectorAll('li');
    expect(lis.length).toBe(2);
    expect(lis[0]?.id).toBe('a');
    expect(lis[1]?.id).toBe('b');
  });

  it('adds new items without touching existing nodes', () => {
    const items = signal([{ id: 'a', text: 'Alpha' }]);
    const frag = html`<ul>${repeat(() => items.get(), i => i.id, i => html`<li id="${i.id}">${i.text}</li>`)}</ul>` as DocumentFragment;
    const container = document.createElement('div');
    container.appendChild(frag);

    const originalNode = container.querySelector('#a');
    items.set([{ id: 'a', text: 'Alpha' }, { id: 'b', text: 'Beta' }]);

    expect(container.querySelectorAll('li').length).toBe(2);
    // The original node must be the exact same DOM node — not re-created
    expect(container.querySelector('#a')).toBe(originalNode);
  });

  it('removes deleted items', () => {
    const items = signal([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    const frag = html`<ul>${repeat(() => items.get(), i => i.id, i => html`<li id="${i.id}"></li>`)}</ul>` as DocumentFragment;
    const container = document.createElement('div');
    container.appendChild(frag);

    items.set([{ id: 'a' }, { id: 'c' }]);
    const lis = container.querySelectorAll('li');
    expect(lis.length).toBe(2);
    expect(lis[0]?.id).toBe('a');
    expect(lis[1]?.id).toBe('c');
  });

  it('reorders items without re-creating DOM nodes', () => {
    const items = signal([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    const frag = html`<ul>${repeat(() => items.get(), i => i.id, i => html`<li id="${i.id}"></li>`)}</ul>` as DocumentFragment;
    const container = document.createElement('div');
    container.appendChild(frag);

    const nodeA = container.querySelector('#a');
    const nodeB = container.querySelector('#b');
    const nodeC = container.querySelector('#c');

    // Reverse the list
    items.set([{ id: 'c' }, { id: 'b' }, { id: 'a' }]);

    const lis = container.querySelectorAll('li');
    expect(lis[0]?.id).toBe('c');
    expect(lis[1]?.id).toBe('b');
    expect(lis[2]?.id).toBe('a');
    // Same DOM nodes — just moved
    expect(container.querySelector('#a')).toBe(nodeA);
    expect(container.querySelector('#b')).toBe(nodeB);
    expect(container.querySelector('#c')).toBe(nodeC);
  });

  it('handles empty list → renders nothing, parent stays', () => {
    const items = signal([{ id: 'a' }]);
    const frag = html`<ul>${repeat(() => items.get(), i => i.id, i => html`<li id="${i.id}"></li>`)}</ul>` as DocumentFragment;
    const container = document.createElement('div');
    container.appendChild(frag);

    items.set([]);
    expect(container.querySelectorAll('li').length).toBe(0);
    expect(container.querySelector('ul')).not.toBeNull();
  });

  it('handles non-empty → empty → non-empty transitions', () => {
    const items = signal([{ id: 'a' }, { id: 'b' }]);
    const frag = html`<ul>${repeat(() => items.get(), i => i.id, i => html`<li id="${i.id}"></li>`)}</ul>` as DocumentFragment;
    const container = document.createElement('div');
    container.appendChild(frag);

    items.set([]);
    expect(container.querySelectorAll('li').length).toBe(0);

    items.set([{ id: 'x' }, { id: 'y' }, { id: 'z' }]);
    const lis = container.querySelectorAll('li');
    expect(lis.length).toBe(3);
    expect(lis[0]?.id).toBe('x');
    expect(lis[2]?.id).toBe('z');
  });
});

/**
 * Tests for ctx.watch() — imperative reactive watcher that skips the initial call.
 *
 * Run in the `dom` vitest project (needs custom element + happy-dom).
 */

import { describe, it, expect, vi } from 'vitest';
import { signal } from '../src/signals.js';
import { component } from '../src/component.js';

// Helper: mount a component into a div and return the element.
function mount(name: string): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const el = document.createElement(name);
  container.appendChild(el);
  return el;
}

// Helper: unmount and remove the element from the DOM.
function unmount(el: HTMLElement): void {
  el.parentElement?.removeChild(el);
}

describe('ctx.watch()', () => {
  it('does NOT call callback on initial mount', () => {
    const cb = vi.fn();
    const count = signal(0);
    component('watch-no-initial', (_props, ctx) => {
      ctx.watch(() => count.get(), cb);
      return ctx.html`<span></span>`;
    }, { shadow: false });

    const el = mount('watch-no-initial');
    expect(cb).not.toHaveBeenCalled();
    unmount(el);
  });

  it('calls callback with (newVal, oldVal) when signal changes', () => {
    const cb = vi.fn();
    const count = signal(10);
    component('watch-on-change', (_props, ctx) => {
      ctx.watch(() => count.get(), cb);
      return ctx.html`<span></span>`;
    }, { shadow: false });

    const el = mount('watch-on-change');
    count.set(20);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(20, 10);
    unmount(el);
  });

  it('tracks multiple changes in sequence', () => {
    const values: Array<[number, number]> = [];
    const count = signal(0);
    component('watch-multi-change', (_props, ctx) => {
      ctx.watch(() => count.get(), (n, o) => { values.push([n, o]); });
      return ctx.html`<span></span>`;
    }, { shadow: false });

    const el = mount('watch-multi-change');
    count.set(1);
    count.set(2);
    count.set(3);
    expect(values).toEqual([[1, 0], [2, 1], [3, 2]]);
    unmount(el);
  });

  it('stops calling callback after unmount', () => {
    const cb = vi.fn();
    const count = signal(0);
    component('watch-unmount', (_props, ctx) => {
      ctx.watch(() => count.get(), cb);
      return ctx.html`<span></span>`;
    }, { shadow: false });

    const el = mount('watch-unmount');
    count.set(1);
    expect(cb).toHaveBeenCalledTimes(1);

    unmount(el);
    count.set(2);
    // Should not be called again after unmount.
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('works with computed getter', () => {
    const cb = vi.fn();
    const a = signal(1);
    const b = signal(2);
    component('watch-computed', (_props, ctx) => {
      ctx.watch(() => a.get() + b.get(), cb);
      return ctx.html`<span></span>`;
    }, { shadow: false });

    const el = mount('watch-computed');
    expect(cb).not.toHaveBeenCalled();

    a.set(10);
    expect(cb).toHaveBeenCalledWith(12, 3);

    b.set(20);
    expect(cb).toHaveBeenCalledWith(30, 12);

    unmount(el);
  });
});

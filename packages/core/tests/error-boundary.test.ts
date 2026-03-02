/**
 * Tests for the `onError` option — error boundaries for component render/effect errors.
 *
 * Run in the `dom` vitest project (needs custom element + happy-dom).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signal } from '../src/signals.js';
import { component } from '../src/component.js';

function mount(name: string): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const el = document.createElement(name);
  container.appendChild(el);
  return el;
}

function unmount(el: HTMLElement): void {
  el.parentElement?.removeChild(el);
}

describe('onError — render-phase errors', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('renders the fallback string when render throws', () => {
    component('err-render-str', () => {
      throw new Error('render boom');
    }, {
      shadow: false,
      onError: () => '<p>oops</p>',
    });

    const el = mount('err-render-str');
    expect(el.innerHTML).toBe('<p>oops</p>');
    expect(consoleError).toHaveBeenCalled();
    unmount(el);
  });

  it('renders the fallback DocumentFragment when render throws', () => {
    component('err-render-frag', () => {
      throw new Error('render boom frag');
    }, {
      shadow: false,
      onError: () => {
        const frag = document.createDocumentFragment();
        const p = document.createElement('p');
        p.textContent = 'fragment fallback';
        frag.appendChild(p);
        return frag;
      },
    });

    const el = mount('err-render-frag');
    expect(el.querySelector('p')?.textContent).toBe('fragment fallback');
    unmount(el);
  });

  it('re-throws when no onError handler is provided', () => {
    component('err-no-handler', () => {
      throw new Error('no handler boom');
    }, { shadow: false });

    expect(() => mount('err-no-handler')).toThrow('no handler boom');
  });

  it('logs the error to console.error', () => {
    component('err-log', () => { throw new Error('logged error'); }, {
      shadow: false,
      onError: () => '',
    });

    mount('err-log');
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('[nativeframe]'),
      expect.any(Error),
    );
  });

  it('cleans up partial effects registered before the throw', () => {
    const disposeSpy = vi.fn();
    let effectCount = 0;

    component('err-cleanup', (_props, ctx) => {
      // Register one effect successfully.
      const handle = ctx.effect(() => { effectCount++; });
      const origDispose = handle.dispose.bind(handle);
      handle.dispose = () => { disposeSpy(); origDispose(); };

      // Then throw before returning.
      throw new Error('partial throw');
    }, {
      shadow: false,
      onError: () => '',
    });

    mount('err-cleanup');
    // The partial effect should have been disposed.
    expect(disposeSpy).toHaveBeenCalled();
  });
});

describe('onError — effect-phase errors', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('logs effect errors but keeps the component running', () => {
    const boom = signal(false);

    component('err-effect', (_props, ctx) => {
      ctx.effect(() => {
        if (boom.get()) throw new Error('effect boom');
      });
      return ctx.html`<span>ok</span>`;
    }, {
      shadow: false,
      onError: () => '',
    });

    const el = mount('err-effect');
    expect(el.querySelector('span')?.textContent).toBe('ok');

    boom.set(true);
    // Error logged, component not destroyed.
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('effect error'),
      expect.any(Error),
    );
    expect(el.querySelector('span')?.textContent).toBe('ok');
    unmount(el);
  });

  it('effect errors without onError propagate normally', () => {
    const boom = signal(false);
    let caughtError: unknown;

    component('err-effect-rethrow', (_props, ctx) => {
      ctx.effect(() => {
        if (boom.get()) throw new Error('rethrown effect');
      });
      return ctx.html`<span></span>`;
    }, { shadow: false });

    const el = mount('err-effect-rethrow');
    // Catch the error thrown by the signal system propagating it.
    try {
      boom.set(true);
    } catch (e) {
      caughtError = e;
    }
    expect((caughtError as Error).message).toBe('rethrown effect');
    unmount(el);
  });
});

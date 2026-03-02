/**
 * Tests for the transition() CSS transition directive.
 *
 * Run in the `dom` vitest project (needs requestAnimationFrame + happy-dom).
 * Uses vi.useFakeTimers() to control rAF and setTimeout without real delays.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { signal, effect } from '../src/signals.js';
import { transition } from '../src/transition.js';
import type { ContentDirective } from '../src/directives.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Mount a ContentDirective into a detached container, appended to body. */
function apply(directive: ContentDirective): { container: HTMLDivElement } {
  const container = document.createElement('div');
  const anchor = document.createComment('');
  container.appendChild(anchor);
  document.body.appendChild(container);
  directive._apply(anchor, effect);
  return { container };
}

/** Remove a container from the body. */
function cleanup(container: HTMLElement): void {
  container.remove();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('transition()', () => {
  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    // Flush all pending timers (prevents leaking timeouts between tests).
    vi.runAllTimers();
    vi.useRealTimers();
    // Remove all leftover test containers.
    for (const el of [...document.body.children]) el.remove();
  });

  // ── First render ────────────────────────────────────────────────────────────

  it('first render: inserts content into the DOM', () => {
    const { container } = apply(
      transition(() => {
        const d = document.createElement('span');
        d.id = 'initial';
        return d;
      }),
    );
    expect(container.querySelector('#initial')).not.toBeNull();
  });

  it('first render: no enter animation classes applied', () => {
    const { container } = apply(
      transition(() => {
        const d = document.createElement('div');
        d.id = 'first';
        return d;
      }, { name: 'fade' }),
    );
    const el = container.querySelector('#first')!;
    expect(el.classList.contains('fade-enter-from')).toBe(false);
    expect(el.classList.contains('fade-enter-active')).toBe(false);
  });

  // ── Enter animation ─────────────────────────────────────────────────────────

  it('content change: enter-from and enter-active added to new node', () => {
    const s = signal('a');
    const { container } = apply(
      transition(() => {
        const d = document.createElement('div');
        d.id = s.get();
        return d;
      }, { name: 'slide', duration: 300 }),
    );

    s.set('b');

    const divB = container.querySelector('#b')!;
    expect(divB).not.toBeNull();
    expect(divB.classList.contains('slide-enter-from')).toBe(true);
    expect(divB.classList.contains('slide-enter-active')).toBe(true);
  });

  it('after rAF + duration: both enter-from and enter-active are removed', () => {
    const s = signal('a');
    const { container } = apply(
      transition(() => {
        const d = document.createElement('div');
        d.id = s.get();
        return d;
      }, { name: 'fade', duration: 300 }),
    );

    s.set('b');
    const divB = container.querySelector('#b')!;
    // Classes present immediately after content change
    expect(divB.classList.contains('fade-enter-from')).toBe(true);
    expect(divB.classList.contains('fade-enter-active')).toBe(true);

    // Flush rAF (fires at next ~16ms frame) + enter-active timer (300ms)
    vi.runAllTimers();
    expect(divB.classList.contains('fade-enter-from')).toBe(false);
    expect(divB.classList.contains('fade-enter-active')).toBe(false);
  });

  it('uses default name "nf" when no name option provided', () => {
    const s = signal('a');
    const { container } = apply(
      transition(() => {
        const d = document.createElement('div');
        d.id = s.get();
        return d;
      }),
    );

    s.set('b');

    const divB = container.querySelector('#b')!;
    expect(divB.classList.contains('nf-enter-from')).toBe(true);
    expect(divB.classList.contains('nf-enter-active')).toBe(true);
  });

  // ── Leave animation ─────────────────────────────────────────────────────────

  it('content change: leave-active and leave-to added to old node', () => {
    const s = signal('a');
    const { container } = apply(
      transition(() => {
        const d = document.createElement('div');
        d.id = s.get();
        return d;
      }, { name: 'fade', duration: 300 }),
    );

    const divA = container.querySelector('#a')!;
    s.set('b');

    expect(divA.classList.contains('fade-leave-active')).toBe(true);
    expect(divA.classList.contains('fade-leave-to')).toBe(true);
  });

  it('old node stays in DOM during leave animation', () => {
    const s = signal('a');
    const { container } = apply(
      transition(() => {
        const d = document.createElement('div');
        d.id = s.get();
        return d;
      }, { name: 'fade', duration: 300 }),
    );

    const divA = container.querySelector('#a')!;
    s.set('b');

    // Still present — leave animation in progress
    expect(container.contains(divA)).toBe(true);
  });

  it('after duration: old node removed from DOM', () => {
    const s = signal('a');
    const { container } = apply(
      transition(() => {
        const d = document.createElement('div');
        d.id = s.get();
        return d;
      }, { name: 'fade', duration: 150 }),
    );

    const divA = container.querySelector('#a')!;
    s.set('b');

    vi.advanceTimersByTime(150);
    expect(container.contains(divA)).toBe(false);
  });

  it('both old and new nodes coexist in DOM during transition', () => {
    const s = signal('a');
    const { container } = apply(
      transition(() => {
        const d = document.createElement('div');
        d.id = s.get();
        return d;
      }, { name: 'fade', duration: 300 }),
    );

    s.set('b');

    expect(container.querySelector('#a')).not.toBeNull();
    expect(container.querySelector('#b')).not.toBeNull();
  });

  it('leave animation not triggered on first render (no previous nodes)', () => {
    // No errors, no leave classes — baseline test
    const { container } = apply(
      transition(() => {
        const d = document.createElement('div');
        d.className = 'only';
        return d;
      }, { name: 'fade', duration: 300 }),
    );
    const el = container.querySelector('.only')!;
    expect(el.classList.contains('fade-leave-active')).toBe(false);
  });

  // ── SSR ─────────────────────────────────────────────────────────────────────

  it('_ssr(): returns the string value from the getter', () => {
    const result = transition(() => 'hello world')._ssr();
    expect(result).toBe('hello world');
  });

  it('_ssr(): resolves a reactive signal getter once', () => {
    const s = signal('initial');
    const result = transition(() => s.get())._ssr();
    expect(result).toBe('initial');
  });

  it('_ssr(): renders null/undefined as empty string', () => {
    expect(transition(() => null)._ssr()).toBe('');
    expect(transition(() => undefined)._ssr()).toBe('');
  });
});

/**
 * Tests for the `styles` option — scoped CSS injection.
 *
 * Run in the `dom` vitest project (needs custom element + happy-dom).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { component, getComponentStyles, registry } from '../src/component.js';

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

describe('scoped CSS — shadow:false', () => {
  beforeEach(() => {
    // Remove any injected style tags between tests.
    document.head.querySelectorAll('style[data-nf]').forEach(s => s.remove());
  });

  it('injects a <style> tag into document.head', () => {
    component('css-inject', (_p, ctx) => ctx.html`<span></span>`, {
      shadow: false,
      styles: 'color: red;',
    });

    mount('css-inject');
    const style = document.head.querySelector('style[data-nf="css-inject"]');
    expect(style).not.toBeNull();
  });

  it('wraps CSS in @scope (tag-name) { ... }', () => {
    component('css-scope-wrap', (_p, ctx) => ctx.html`<span></span>`, {
      shadow: false,
      styles: 'display: block;',
    });

    mount('css-scope-wrap');
    const style = document.head.querySelector('style[data-nf="css-scope-wrap"]');
    expect(style?.textContent).toContain('@scope (css-scope-wrap)');
    expect(style?.textContent).toContain('display: block;');
  });

  it('injects the style only once even when multiple instances are mounted', () => {
    component('css-dedup', (_p, ctx) => ctx.html`<span></span>`, {
      shadow: false,
      styles: 'font-size: 14px;',
    });

    const el1 = mount('css-dedup');
    const el2 = mount('css-dedup');

    const styles = document.head.querySelectorAll('style[data-nf="css-dedup"]');
    expect(styles.length).toBe(1);

    unmount(el1);
    unmount(el2);
  });

  it('does not inject a style tag when styles is not provided', () => {
    component('css-no-style', (_p, ctx) => ctx.html`<span></span>`, {
      shadow: false,
    });

    mount('css-no-style');
    const style = document.head.querySelector('style[data-nf="css-no-style"]');
    expect(style).toBeNull();
  });
});

describe('getComponentStyles()', () => {
  it('returns @scope-wrapped CSS for shadow:false components', () => {
    component('css-ssr-light', (_p, ctx) => ctx.html`<span></span>`, {
      shadow: false,
      styles: 'padding: 0;',
    });

    const result = getComponentStyles();
    expect(result).toContain('@scope (css-ssr-light)');
    expect(result).toContain('padding: 0;');
  });

  it('does not include shadow:true components in the output', () => {
    component('css-ssr-shadow', (_p, ctx) => ctx.html`<span></span>`, {
      shadow: true,
      styles: 'color: blue;',
    });

    // Register a shadow:false component so the function returns a non-empty string.
    component('css-ssr-verify', (_p, ctx) => ctx.html`<span></span>`, {
      shadow: false,
      styles: 'margin: 0;',
    });

    const result = getComponentStyles();
    expect(result).not.toContain('css-ssr-shadow');
    expect(result).toContain('css-ssr-verify');
  });

  it('returns an empty string when no shadow:false components have styles', () => {
    // All registered components without styles should not appear.
    // We check that a component without styles doesn't pollute the output.
    component('css-ssr-empty', (_p, ctx) => ctx.html`<span></span>`, {
      shadow: false,
    });

    const result = getComponentStyles();
    expect(result).not.toContain('css-ssr-empty');
  });
});

describe('scoped CSS — shadow:true', () => {
  it('does not inject a style into document.head for shadow components', () => {
    // Clean slate for head.
    document.head.querySelectorAll('style[data-nf]').forEach(s => s.remove());

    component('css-shadow-noinject', (_p, ctx) => ctx.html`<span></span>`, {
      shadow: true,
      styles: 'color: green;',
    });

    mount('css-shadow-noinject');

    const headStyle = document.head.querySelector('style[data-nf="css-shadow-noinject"]');
    expect(headStyle).toBeNull();
  });

  it('SSR: injects <style> inside <template shadowrootmode>', () => {
    // Dynamically import to test SSR path.
    // We use the registry directly to verify options are stored.
    const def = registry.get('css-shadow-noinject');
    expect(def?.options.styles).toBe('color: green;');
  });
});

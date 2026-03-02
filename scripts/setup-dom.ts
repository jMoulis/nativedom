/**
 * scripts/setup-dom.ts
 *
 * Global setup for DOM test environment (happy-dom).
 * Runs once before each test file in the 'dom' workspace project.
 *
 * Responsibilities:
 * - Verify critical Web APIs are available
 * - Provide any missing globals that happy-dom doesn't polyfill yet
 * - Reset custom element registry between test suites
 */
import { beforeEach, afterEach } from 'vitest';

// ── Verify happy-dom provides what we need ────────────────────────────────────

const required = [
  'document',
  'window',
  'customElements',
  'HTMLElement',
  'Node',
  'NodeFilter',
  'MutationObserver',
];

for (const api of required) {
  if (typeof globalThis[api as keyof typeof globalThis] === 'undefined') {
    throw new Error(
      `[nativeframe/test] Required Web API "${api}" is not available in happy-dom. ` +
      `Update happy-dom or provide a polyfill.`,
    );
  }
}

// ── Custom Elements registry cleanup ─────────────────────────────────────────
//
// The customElements registry is global and persistent within a test file.
// We track which elements were defined in each test to warn about conflicts,
// but we cannot actually clear the registry (browser spec doesn't allow it).
//
// Strategy: each test suite uses unique tag names (suffixed with test ID)
// OR we rely on happy-dom's per-file isolation (each file gets a fresh window).

const definedInCurrentTest = new Set<string>();

beforeEach(() => {
  definedInCurrentTest.clear();
});

afterEach(() => {
  // Nothing to clear — happy-dom resets the window between test files.
  // Within a file, component tests must use unique tag names per test.
});

// ── Extend globalThis for test utilities ─────────────────────────────────────

declare global {
  // Helper to get the shadow root of a custom element in tests
  function getShadowRoot(el: HTMLElement): ShadowRoot;
  // Helper to wait for custom element upgrade
  function whenDefined(tagName: string): Promise<CustomElementConstructor>;
}

globalThis.getShadowRoot = (el: HTMLElement): ShadowRoot => {
  const root = el.shadowRoot;
  if (root === null) {
    throw new Error(
      `Element <${el.tagName.toLowerCase()}> has no shadow root. ` +
      `Did you use shadow: true in your component definition?`,
    );
  }
  return root;
};

globalThis.whenDefined = (tagName: string): Promise<CustomElementConstructor> =>
  customElements.whenDefined(tagName);

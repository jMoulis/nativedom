/**
 * @nativeframe/core - directives.ts
 *
 * Base infrastructure for content directives — special interpolation values
 * that take direct control over a content binding's anchor node.
 *
 * Kept separate from html.ts to avoid circular imports:
 *   html.ts  → directives.ts  (no cycle)
 *   repeat.ts → directives.ts (no cycle)
 *   repeat.ts → html.ts       (no cycle)
 */

import type { EffectFn, EffectHandle } from './signals.js';

// ─── Brand ────────────────────────────────────────────────────────────────────

/** Unique symbol used to brand content directives at runtime. */
export const DIRECTIVE_BRAND = Symbol('nf.directive');

// ─── Interface ────────────────────────────────────────────────────────────────

/**
 * A content directive controls a binding's anchor node directly,
 * enabling optimised DOM management (e.g. keyed list reconciliation).
 *
 * Produced by helpers such as repeat(). Not intended to be implemented
 * by end users.
 */
export interface ContentDirective {
  readonly [DIRECTIVE_BRAND]: true;

  /**
   * Client: install reactive behaviour against the anchor comment node.
   * @param anchor        Stable end-anchor comment node for this binding's DOM range.
   * @param scopedEffect  Effect registrar scoped to the owning component's lifecycle.
   */
  _apply(anchor: Comment, scopedEffect: (fn: EffectFn) => EffectHandle): void;

  /** Server: produce an HTML string (no DOM, no effects). */
  _ssr(): string;
}

// ─── Type guard ───────────────────────────────────────────────────────────────

export function isContentDirective(value: unknown): value is ContentDirective {
  return (
    typeof value === 'object' &&
    value !== null &&
    DIRECTIVE_BRAND in value &&
    (value as ContentDirective)[DIRECTIVE_BRAND] === true
  );
}

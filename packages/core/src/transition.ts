/**
 * @nativeframe/core - transition.ts
 *
 * CSS transition directive for html`` templates.
 *
 * transition(getter, options) watches a reactive getter and animates content
 * changes using CSS class hooks:
 *
 *   Enter: `{name}-enter-from` + `{name}-enter-active` added immediately,
 *          `{name}-enter-from` removed on next animation frame (triggers transition
 *          from the "from" state to the element's natural state),
 *          `{name}-enter-active` removed after transitionend/animationend (or duration ms).
 *
 *   Leave: `{name}-leave-active` + `{name}-leave-to` added to outgoing node,
 *          node removed from DOM after transitionend/animationend (or duration ms).
 *
 * The first render (page load) is not animated to avoid a flash of invisible content.
 * SSR: renders the initial getter value as a plain string without animation classes.
 *
 * @example
 * // CSS:
 * //   .fade-enter-active, .fade-leave-active { transition: opacity 250ms ease; }
 * //   .fade-enter-from, .fade-leave-to { opacity: 0; }
 *
 * html`<div>${transition(() => router.outlet(), { name: 'fade' })}</div>`
 */

import { DIRECTIVE_BRAND, isContentDirective, type ContentDirective } from './directives.js';
import type { EffectFn, EffectHandle } from './signals.js';
import type { Interpolation } from './html.js';

// ─── Public API ───────────────────────────────────────────────────────────────

export interface TransitionOptions {
  /** CSS class name prefix. Default: 'nf'. */
  name?: string;
  /** Fallback removal delay in ms when transitionend/animationend never fires. Default: 300. */
  duration?: number;
}

/**
 * Animate content changes with enter/leave CSS transitions.
 *
 * Watches a reactive getter and applies CSS classes to entering/leaving nodes
 * whenever the content changes. The class naming convention matches Vue's
 * transition system for familiar CSS authoring.
 *
 * Classes applied to the first Element node in the content:
 * - **Enter**: `{name}-enter-from` + `{name}-enter-active` (enter-from removed on rAF)
 * - **Leave**: `{name}-leave-active` + `{name}-leave-to`
 *
 * If no CSS transition is defined on the element, a fallback `setTimeout` of
 * `duration` ms ensures nodes are eventually removed/cleaned up.
 *
 * @param getter  Reactive getter returning the content to display. Tracked as a
 *                signal dependency — content swaps whenever this returns a new value.
 * @param options Optional `name` (CSS prefix, default 'nf') and `duration` (fallback ms).
 */
export function transition(
  getter: () => Interpolation,
  options?: TransitionOptions,
): ContentDirective {
  const name = options?.name ?? 'nf';
  const duration = options?.duration ?? 300;

  return {
    [DIRECTIVE_BRAND]: true,

    _apply(anchor: Comment, scopedEffect: (fn: EffectFn) => EffectHandle): void {
      let currentNodes: ChildNode[] = [];
      let isFirst = true;

      scopedEffect(() => {
        const newNodes = toChildNodes(getter());
        const first = isFirst;
        isFirst = false;

        // ── Leave phase ──────────────────────────────────────────────────────
        // Animate old nodes out; they stay in the DOM until the transition ends.
        const leaving = currentNodes;
        if (!first && leaving.length > 0) {
          const el = leaving.find(isElementNode);
          if (el !== undefined) {
            el.classList.add(`${name}-leave-active`, `${name}-leave-to`);
          }
          let leaveTimer: ReturnType<typeof setTimeout> | undefined;
          let leaveDone = false;
          const finishLeave = (): void => {
            if (leaveDone) return;
            leaveDone = true;
            if (leaveTimer !== undefined) clearTimeout(leaveTimer);
            for (const n of leaving) n.parentNode?.removeChild(n);
          };
          if (el !== undefined) {
            el.addEventListener('transitionend', finishLeave, { once: true });
            el.addEventListener('animationend', finishLeave, { once: true });
          }
          leaveTimer = setTimeout(finishLeave, duration);
        }

        // ── Enter phase ──────────────────────────────────────────────────────
        // Add enter classes before inserting so the browser sees the initial state.
        const enterEl = newNodes.find(isElementNode);
        if (!first && enterEl !== undefined) {
          enterEl.classList.add(`${name}-enter-from`, `${name}-enter-active`);
        }

        for (const n of newNodes) anchor.parentNode?.insertBefore(n, anchor);
        currentNodes = newNodes;

        // On the next animation frame, remove enter-from to trigger the transition.
        // Then wait for transitionend (or fallback) to clean up enter-active.
        if (!first && enterEl !== undefined) {
          requestAnimationFrame(() => {
            enterEl.classList.remove(`${name}-enter-from`);
            let enterTimer: ReturnType<typeof setTimeout> | undefined;
            let enterDone = false;
            const finishEnter = (): void => {
              if (enterDone) return;
              enterDone = true;
              if (enterTimer !== undefined) clearTimeout(enterTimer);
              enterEl.classList.remove(`${name}-enter-active`);
            };
            enterEl.addEventListener('transitionend', finishEnter, { once: true });
            enterEl.addEventListener('animationend', finishEnter, { once: true });
            enterTimer = setTimeout(finishEnter, duration);
          });
        }
      });
    },

    _ssr(): string {
      return ssrVal(getter());
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isElementNode(n: Node): n is Element {
  return n.nodeType === Node.ELEMENT_NODE;
}

/** Convert an Interpolation to a flat array of ChildNodes (client only). */
function toChildNodes(val: unknown): ChildNode[] {
  if (val instanceof DocumentFragment) return [...val.childNodes] as ChildNode[];
  if (val instanceof Node) return [val as ChildNode];
  if (Array.isArray(val)) return (val as unknown[]).flatMap(toChildNodes);
  return [document.createTextNode(val == null ? '' : String(val))];
}

/** Convert an Interpolation to an HTML string (server only). */
function ssrVal(val: unknown): string {
  if (isContentDirective(val)) return val._ssr();
  if (typeof val === 'string') return val;
  if (val == null) return '';
  if (Array.isArray(val)) return (val as unknown[]).map(ssrVal).join('');
  if (typeof val === 'function') return ssrVal((val as () => unknown)());
  return String(val);
}

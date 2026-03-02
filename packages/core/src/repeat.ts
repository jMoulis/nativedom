/**
 * @nativedom/core - repeat.ts
 *
 * Keyed list reconciliation for html`` templates.
 *
 * repeat(getter, keyFn, renderFn) produces a ContentDirective that maintains
 * a stable Map<key → ChildNode[]>. On each reactive update it:
 *   1. Removes nodes whose keys are no longer present
 *   2. Creates nodes for new keys (rendered once, never re-rendered by repeat)
 *   3. Moves existing nodes into the correct order using a right-to-left
 *      insertion pass — only nodes that are out of position are touched
 *
 * This means Custom Elements keep their identity across list mutations:
 * connectedCallback / disconnectedCallback only fire on actual add/remove,
 * not on every signal change, and internal reactive effects survive intact.
 */

import { DIRECTIVE_BRAND, isContentDirective, type ContentDirective } from './directives.js';
import { withEffectScope } from './html.js';
import type { EffectFn, EffectHandle } from './signals.js';
import type { Interpolation } from './html.js';

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Keyed list renderer for use inside html`` templates.
 *
 * Routes DOM mutations through a stable key→nodes map so that unchanged
 * items keep their existing DOM nodes across reactive updates.
 *
 * @param getter    Reactive getter returning the current item array.
 *                  Tracked as a signal dependency — the list reconciles
 *                  whenever this returns a new array.
 * @param keyFn     Returns a stable, unique key for each item.
 *                  Keys are used to match old nodes to new positions.
 * @param renderFn  Called once per new key to produce DOM content.
 *                  For Custom Elements, the element itself handles reactive
 *                  updates to its own content — renderFn is not called again
 *                  for items already in the list.
 *
 * @example
 * html`
 *   <ul>
 *     ${repeat(
 *       () => todos.get(),
 *       t => t.id,
 *       t => html`<todo-item todo-id="${t.id}"></todo-item>`,
 *     )}
 *   </ul>
 * `
 */
export function repeat<T>(
  getter: () => T[],
  keyFn: (item: T, index: number) => string | number,
  renderFn: (item: T, index: number) => Interpolation,
): ContentDirective {
  return {
    [DIRECTIVE_BRAND]: true,

    // ── Client ─────────────────────────────────────────────────────────────

    _apply(anchor: Comment, scopedEffect: (fn: EffectFn) => EffectHandle): void {
      // Stable map from key → the ChildNodes currently in the DOM for that item.
      const nodeMap = new Map<string | number, ChildNode[]>();

      scopedEffect(() => {
        const items = getter();
        const newKeys = items.map(keyFn);
        const newKeySet = new Set(newKeys);

        // 1. Remove nodes for keys that are no longer in the list.
        for (const [key, nodes] of nodeMap) {
          if (!newKeySet.has(key)) {
            for (const n of nodes) n.parentNode?.removeChild(n);
            nodeMap.delete(key);
          }
        }

        // 2. Walk right-to-left, inserting/moving each item before a cursor.
        //    Starting cursor = anchor (end of the binding's range).
        //    After each item, the cursor moves to the item's first node.
        //    This produces the correct left-to-right order in a single pass.
        let cursor: Node = anchor;

        for (let i = items.length - 1; i >= 0; i--) {
          const item = items[i]!;
          const key = newKeys[i]!;

          let nodes = nodeMap.get(key);

          if (nodes === undefined) {
            // New key — render once, with effects scoped to the component.
            const rendered = withEffectScope(scopedEffect, () => renderFn(item, i));
            nodes = toChildNodes(rendered);
            nodeMap.set(key, nodes);
            // Insert all nodes before the cursor.
            for (const n of nodes) anchor.parentNode?.insertBefore(n, cursor);
          } else {
            // Existing key — move only if the last node is not already
            // immediately before the cursor (position check).
            const last = nodes[nodes.length - 1];
            if (last !== undefined && last.nextSibling !== cursor) {
              for (const n of nodes) anchor.parentNode?.insertBefore(n, cursor);
            }
          }

          // Advance cursor to the first node of this item.
          if (nodes.length > 0) cursor = nodes[0]!;
        }
      });
    },

    // ── Server ─────────────────────────────────────────────────────────────

    _ssr(): string {
      return getter()
        .map((item, i) => ssrInterpolation(renderFn(item, i)))
        .join('');
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert an Interpolation to a flat array of ChildNodes (client only). */
function toChildNodes(val: unknown): ChildNode[] {
  if (val instanceof DocumentFragment) return [...val.childNodes] as ChildNode[];
  if (val instanceof Node) return [val as ChildNode];
  if (Array.isArray(val)) return (val as unknown[]).flatMap(toChildNodes);
  const text = document.createTextNode(val == null ? '' : String(val));
  return [text];
}

/** Convert an Interpolation to an HTML string (server only). */
function ssrInterpolation(val: unknown): string {
  if (isContentDirective(val)) return val._ssr();
  if (typeof val === 'string') return val;
  if (val == null) return '';
  if (Array.isArray(val)) return (val as unknown[]).map(ssrInterpolation).join('');
  if (typeof val === 'function') return ssrInterpolation((val as () => unknown)());
  return String(val);
}

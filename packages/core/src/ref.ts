/**
 * @nativedom/core - ref.ts
 *
 * Refs — a way to get a direct handle to a DOM element from inside a template.
 *
 * @example
 * component('my-input', (_, ctx) => {
 *   const inputRef = ctx.ref<HTMLInputElement>();
 *
 *   ctx.onMount(() => { inputRef.el?.focus(); });
 *
 *   return html`<input ref="${inputRef}" type="text" />`;
 * });
 */

// ─── Brand ────────────────────────────────────────────────────────────────────

export const REF_BRAND = Symbol('nf.ref');

// ─── Public types ─────────────────────────────────────────────────────────────

/**
 * A ref object whose `el` property is populated when the element mounts.
 * Pass it to a `ref="${refObj}"` binding in an html`` template.
 *
 * `el` is typed as `T | null`:
 *   - `null` before the component mounts or after it disconnects
 *   - `T` while the component is connected to the DOM
 */
export interface Ref<T extends Element = Element> {
  readonly [REF_BRAND]: true;
  el: T | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function createRef<T extends Element>(): Ref<T> {
  return { [REF_BRAND]: true, el: null };
}

export function isRef(value: unknown): value is Ref<Element> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<symbol, unknown>)[REF_BRAND] === true
  );
}

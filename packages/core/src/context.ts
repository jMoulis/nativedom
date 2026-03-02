/**
 * @nativeframe/core - context.ts
 *
 * Provide/inject — pass data down the component tree without explicit prop threading.
 *
 * @example
 * const ThemeCtx = createContext<'light' | 'dark'>('light');
 *
 * // Provider component:
 * component('app-shell', (_, ctx) => {
 *   ctx.provide(ThemeCtx, 'dark');
 *   return html`...`;
 * });
 *
 * // Consumer component (any descendant):
 * component('app-button', (_, ctx) => {
 *   const theme = ctx.inject(ThemeCtx); // 'dark'
 *   return html`<button class="${theme}">...</button>`;
 * });
 *
 * For reactive context, set T = Signal<...> and provide a signal:
 *
 * const UserCtx = createContext<Signal<User | null>>(signal(null));
 * ctx.provide(UserCtx, userSignal);
 *
 * const user = ctx.inject(UserCtx); // Signal<User | null>
 * html`<span>${() => user.get()?.name}</span>`
 */

// ─── Context descriptor ───────────────────────────────────────────────────────

/**
 * A typed context descriptor created by `createContext()`.
 * Pass it to `ctx.provide()` and `ctx.inject()`.
 */
export interface Context<T> {
  /** Unique symbol identifying this context. */
  readonly _id: symbol;
  /** Fallback value returned when no provider is found in the tree. */
  readonly _defaultValue: T;
}

/**
 * Create a new context descriptor with a default value.
 * The default is returned by `inject` when no ancestor has called `provide`.
 */
export function createContext<T>(defaultValue: T): Context<T> {
  return { _id: Symbol(), _defaultValue: defaultValue };
}

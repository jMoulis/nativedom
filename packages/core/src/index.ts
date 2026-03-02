/**
 * @nativeframe/core
 *
 * Public API barrel — re-exports signals, html, and component.
 */

export * from './signals.js';
export { createContext } from './context.js';
export type { Context } from './context.js';
export { createRef } from './ref.js';
export type { Ref } from './ref.js';
export * from './html.js'; // includes Slot, trustedHtml, html, ssrHtml, Interpolation…
export * from './component.js';
export * from './directives.js';
export { repeat } from './repeat.js';
export { transition } from './transition.js';
export type { TransitionOptions } from './transition.js';
export type { ContentDirective } from './directives.js';
export { asyncSignal } from './async.js';
export type { AsyncState, AsyncSignalOptions } from './async.js';

import { component, transition } from "@nativedom/core";
import type { Interpolation } from "@nativedom/core";
import { router } from "../router.js";

export const HnApp = component(
  "hn-app",
  (_, { html }) => html`
    <header class="header">
      <a class="header-logo" href="/">Y</a>
      <a class="header-title" href="/">Hacker News</a>
    </header>
    <div class="main">
      ${transition(() => router.outlet() as Interpolation, { name: "fade", duration: 250 })}
    </div>
  `,
  { shadow: false },
);

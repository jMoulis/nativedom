import { component, type Slot } from "@nativedom/core";

/**
 * A labelled section used in the story detail view.
 *
 * Demonstrates named slots: `heading` accepts any Interpolation (including
 * reactive getters) and `children` accepts the comment list (repeat directive).
 */
export const DetailSection = component<{ heading?: Slot; children?: Slot }>(
  "detail-section",
  ({ heading, children }, { html }) => html`
    <section class="detail-section">
      <p class="comments-heading">${heading}</p>
      <div>${children}</div>
    </section>
  `,
  { shadow: false },
);

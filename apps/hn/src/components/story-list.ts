import { component, asyncSignal, repeat } from "@nativeframe/core";
import { fetchTopStories } from "../lib/hn-api.js";
import { StoryItem } from "./story-item.js";

export const StoryList = component(
  "story-list",
  (_, { html }) => {
    const {
      data: ids,
      loading,
      error,
    } = asyncSignal(() => fetchTopStories(30));

    return html`
      <div>
        ${() =>
          error.get()
            ? html`<p class="error">
                Failed to load stories. Check your connection.
              </p>`
            : loading.get()
              ? html`<p class="loading">Loading top stories…</p>`
              : html`
                  <ol class="story-list">
                    ${repeat(
                      () => ids.get() ?? [],
                      (id) => id,
                      (id, index) => StoryItem({ "story-id": id, rank: index + 1 }),
                    )}
                  </ol>
                `}
      </div>
    `;
  },
  { shadow: false },
);

import { component, asyncSignal, repeat } from "@nativedom/core";
import { fetchItem, hostname, timeAgo } from "../lib/hn-api.js";
import { CommentItem, CommentDepthCtx } from "./comment-item.js";
import { DetailSection } from "./detail-section.js";

export const StoryDetail = component<{ "story-id": string }>(
  "story-detail",
  ({ "story-id": storyId }, { html, provide }) => {
    provide(CommentDepthCtx, 0);
    const {
      data: story,
      loading,
      error,
    } = asyncSignal(() => fetchItem(Number(storyId)));

    return html`
      <div class="story-detail">
        <a class="back-link" href="/">← Back</a>
        ${() => {
          console.log(story.get());
          return error.get()
            ? html`<p class="error">Failed to load story.</p>`
            : loading.get()
              ? html`<p class="loading">Loading story…</p>`
              : html`
                  <div class="detail-title">
                    <a
                      href="${() => story.get()?.url ?? ""}"
                      target="${() => (story.get()?.url ? "_blank" : "_self")}"
                      rel="noopener noreferrer"
                      >${() => story.get()?.title ?? ""}</a
                    >
                    ${() =>
                      story.get()?.url
                        ? html`<span class="story-host"
                            >(${hostname(story.get()?.url)})</span
                          >`
                        : ""}
                  </div>
                  <div class="detail-meta">
                    ${() => story.get()?.score ?? 0} points by
                    ${() => story.get()?.by ?? ""} ·
                    ${() => timeAgo(story.get()?.time)}
                  </div>
                  ${() =>
                    story.get()?.text
                      ? html`<div
                          class="detail-text"
                          .innerHTML="${() => story.get()?.text ?? ""}"
                        ></div>`
                      : ""}
                  ${DetailSection({
                    heading: () => `${story.get()?.descendants ?? 0} comments`,
                    children: repeat(
                      () => story.get()?.kids ?? [],
                      (id) => id,
                      (id) => CommentItem({ "comment-id": id }),
                    ),
                  })}
                `;
        }}
      </div>
    `;
  },
  { shadow: false },
);

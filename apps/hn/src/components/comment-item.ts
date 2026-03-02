import { component, asyncSignal, repeat, createContext, type ComponentFactory } from "@nativedom/core";
import { fetchItem, timeAgo } from "../lib/hn-api.js";

/** Tracks comment nesting depth. Provided by story-detail, incremented by each comment-item. */
export const CommentDepthCtx = createContext<number>(0);

const MAX_DEPTH = 6;

export const CommentItem: ComponentFactory<{ "comment-id": number }> = component<{ "comment-id": number }>(
  "comment-item",
  ({ "comment-id": commentId }, { html, inject, provide }) => {
    const depth = inject(CommentDepthCtx);
    provide(CommentDepthCtx, depth + 1);

    const { data: comment, loading } = asyncSignal(() =>
      fetchItem(commentId),
    );

    const indentStyle = `margin-left: ${depth * 16}px`;

    return html`
      <div class="comment" style="${() => indentStyle}">
        ${() =>
          loading.get()
            ? html`<span class="placeholder">…</span>`
            : !comment.get() || comment.get()?.deleted || comment.get()?.dead
              ? ""
              : html`
                  <div class="comment-meta">
                    <strong>${() => comment.get()?.by ?? "[deleted]"}</strong>
                    · ${() => timeAgo(comment.get()?.time)}
                  </div>
                  <div
                    class="comment-text"
                    .innerHTML="${() => comment.get()?.text ?? ""}"
                  ></div>
                  ${() =>
                    depth < MAX_DEPTH && (comment.get()?.kids?.length ?? 0) > 0
                      ? html`<div class="comment-children">
                          ${repeat(
                            () => comment.get()?.kids ?? [],
                            (id) => id,
                            (id) => CommentItem({ "comment-id": id }),
                          )}
                        </div>`
                      : ""}
                `}
      </div>
    `;
  },
  { shadow: false },
);

import { component, asyncSignal } from "@nativedom/core";
import { fetchItem, hostname, timeAgo } from "../lib/hn-api.js";

export const StoryItem = component<{ "story-id": number; rank: number }>(
  "story-item",
  ({ "story-id": storyId, rank }, { html }) => {
    const { data: item, loading } = asyncSignal(() => fetchItem(storyId));

    return html`
      <li class="story-row">
        <span class="story-rank">${rank}.</span>
        <div class="story-body">
          ${() =>
            loading.get()
              ? html`<span class="placeholder">Loading…</span>`
              : html`
                  <div class="story-title">
                    <a
                      href="${() => `/story/${storyId}`}"
                      target="_self"
                      rel="noopener noreferrer"
                      >${() => item.get()?.title ?? ""}</a
                    >
                    ${() =>
                      item.get()?.url
                        ? html`<span class="story-host"
                            >(${hostname(item.get()?.url)})</span
                          >`
                        : ""}
                  </div>
                  <div class="story-meta">
                    ${() => item.get()?.score ?? 0} points by
                    ${() => item.get()?.by ?? ""}
                    ${() => timeAgo(item.get()?.time)} ·
                    <a href="${() => `/story/${storyId}`}">
                      ${() => {
                        return item.get()?.descendants ?? 0;
                      }}
                      comments
                    </a>
                  </div>
                `}
        </div>
      </li>
    `;
  },
  { shadow: false },
);

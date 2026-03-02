import { html } from "@nativedom/core";
import { createRouter } from "@nativedom/router";
import { StoryList } from "./components/story-list.js";
import { StoryDetail } from "./components/story-detail.js";

export const router = createRouter(
  [
    {
      path: "/",
      render: () => StoryList(),
    },
    {
      path: "/story/:id",
      render: (params) => StoryDetail({ "story-id": params["id"] ?? "" }),
    },
    {
      path: "*",
      render: () => html`<p class="not-found">Not found</p>`,
    },
  ],
  { interceptLinks: true },
);

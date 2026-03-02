/**
 * Hacker News Firebase API helpers.
 * https://github.com/HackerNews/API
 */

const BASE = "https://hacker-news.firebaseio.com/v0";

export interface HNItem {
  id: number;
  type: "story" | "comment" | "ask" | "job" | "poll" | "pollopt";
  title?: string;
  url?: string;
  text?: string;
  by?: string;
  score?: number;
  time?: number;
  kids?: number[];
  descendants?: number;
  dead?: boolean;
  deleted?: boolean;
}

export function fetchTopStories(limit = 30): Promise<number[]> {
  return fetch(`${BASE}/topstories.json`)
    .then((r) => r.json() as Promise<number[]>)
    .then((ids) => ids.slice(0, limit));
}

export function fetchItem(id: number): Promise<HNItem> {
  return fetch(`${BASE}/item/${id}.json`).then(
    (r) => r.json() as Promise<HNItem>,
  );
}

/** Returns the hostname of a URL for display, e.g. "github.com". */
export function hostname(url: string | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Human-readable elapsed time, e.g. "3h ago". */
export function timeAgo(unix: number | undefined): string {
  if (!unix) return "";
  const diff = Math.floor(Date.now() / 1000) - unix;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

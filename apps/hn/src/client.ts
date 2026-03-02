/**
 * HN reader — client entry point.
 *
 * router.ts transitively imports story-list → story-item and
 * story-detail → comment-item, registering all four custom elements.
 * hn-app.ts imports router.ts and registers the shell element.
 */

import "./router.js";
import "./components/hn-app.js";

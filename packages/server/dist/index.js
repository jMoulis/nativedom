// src/renderer.ts
import { ssrRender } from "@nativedom/core";
function buildShell(options) {
  const { title = "", head = "", lang = "en" } = options;
  return `<!DOCTYPE html>
<html lang="${escapeAttr(lang)}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
` + (title ? `  <title>${escapeHtml(title)}</title>
` : "") + (head ? `  ${head}
` : "") + `</head>
<body>
`;
}
function buildTail(options) {
  const { storeSnapshot, scripts = [] } = options;
  const storeScript = storeSnapshot !== void 0 ? `<script>window.__NF_STORE__ = ${JSON.stringify(storeSnapshot)};</script>` : "";
  const scriptTags = scripts.map((src) => `<script type="module" src="${escapeAttr(src)}"></script>`).join("\n    ");
  return (storeScript ? `  ${storeScript}
` : "") + (scriptTags ? `  ${scriptTags}
` : "") + `</body>
</html>`;
}
function renderPage(rootComponent, props = {}, options = {}) {
  const html = buildShell(options) + `  ${ssrRender(rootComponent, props)}
` + buildTail(options);
  return {
    html,
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Transfer-Encoding": "chunked"
    }
  };
}
async function* streamPage(rootComponent, props = {}, options = {}) {
  yield buildShell(options);
  yield `  ${ssrRender(rootComponent, props)}
`;
  yield buildTail(options);
}
function renderFragment(component, props = {}) {
  return ssrRender(component, props);
}
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(str) {
  return str.replace(/"/g, "&quot;");
}
export {
  renderFragment,
  renderPage,
  streamPage
};
//# sourceMappingURL=index.js.map
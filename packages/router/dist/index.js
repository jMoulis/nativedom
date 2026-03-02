// src/router.ts
import { signal, computed } from "@nativeframe/core";
function matchRoute(pattern, path) {
  if (pattern === "*") return {};
  const normalize = (s) => s.split("/").filter(Boolean);
  const patternParts = normalize(pattern);
  const pathParts = normalize(path);
  if (patternParts.length !== pathParts.length) return null;
  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    const seg = patternParts[i] ?? "";
    const val = pathParts[i] ?? "";
    if (seg.startsWith(":")) {
      params[seg.slice(1)] = decodeURIComponent(val);
    } else if (seg !== val) {
      return null;
    }
  }
  return params;
}
function resolveMatch(routes, path) {
  for (const route of routes) {
    const params = matchRoute(route.path, path);
    if (params !== null) return { route, params };
  }
  return null;
}
function parseQuery(search) {
  const params = {};
  new URLSearchParams(search).forEach((v, k) => {
    params[k] = v;
  });
  return params;
}
function createRouter(routes, options = {}) {
  const mode = options.mode ?? "history";
  const isClient = typeof window !== "undefined";
  const getPath = () => {
    if (!isClient) return options.ssrPath ?? "/";
    if (mode === "hash") return window.location.hash.slice(1) || "/";
    return window.location.pathname;
  };
  const getQuery = () => isClient ? parseQuery(window.location.search) : {};
  const _path = signal(getPath());
  const _query = signal(getQuery());
  const currentPath = computed(() => _path.get());
  const currentQuery = computed(() => _query.get());
  const currentMatch = computed(() => resolveMatch(routes, _path.get()));
  const currentParams = computed(() => currentMatch.get()?.params ?? {});
  const _loadVersion = signal(0);
  const loadedRoutes = /* @__PURE__ */ new Set();
  const pendingRoutes = /* @__PURE__ */ new Set();
  const navigate = (to) => {
    if (!isClient) return;
    const qIdx = to.indexOf("?");
    const pathname = qIdx >= 0 ? to.slice(0, qIdx) : to;
    const search = qIdx >= 0 ? to.slice(qIdx) : "";
    if (mode === "hash") {
      window.location.hash = pathname;
    } else {
      history.pushState(null, "", to);
    }
    _path.set(pathname);
    _query.set(parseQuery(search));
  };
  if (isClient) {
    if (mode === "hash") {
      window.addEventListener("hashchange", () => {
        _path.set(window.location.hash.slice(1) || "/");
        _query.set(parseQuery(window.location.search));
      });
    } else {
      window.addEventListener("popstate", () => {
        _path.set(window.location.pathname);
        _query.set(parseQuery(window.location.search));
      });
    }
  }
  if (isClient && options.interceptLinks === true) {
    document.addEventListener("click", (e) => {
      const anchor = e.target.closest("a[href]");
      if (anchor === null) return;
      const href = anchor.getAttribute("href");
      if (href === null || href.startsWith("http") || href.startsWith("//") || href.startsWith("mailto:") || anchor.target !== "" && anchor.target !== "_self") return;
      e.preventDefault();
      navigate(href);
    });
  }
  const outlet = () => {
    const match = currentMatch.get();
    if (match === null) return null;
    const { route, params } = match;
    if (route.load !== void 0) {
      _loadVersion.get();
      if (!loadedRoutes.has(route)) {
        if (!pendingRoutes.has(route)) {
          pendingRoutes.add(route);
          route.load().then(
            () => {
              loadedRoutes.add(route);
              pendingRoutes.delete(route);
              _loadVersion.set(_loadVersion.peek() + 1);
            },
            () => {
              pendingRoutes.delete(route);
            }
          );
        }
        return null;
      }
    }
    return route.render(params);
  };
  const link = (e) => {
    e.preventDefault();
    const href = e.currentTarget.getAttribute("href");
    if (href !== null) navigate(href);
  };
  return { outlet, navigate, link, currentPath, currentParams, currentQuery };
}
export {
  createRouter
};
//# sourceMappingURL=index.js.map
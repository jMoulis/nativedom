// src/signals.ts
var currentEffect = null;
var batchDepth = 0;
var pendingEffects = /* @__PURE__ */ new Set();
function signal(initialValue) {
  let value = initialValue;
  const subscribers = /* @__PURE__ */ new Set();
  return {
    get() {
      if (currentEffect !== null) {
        subscribers.add(currentEffect);
        currentEffect.deps.add(subscribers);
      }
      return value;
    },
    set(newValue) {
      if (Object.is(value, newValue)) return;
      value = newValue;
      notify(subscribers);
    },
    peek() {
      return value;
    }
  };
}
function effect(fn) {
  let cleanup = null;
  const effectFn = () => {
    internalDispose();
    const prev = currentEffect;
    currentEffect = effectFn;
    effectFn.deps = /* @__PURE__ */ new Set();
    try {
      const result = fn();
      if (typeof result === "function") {
        cleanup = result;
      }
    } finally {
      currentEffect = prev;
    }
  };
  effectFn.deps = /* @__PURE__ */ new Set();
  function internalDispose() {
    if (cleanup !== null) {
      cleanup();
      cleanup = null;
    }
    effectFn.deps.forEach((subs) => {
      subs.delete(effectFn);
    });
    effectFn.deps.clear();
  }
  effectFn();
  return {
    dispose() {
      internalDispose();
    }
  };
}
function computed(fn) {
  const s = signal(untrack(fn));
  effect(() => {
    s.set(fn());
  });
  return {
    get: () => s.get(),
    peek: () => s.peek()
  };
}
function batch(fn) {
  batchDepth++;
  try {
    fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      const toRun = new Set(pendingEffects);
      pendingEffects.clear();
      toRun.forEach((e) => {
        e();
      });
    }
  }
}
function untrack(fn) {
  const prev = currentEffect;
  currentEffect = null;
  try {
    return fn();
  } finally {
    currentEffect = prev;
  }
}
function notify(subscribers) {
  if (subscribers.size === 0) return;
  if (batchDepth > 0) {
    subscribers.forEach((e) => {
      pendingEffects.add(e);
    });
  } else {
    [...subscribers].forEach((e) => {
      e();
    });
  }
}

// src/context.ts
function createContext(defaultValue) {
  return { _id: /* @__PURE__ */ Symbol(), _defaultValue: defaultValue };
}

// src/ref.ts
var REF_BRAND = /* @__PURE__ */ Symbol("nf.ref");
function createRef() {
  return { [REF_BRAND]: true, el: null };
}
function isRef(value) {
  return typeof value === "object" && value !== null && value[REF_BRAND] === true;
}

// src/directives.ts
var DIRECTIVE_BRAND = /* @__PURE__ */ Symbol("nf.directive");
function isContentDirective(value) {
  return typeof value === "object" && value !== null && DIRECTIVE_BRAND in value && value[DIRECTIVE_BRAND] === true;
}

// src/html.ts
var MARKER = "__NF__";
var CONTENT_MARKER_RE = /^__NF__(\d+)$/;
var ATTR_MARKER_RE = /__NF__(\d+)/g;
var EVENT_PREFIX = "@";
var PROP_PREFIX = ".";
var templateCache = /* @__PURE__ */ new WeakMap();
var _currentScope = null;
function withEffectScope(scopedEffect, run) {
  _currentScope = scopedEffect;
  try {
    return run();
  } finally {
    _currentScope = null;
  }
}
function getCurrentScope() {
  return _currentScope;
}
function html(strings, ...values) {
  if (typeof window === "undefined") {
    return ssrHtml(strings, values);
  }
  return clientHtml(strings, values);
}
function clientHtml(strings, values) {
  let template = templateCache.get(strings);
  if (template === void 0) {
    template = buildTemplate(strings);
    templateCache.set(strings, template);
  }
  const fragment = template.content.cloneNode(true);
  const bindings = collectBindings(fragment);
  for (const binding of bindings) {
    const value = values[binding.index];
    if (value !== void 0) {
      applyBinding(binding, value);
    }
  }
  return fragment;
}
function buildTemplate(strings) {
  let raw = "";
  for (let i = 0; i < strings.length; i++) {
    raw += strings[i];
    if (i < strings.length - 1) {
      const lastOpen = raw.lastIndexOf("<");
      const lastClose = raw.lastIndexOf(">");
      const inTag = lastOpen > lastClose;
      if (inTag) {
        raw += `${MARKER}${i}`;
      } else {
        raw += `<!--${MARKER}${i}-->`;
      }
    }
  }
  const tmpl = document.createElement("template");
  tmpl.innerHTML = raw;
  return tmpl;
}
function collectBindings(fragment) {
  const bindings = [];
  const walker = document.createTreeWalker(
    fragment,
    NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_ELEMENT
  );
  let node;
  while ((node = walker.nextNode()) !== null) {
    if (node.nodeType === Node.COMMENT_NODE) {
      const match = CONTENT_MARKER_RE.exec(node.nodeValue ?? "");
      if (match !== null) {
        bindings.push({
          type: "content",
          node,
          index: parseInt(match[1] ?? "0", 10)
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node;
      for (const attr of [...el.attributes]) {
        if (attr.name.startsWith(EVENT_PREFIX)) {
          const attrMatch = ATTR_MARKER_RE.exec(attr.value);
          ATTR_MARKER_RE.lastIndex = 0;
          if (attrMatch !== null) {
            bindings.push({
              type: "event",
              node: el,
              index: parseInt(attrMatch[1] ?? "0", 10),
              eventName: attr.name.slice(EVENT_PREFIX.length)
            });
          }
        } else if (attr.name.startsWith(PROP_PREFIX)) {
          const attrMatch = ATTR_MARKER_RE.exec(attr.value);
          ATTR_MARKER_RE.lastIndex = 0;
          if (attrMatch !== null) {
            bindings.push({
              type: "prop",
              node: el,
              index: parseInt(attrMatch[1] ?? "0", 10),
              propName: attr.name.slice(PROP_PREFIX.length)
            });
          }
        } else if (attr.name === "ref") {
          const attrMatch = ATTR_MARKER_RE.exec(attr.value);
          ATTR_MARKER_RE.lastIndex = 0;
          if (attrMatch !== null) {
            bindings.push({
              type: "ref",
              node: el,
              index: parseInt(attrMatch[1] ?? "0", 10)
            });
          }
        } else {
          const attrMatch = ATTR_MARKER_RE.exec(attr.value);
          ATTR_MARKER_RE.lastIndex = 0;
          if (attrMatch !== null) {
            bindings.push({
              type: "attr",
              node: el,
              index: parseInt(attrMatch[1] ?? "0", 10),
              attrName: attr.name
            });
          }
        }
      }
    }
  }
  return bindings;
}
function applyBinding(binding, value) {
  const scopedEffect = _currentScope ?? effect;
  switch (binding.type) {
    case "event": {
      if (typeof value === "function") {
        binding.node.addEventListener(
          binding.eventName,
          value
        );
      }
      binding.node.removeAttribute(`${EVENT_PREFIX}${binding.eventName}`);
      break;
    }
    case "prop": {
      binding.node.removeAttribute(`${PROP_PREFIX}${binding.propName}`);
      const setProp = (val) => {
        binding.node[binding.propName] = val;
      };
      if (typeof value === "function") {
        scopedEffect(() => {
          setProp(value());
        });
      } else {
        setProp(value);
      }
      break;
    }
    case "content": {
      const anchor = binding.node;
      if (isContentDirective(value)) {
        value._apply(anchor, scopedEffect);
        break;
      }
      let currentNodes = [];
      const replace = (val) => {
        for (const n of currentNodes) n.parentNode?.removeChild(n);
        currentNodes = [];
        for (const n of toNodes(val)) {
          anchor.parentNode?.insertBefore(n, anchor);
          currentNodes.push(n);
        }
      };
      if (typeof value === "function") {
        scopedEffect(() => replace(value()));
      } else {
        replace(value);
      }
      break;
    }
    case "ref": {
      binding.node.removeAttribute("ref");
      if (isRef(value)) {
        value.el = binding.node;
      }
      break;
    }
    case "attr": {
      if (typeof value === "function") {
        scopedEffect(() => {
          binding.node.setAttribute(
            binding.attrName,
            stringify(value())
          );
        });
      } else {
        binding.node.setAttribute(
          binding.attrName,
          stringify(value)
        );
      }
      break;
    }
  }
}
function ssrHtml(strings, values) {
  let result = "";
  for (let i = 0; i < strings.length; i++) {
    const str = strings[i] ?? "";
    if (i < values.length) {
      const value = values[i];
      const isSkippedAttr = /\s([@.][\w:-]+|ref)=["']?$/.test(str.trimEnd());
      if (isSkippedAttr) {
        result += str.replace(/\s([@.][\w:-]+|ref)=["']?$/, "");
        continue;
      }
      result += str;
      const resolved = typeof value === "function" ? value() : value;
      if (isContentDirective(resolved)) {
        result += resolved._ssr();
      } else if (Array.isArray(resolved)) {
        result += resolved.map(
          (v) => typeof v === "string" ? v : escapeHtml(stringify(v))
        ).join("");
      } else {
        result += escapeHtml(stringify(resolved));
      }
    } else {
      result += str;
    }
  }
  return result;
}
function toNodes(val) {
  if (val instanceof DocumentFragment) return [...val.childNodes];
  if (val instanceof Node) return [val];
  if (Array.isArray(val)) return val.flatMap(toNodes);
  return [document.createTextNode(stringify(val))];
}
function stringify(value) {
  if (value === null || value === void 0) return "";
  return String(value);
}
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function trustedHtml(htmlStr) {
  return {
    [DIRECTIVE_BRAND]: true,
    _apply(anchor) {
      const tmp = document.createElement("template");
      tmp.innerHTML = htmlStr;
      anchor.parentNode?.insertBefore(tmp.content, anchor);
    },
    _ssr() {
      return htmlStr;
    }
  };
}

// src/component.ts
var providerMap = /* @__PURE__ */ new WeakMap();
var registry = /* @__PURE__ */ new Map();
function component(name, fn, options = {}) {
  if (!name.includes("-")) {
    throw new Error(
      `[nativedom] Component name "${name}" must contain a hyphen (Custom Elements spec).`
    );
  }
  const definition = {
    name,
    fn,
    options: {
      shadow: options.shadow ?? true,
      shadowMode: options.shadowMode ?? "open",
      observedAttrs: options.observedAttrs ?? [],
      island: options.island ?? false,
      onError: options.onError,
      styles: options.styles
    }
  };
  registry.set(name, definition);
  if (typeof window !== "undefined") {
    registerClientElement(definition);
  }
  return createFactory(name);
}
function ssrRender(name, props = {}) {
  const def = registry.get(name);
  if (def === void 0) {
    throw new Error(`[nativedom] Unknown component: "${name}". Did you forget to import it?`);
  }
  const ctx = buildServerContext();
  const noOp = (_fn) => ({ dispose: () => {
  } });
  const content = withEffectScope(noOp, () => def.fn(props, ctx));
  const attrsHtml = serializeAttrs(props, def.options.island);
  if (def.options.shadow) {
    return `<${name}${attrsHtml}><template shadowrootmode="${def.options.shadowMode}">` + (def.options.styles ? `<style>${def.options.styles}</style>` : "") + String(content) + `</template></${name}>`;
  }
  return `<${name}${attrsHtml}>${String(content)}</${name}>`;
}
function injectStyles(name, css) {
  if (document.querySelector(`style[data-nf="${name}"]`) !== null) return;
  const style = document.createElement("style");
  style.dataset["nf"] = name;
  style.textContent = `@scope (${name}) {
${css}
}`;
  document.head.appendChild(style);
}
function registerClientElement(def) {
  const { name, fn, options } = def;
  if (customElements.get(name) !== void 0) return;
  if (!options.shadow && options.styles !== void 0) {
    injectStyles(name, options.styles);
  }
  let componentSheet;
  if (options.shadow && options.styles !== void 0) {
    try {
      componentSheet = new CSSStyleSheet();
      componentSheet.replaceSync(options.styles);
    } catch {
    }
  }
  class NativeFrameElement extends HTMLElement {
    #effectHandles = [];
    #mountCallbacks = [];
    #unmountCallbacks = [];
    #refs = [];
    static get observedAttributes() {
      return options.observedAttrs;
    }
    connectedCallback() {
      if (componentSheet !== void 0) {
        const sr = this.shadowRoot ?? this.attachShadow({ mode: options.shadowMode });
        if (!sr.adoptedStyleSheets.includes(componentSheet)) {
          sr.adoptedStyleSheets = [componentSheet, ...sr.adoptedStyleSheets];
        }
      }
      this.#render();
      this.#mountCallbacks.forEach((cb) => {
        cb();
      });
    }
    disconnectedCallback() {
      this.#effectHandles.forEach((h) => {
        h.dispose();
      });
      this.#effectHandles.length = 0;
      this.#unmountCallbacks.forEach((cb) => {
        cb();
      });
      for (const r of this.#refs) {
        r.el = null;
      }
      this.#refs.length = 0;
    }
    attributeChangedCallback(_name, oldVal, newVal) {
      if (oldVal === newVal) return;
      this.#render();
    }
    #render() {
      const root = options.shadow ? this.shadowRoot ?? this.attachShadow({ mode: options.shadowMode }) : this;
      if (root.childNodes.length > 0 && this.hasAttribute("nf-ssr")) {
        this.removeAttribute("nf-ssr");
        return;
      }
      for (const r of this.#refs) {
        r.el = null;
      }
      this.#refs.length = 0;
      const ctx = this.#buildContext();
      const props = this.#parseProps();
      if (options.shadow && options.styles !== void 0 && componentSheet === void 0) {
        if (root.querySelector("style[data-nf]") === null) {
          const style = document.createElement("style");
          style.dataset["nf"] = name;
          style.textContent = options.styles;
          root.appendChild(style);
        }
      }
      const effectsBefore = this.#effectHandles.length;
      try {
        const fragment = withEffectScope(ctx.effect, () => fn(props, ctx));
        root.replaceChildren(fragment);
      } catch (err) {
        for (let i = effectsBefore; i < this.#effectHandles.length; i++) {
          this.#effectHandles[i]?.dispose();
        }
        this.#effectHandles.length = effectsBefore;
        if (options.onError !== void 0) {
          console.error(`[nativedom] <${this.tagName.toLowerCase()}>:`, err);
          try {
            const fallback = options.onError(err);
            if (fallback instanceof DocumentFragment) {
              root.replaceChildren(fallback);
            } else {
              root.innerHTML = typeof fallback === "string" ? fallback : String(fallback ?? "");
            }
          } catch {
            root.innerHTML = "";
          }
        } else {
          throw err;
        }
      }
    }
    #parseProps() {
      const props = {};
      for (const attr of this.attributes) {
        if (attr.name === "nf-ssr") continue;
        try {
          props[attr.name] = JSON.parse(attr.value);
        } catch {
          props[attr.name] = attr.value;
        }
      }
      const jsProps = this._nfProps;
      if (jsProps !== void 0) {
        Object.assign(props, jsProps);
      }
      return props;
    }
    #buildContext() {
      const self = this;
      return {
        signal(initialValue) {
          return signal(initialValue);
        },
        computed(fn2) {
          return computed(fn2);
        },
        batch,
        effect(fn2) {
          const handle = options.onError !== void 0 ? effect(() => {
            try {
              fn2();
            } catch (err) {
              console.error(`[nativedom] effect error in <${self.tagName.toLowerCase()}>:`, err);
            }
          }) : effect(fn2);
          self.#effectHandles.push(handle);
          return handle;
        },
        watch(getter, callback) {
          let prev;
          let initialized = false;
          const handle = effect(() => {
            const cur = getter();
            if (!initialized) {
              initialized = true;
              prev = cur;
              return;
            }
            callback(cur, prev);
            prev = cur;
          });
          self.#effectHandles.push(handle);
        },
        html,
        onMount(callback) {
          self.#mountCallbacks.push(callback);
        },
        onUnmount(callback) {
          self.#unmountCallbacks.push(callback);
        },
        provide(context, value) {
          let map = providerMap.get(self);
          if (map === void 0) {
            map = /* @__PURE__ */ new Map();
            providerMap.set(self, map);
          }
          map.set(context._id, value);
        },
        inject(context) {
          let el = self.parentElement;
          while (el !== null) {
            const map = providerMap.get(el);
            if (map !== void 0 && map.has(context._id)) {
              return map.get(context._id);
            }
            el = el.parentElement;
          }
          return context._defaultValue;
        },
        ref() {
          const r = createRef();
          self.#refs.push(r);
          return r;
        }
      };
    }
  }
  customElements.define(name, NativeFrameElement);
}
function buildServerContext() {
  return {
    signal(initialValue) {
      return {
        get: () => initialValue,
        peek: () => initialValue,
        set: () => {
        }
      };
    },
    computed(fn) {
      const value = fn();
      return { get: () => value, peek: () => value };
    },
    batch(fn) {
      fn();
    },
    effect(_fn) {
      return { dispose: () => {
      } };
    },
    watch: () => {
    },
    html: (strings, ...values) => ssrHtml(strings, values),
    onMount: () => {
    },
    onUnmount: () => {
    },
    provide: () => {
    },
    inject: (context) => context._defaultValue,
    ref: () => createRef()
  };
}
function createFactory(name) {
  return (props) => {
    if (typeof window === "undefined") {
      const directive = {
        [DIRECTIVE_BRAND]: true,
        _apply() {
        },
        _ssr() {
          return `<${name}${propsToAttrs(props)}></${name}>`;
        }
      };
      return directive;
    }
    const el = document.createElement(name);
    if (props) {
      const jsProps = {};
      let hasJsProps = false;
      for (const [key, value] of Object.entries(props)) {
        if (value === null || value === void 0) continue;
        if (typeof value === "object" || typeof value === "function") {
          jsProps[key] = value;
          hasJsProps = true;
        } else {
          el.setAttribute(key, String(value));
        }
      }
      if (hasJsProps) {
        el._nfProps = jsProps;
      }
    }
    return el;
  };
}
function propsToAttrs(props) {
  if (!props) return "";
  let attrs = "";
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === void 0) continue;
    if (typeof value === "object" || typeof value === "function") continue;
    attrs += ` ${key}="${String(value).replace(/"/g, "&quot;")}"`;
  }
  return attrs;
}
function serializeAttrs(props, isIsland) {
  let attrs = isIsland ? " nf-ssr" : "";
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === "function") continue;
    const serialized = typeof value === "object" ? JSON.stringify(value) : String(value);
    attrs += ` ${key}="${serialized.replace(/"/g, "&quot;")}"`;
  }
  return attrs;
}
function getComponentStyles() {
  let css = "";
  for (const [name, def] of registry) {
    if (def.options.styles === void 0 || def.options.shadow) continue;
    css += `@scope (${name}) {
${def.options.styles}
}
`;
  }
  return css;
}

// src/repeat.ts
function repeat(getter, keyFn, renderFn) {
  return {
    [DIRECTIVE_BRAND]: true,
    // ── Client ─────────────────────────────────────────────────────────────
    _apply(anchor, scopedEffect) {
      const nodeMap = /* @__PURE__ */ new Map();
      scopedEffect(() => {
        const items = getter();
        const newKeys = items.map(keyFn);
        const newKeySet = new Set(newKeys);
        for (const [key, nodes] of nodeMap) {
          if (!newKeySet.has(key)) {
            for (const n of nodes) n.parentNode?.removeChild(n);
            nodeMap.delete(key);
          }
        }
        let cursor = anchor;
        for (let i = items.length - 1; i >= 0; i--) {
          const item = items[i];
          const key = newKeys[i];
          let nodes = nodeMap.get(key);
          if (nodes === void 0) {
            const rendered = withEffectScope(scopedEffect, () => renderFn(item, i));
            nodes = toChildNodes(rendered);
            nodeMap.set(key, nodes);
            for (const n of nodes) anchor.parentNode?.insertBefore(n, cursor);
          } else {
            const last = nodes[nodes.length - 1];
            if (last !== void 0 && last.nextSibling !== cursor) {
              for (const n of nodes) anchor.parentNode?.insertBefore(n, cursor);
            }
          }
          if (nodes.length > 0) cursor = nodes[0];
        }
      });
    },
    // ── Server ─────────────────────────────────────────────────────────────
    _ssr() {
      return getter().map((item, i) => ssrInterpolation(renderFn(item, i))).join("");
    }
  };
}
function toChildNodes(val) {
  if (val instanceof DocumentFragment) return [...val.childNodes];
  if (val instanceof Node) return [val];
  if (Array.isArray(val)) return val.flatMap(toChildNodes);
  const text = document.createTextNode(val == null ? "" : String(val));
  return [text];
}
function ssrInterpolation(val) {
  if (isContentDirective(val)) return val._ssr();
  if (typeof val === "string") return val;
  if (val == null) return "";
  if (Array.isArray(val)) return val.map(ssrInterpolation).join("");
  if (typeof val === "function") return ssrInterpolation(val());
  return String(val);
}

// src/transition.ts
function transition(getter, options) {
  const name = options?.name ?? "nf";
  const duration = options?.duration ?? 300;
  return {
    [DIRECTIVE_BRAND]: true,
    _apply(anchor, scopedEffect) {
      let currentNodes = [];
      let isFirst = true;
      scopedEffect(() => {
        const newNodes = toChildNodes2(getter());
        const first = isFirst;
        isFirst = false;
        const leaving = currentNodes;
        if (!first && leaving.length > 0) {
          const el = leaving.find(isElementNode);
          if (el !== void 0) {
            el.classList.add(`${name}-leave-active`, `${name}-leave-to`);
          }
          let leaveTimer;
          let leaveDone = false;
          const finishLeave = () => {
            if (leaveDone) return;
            leaveDone = true;
            if (leaveTimer !== void 0) clearTimeout(leaveTimer);
            for (const n of leaving) n.parentNode?.removeChild(n);
          };
          if (el !== void 0) {
            el.addEventListener("transitionend", finishLeave, { once: true });
            el.addEventListener("animationend", finishLeave, { once: true });
          }
          leaveTimer = setTimeout(finishLeave, duration);
        }
        const enterEl = newNodes.find(isElementNode);
        if (!first && enterEl !== void 0) {
          enterEl.classList.add(`${name}-enter-from`, `${name}-enter-active`);
        }
        for (const n of newNodes) anchor.parentNode?.insertBefore(n, anchor);
        currentNodes = newNodes;
        if (!first && enterEl !== void 0) {
          requestAnimationFrame(() => {
            enterEl.classList.remove(`${name}-enter-from`);
            let enterTimer;
            let enterDone = false;
            const finishEnter = () => {
              if (enterDone) return;
              enterDone = true;
              if (enterTimer !== void 0) clearTimeout(enterTimer);
              enterEl.classList.remove(`${name}-enter-active`);
            };
            enterEl.addEventListener("transitionend", finishEnter, { once: true });
            enterEl.addEventListener("animationend", finishEnter, { once: true });
            enterTimer = setTimeout(finishEnter, duration);
          });
        }
      });
    },
    _ssr() {
      return ssrVal(getter());
    }
  };
}
function isElementNode(n) {
  return n.nodeType === Node.ELEMENT_NODE;
}
function toChildNodes2(val) {
  if (val instanceof DocumentFragment) return [...val.childNodes];
  if (val instanceof Node) return [val];
  if (Array.isArray(val)) return val.flatMap(toChildNodes2);
  return [document.createTextNode(val == null ? "" : String(val))];
}
function ssrVal(val) {
  if (isContentDirective(val)) return val._ssr();
  if (typeof val === "string") return val;
  if (val == null) return "";
  if (Array.isArray(val)) return val.map(ssrVal).join("");
  if (typeof val === "function") return ssrVal(val());
  return String(val);
}

// src/async.ts
function asyncSignal(fetcher, options = {}) {
  const hasInitial = options.initialValue !== void 0;
  const _data = signal(options.initialValue);
  const _loading = signal(!hasInitial);
  const _error = signal(void 0);
  let version = 0;
  let skipFirst = options.lazy ?? hasInitial;
  const run = () => {
    if (skipFirst) {
      skipFirst = false;
      return;
    }
    const thisVersion = ++version;
    _loading.set(true);
    _error.set(void 0);
    fetcher().then(
      (result) => {
        if (thisVersion !== version) return;
        _data.set(result);
        _loading.set(false);
      },
      (err) => {
        if (thisVersion !== version) return;
        _error.set(err instanceof Error ? err : new Error(String(err)));
        _loading.set(false);
      }
    );
  };
  const registrar = getCurrentScope() ?? effect;
  registrar(run);
  return {
    data: _data,
    loading: _loading,
    error: _error,
    refetch: run
  };
}
export {
  DIRECTIVE_BRAND,
  asyncSignal,
  batch,
  component,
  computed,
  createContext,
  createRef,
  effect,
  getComponentStyles,
  getCurrentScope,
  html,
  isContentDirective,
  registry,
  repeat,
  signal,
  ssrHtml,
  ssrRender,
  transition,
  trustedHtml,
  untrack,
  withEffectScope
};
//# sourceMappingURL=index.js.map
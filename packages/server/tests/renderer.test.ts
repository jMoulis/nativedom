import { describe, it, expect } from "vitest";
import { component } from "@nativeframe/core";
import { renderPage, renderFragment, streamPage } from "../src/renderer.js";

// Register test components before tests run
let counter = 0;
function uniqueTag(base: string): string {
  return `${base}-${++counter}`;
}

describe("ssrRender() via renderFragment()", () => {
  it("renders a simple component to an HTML string", () => {
    const tag = uniqueTag("ssr-simple");
    component(tag, (_props, { html }) => html`<span>hello</span>`);
    const result = renderFragment(tag);
    expect(result).toContain(`<${tag}`);
    expect(result).toContain("hello");
  });

  it("wraps output in Declarative Shadow DOM when shadow: true (default)", () => {
    const tag = uniqueTag("ssr-shadow");
    component(tag, (_props, { html }) => html`<p>content</p>`);
    const result = renderFragment(tag);
    expect(result).toContain('<template shadowrootmode="open">');
    expect(result).toContain("</template>");
  });

  it("does NOT emit shadow DOM when shadow: false", () => {
    const tag = uniqueTag("ssr-noshadow");
    component(tag, (_props, { html }) => html`<p>direct</p>`, {
      shadow: false,
    });
    const result = renderFragment(tag);
    expect(result).not.toContain("<template shadowrootmode");
    expect(result).toContain("direct");
  });

  it("serializes primitive props as attributes", () => {
    const tag = uniqueTag("ssr-props");
    component<{ count: number; label: string }>(
      tag,
      (props, { html }) =>
        html`<span>${props.label}: ${String(props.count)}</span>`,
    );
    const result = renderFragment(tag, { count: 5, label: "score" });
    expect(result).toContain('count="5"');
    expect(result).toContain('label="score"');
  });

  it("adds nf-ssr attribute when island: true", () => {
    const tag = uniqueTag("ssr-island");
    component(tag, (_props, { html }) => html`<div>island</div>`, {
      island: true,
    });
    const result = renderFragment(tag);
    expect(result).toContain("nf-ssr");
  });

  it("does NOT add nf-ssr when island: false (default)", () => {
    const tag = uniqueTag("ssr-not-island");
    component(tag, (_props, { html }) => html`<div>static</div>`);
    const result = renderFragment(tag);
    expect(result).not.toContain("nf-ssr");
  });

  it("resolves signal initial values statically", () => {
    const tag = uniqueTag("ssr-signals");
    component(tag, (_props, { signal, html }) => {
      const count = signal(42);
      return html`<span>${() => count.get()}</span>`;
    });
    const result = renderFragment(tag);
    expect(result).toContain("42");
  });

  it("throws for unknown component names", () => {
    expect(() => renderFragment("nf-does-not-exist")).toThrow(
      /Unknown component/,
    );
  });

  it("skips function props (not serializable as attributes)", () => {
    const tag = uniqueTag("ssr-fn-props");
    component<{ onClick: () => void; label: string }>(
      tag,
      (props, { html }) => html`<button>${props.label}</button>`,
    );
    const result = renderFragment(tag, {
      onClick: () => {},
      label: "click me",
    });
    expect(result).not.toContain("onClick");
    expect(result).toContain('label="click me"');
  });
});

describe("renderPage()", () => {
  it("returns a complete HTML document", () => {
    const tag = uniqueTag("page-root");
    component(tag, (_props, { html }) => html`<main>app</main>`);
    const { html, status } = renderPage(tag, {}, { title: "My App" });
    expect(status).toBe(200);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>My App</title>");
    expect(html).toContain("<body>");
  });

  it("injects store snapshot as window.__NF_STORE__", () => {
    const tag = uniqueTag("page-store");
    component(tag, (_props, { html }) => html`<div>app</div>`);
    const { html } = renderPage(
      tag,
      {},
      {
        storeSnapshot: { theme: "dark", user: null },
      },
    );
    expect(html).toContain("window.__NF_STORE__");
    expect(html).toContain('"theme":"dark"');
  });

  it("emits module script tags", () => {
    const tag = uniqueTag("page-scripts");
    component(tag, (_props, { html }) => html`<div>app</div>`);
    const { html } = renderPage(
      tag,
      {},
      {
        scripts: ["/dist/app.js", "/dist/vendor.js"],
      },
    );
    expect(html).toContain('type="module"');
    expect(html).toContain('src="/dist/app.js"');
    expect(html).toContain('src="/dist/vendor.js"');
  });

  it("sets correct Content-Type header", () => {
    const tag = uniqueTag("page-headers");
    component(tag, (_props, { html }) => html`<div>app</div>`);
    const { headers } = renderPage(tag);
    expect(headers["Content-Type"]).toContain("text/html");
    expect(headers["Content-Type"]).toContain("utf-8");
  });

  it("uses specified lang attribute", () => {
    const tag = uniqueTag("page-lang");
    component(tag, (_props, { html }) => html`<div>app</div>`);
    const { html } = renderPage(tag, {}, { lang: "fr" });
    expect(html).toContain('lang="fr"');
  });

  it('defaults lang to "en"', () => {
    const tag = uniqueTag("page-lang-default");
    component(tag, (_props, { html }) => html`<div>app</div>`);
    const { html } = renderPage(tag);
    expect(html).toContain('lang="en"');
  });
});

describe("streamPage()", () => {
  it("returns an async generator (has .next method)", () => {
    const tag = uniqueTag("stream-gen");
    component(tag, (_props, { html }) => html`<main>gen</main>`);
    const gen = streamPage(tag);
    expect(typeof gen.next).toBe("function");
  });

  it("yields multiple chunks (at least 2)", async () => {
    const tag = uniqueTag("stream-chunks");
    component(tag, (_props, { html }) => html`<main>chunks</main>`);
    const chunks: string[] = [];
    for await (const chunk of streamPage(tag)) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThanOrEqual(2);
  });

  it("concatenated chunks equal renderPage() html for the same arguments", async () => {
    const tag = uniqueTag("stream-concat");
    component(tag, (_props, { html }) => html`<section>concat</section>`);
    const options = {
      title: "Concat Test",
      storeSnapshot: { x: 1 },
      scripts: ["/dist/app.js"],
    };
    const { html } = renderPage(tag, {}, options);
    const chunks: string[] = [];
    for await (const chunk of streamPage(tag, {}, options)) {
      chunks.push(chunk);
    }
    expect(chunks.join("")).toBe(html);
  });

  it("first chunk contains <!DOCTYPE html> and </head>", async () => {
    const tag = uniqueTag("stream-shell");
    component(tag, (_props, { html }) => html`<div>shell</div>`);
    const { value: firstChunk } = await streamPage(tag).next();
    expect(firstChunk).toContain("<!DOCTYPE html>");
    expect(firstChunk).toContain("</head>");
  });

  it("first chunk does NOT contain the component body", async () => {
    const tag = uniqueTag("stream-no-body");
    component(tag, (_props, { html }) => html`<div>unique-body-content</div>`);
    const { value: firstChunk } = await streamPage(tag).next();
    expect(firstChunk).not.toContain("unique-body-content");
  });

  it("second chunk contains the component's rendered output", async () => {
    const tag = uniqueTag("stream-body");
    component(tag, (_props, { html }) => html`<div>stream-body-text</div>`);
    const gen = streamPage(tag);
    await gen.next(); // skip shell
    const { value: bodyChunk } = await gen.next();
    expect(bodyChunk).toContain(tag);
    expect(bodyChunk).toContain("stream-body-text");
  });

  it("last chunk contains </body> and </html>", async () => {
    const tag = uniqueTag("stream-tail");
    component(tag, (_props, { html }) => html`<div>tail</div>`);
    const chunks: string[] = [];
    for await (const chunk of streamPage(tag)) {
      chunks.push(chunk);
    }
    const lastChunk = chunks[chunks.length - 1]!;
    expect(lastChunk).toContain("</body>");
    expect(lastChunk).toContain("</html>");
  });

  it("storeSnapshot appears in tail, not shell", async () => {
    const tag = uniqueTag("stream-store");
    component(tag, (_props, { html }) => html`<div>store</div>`);
    const chunks: string[] = [];
    for await (const chunk of streamPage(tag, {}, { storeSnapshot: { count: 7 } })) {
      chunks.push(chunk);
    }
    expect(chunks[0]).not.toContain("__NF_STORE__");
    const tail = chunks[chunks.length - 1]!;
    expect(tail).toContain("__NF_STORE__");
    expect(tail).toContain('"count":7');
  });

  it("script tags appear in tail, not shell", async () => {
    const tag = uniqueTag("stream-scripts");
    component(tag, (_props, { html }) => html`<div>scripts</div>`);
    const chunks: string[] = [];
    for await (const chunk of streamPage(tag, {}, { scripts: ["/dist/bundle.js"] })) {
      chunks.push(chunk);
    }
    expect(chunks[0]).not.toContain("/dist/bundle.js");
    const tail = chunks[chunks.length - 1]!;
    expect(tail).toContain('src="/dist/bundle.js"');
  });

  it("lang option appears in shell", async () => {
    const tag = uniqueTag("stream-lang");
    component(tag, (_props, { html }) => html`<div>lang</div>`);
    const { value: firstChunk } = await streamPage(tag, {}, { lang: "de" }).next();
    expect(firstChunk).toContain('lang="de"');
  });

  it("title option appears in shell", async () => {
    const tag = uniqueTag("stream-title");
    component(tag, (_props, { html }) => html`<div>title</div>`);
    const { value: firstChunk } = await streamPage(tag, {}, { title: "Stream Title" }).next();
    expect(firstChunk).toContain("<title>Stream Title</title>");
  });

  it("head option appears in shell", async () => {
    const tag = uniqueTag("stream-head");
    component(tag, (_props, { html }) => html`<div>head</div>`);
    const { value: firstChunk } = await streamPage(
      tag,
      {},
      { head: '<link rel="stylesheet" href="/app.css" />' },
    ).next();
    expect(firstChunk).toContain('href="/app.css"');
  });
});

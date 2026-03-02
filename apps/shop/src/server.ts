import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";

import { streamPage } from "@nativeframe/server";
import { getComponentStyles } from "@nativeframe/core";

// Register all components server-side
import "./components/shop-header.js";
import "./components/product-card.js";
import "./components/product-grid.js";
import "./components/shop-home.js";
import "./components/product-detail.js";
import "./components/admin-app.js";
import "./components/admin-products.js";
import "./components/admin-form.js";

import { products, slugify } from "./db/products.js";
import type { Product } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3002;

// ── Helpers ──────────────────────────────────────────────────────────────────

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += String(chunk);
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function contentType(filePath: string): string {
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  return "application/octet-stream";
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(payload);
}

const BASE_CSS = `
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, sans-serif; background: #f9fafb; }
    .hero {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #fff;
      padding: 4rem 1rem;
      text-align: center;
    }
    .hero__inner { max-width: 640px; margin: 0 auto; }
    .hero__title { font-size: 2.5rem; font-weight: 800; margin: 0 0 0.75rem; }
    .hero__sub { font-size: 1.1rem; color: #a5b4fc; margin: 0; }
  </style>
`;

async function streamHtml(
  res: ServerResponse,
  component: string,
  props: Record<string, string>,
  opts: { title?: string } = {},
): Promise<void> {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  for await (const chunk of streamPage(component, props, {
    ...(opts.title !== undefined ? { title: opts.title } : {}),
    head: BASE_CSS + `<style>${getComponentStyles()}</style>`,
    scripts: ["/dist/client.js"],
  })) {
    res.write(chunk);
  }
  res.end();
}

// ── Server ────────────────────────────────────────────────────────────────────

http
  .createServer(async (req, res) => {
    const rawUrl = req.url ?? "/";
    // Strip query string for routing
    const url = rawUrl.split("?")[0] ?? "/";
    const method = req.method ?? "GET";

    // ── Static files ──────────────────────────────────────────────────────────
    if (url.startsWith("/dist/")) {
      const filePath = path.join(__dirname, "..", url.slice(1));
      try {
        const data = fs.readFileSync(filePath);
        res.writeHead(200, { "Content-Type": contentType(filePath) });
        res.end(data);
      } catch {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
      }
      return;
    }

    // ── REST API ──────────────────────────────────────────────────────────────

    // GET /api/products
    if (method === "GET" && url === "/api/products") {
      sendJson(res, 200, products.find());
      return;
    }

    // GET /api/products/:id
    const apiProductMatch = url.match(/^\/api\/products\/([^/]+)$/);
    if (apiProductMatch) {
      const id = apiProductMatch[1] ?? "";

      if (method === "GET") {
        const product = products.findById(id);
        if (!product) {
          sendJson(res, 404, { error: "Not found" });
          return;
        }
        sendJson(res, 200, product);
        return;
      }

      if (method === "PUT") {
        const body = await readBody(req);
        let patch: Partial<Product>;
        try {
          patch = JSON.parse(body) as Partial<Product>;
        } catch {
          res.writeHead(400);
          res.end("Invalid JSON");
          return;
        }

        // Regenerate slug if name changed
        if (patch.name) patch.slug = slugify(patch.name);

        const updated = products.updateOne(id, patch);
        if (!updated) {
          sendJson(res, 404, { error: "Not found" });
          return;
        }
        sendJson(res, 200, updated);
        return;
      }

      if (method === "DELETE") {
        const deleted = products.deleteOne(id);
        if (!deleted) {
          sendJson(res, 404, { error: "Not found" });
          return;
        }
        res.writeHead(204);
        res.end();
        return;
      }
    }

    // POST /api/products
    if (method === "POST" && url === "/api/products") {
      const body = await readBody(req);
      let data: Omit<Product, "slug" | "createdAt">;
      try {
        data = JSON.parse(body) as Omit<Product, "slug" | "createdAt">;
      } catch {
        res.writeHead(400);
        res.end("Invalid JSON");
        return;
      }

      const newProduct: Product = {
        ...data,
        slug: slugify(data.name),
        createdAt: new Date().toISOString(),
      };
      const created = products.insertOne(newProduct);
      sendJson(res, 201, created);
      return;
    }

    // ── SSR Pages ─────────────────────────────────────────────────────────────

    // Home page
    if (url === "/" || url === "") {
      await streamHtml(res, "shop-home", {}, { title: "NativeFrame Shop" });
      return;
    }

    // Product detail: /product/:slug
    const productSlugMatch = url.match(/^\/product\/([^/]+)$/);
    if (productSlugMatch) {
      const slug = productSlugMatch[1] ?? "";
      const product = products.findOne({ slug });
      if (!product) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Product not found");
        return;
      }
      await streamHtml(
        res,
        "product-detail",
        { id: product._id },
        { title: `${product.name} — NativeFrame Shop` },
      );
      return;
    }

    // Admin shell (all /admin/* routes — client router handles sub-paths)
    if (url === "/admin" || url.startsWith("/admin/")) {
      await streamHtml(
        res,
        "admin-app",
        {},
        { title: "Admin — NativeFrame Shop" },
      );
      return;
    }

    // 404
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  })
  .listen(PORT, () => {
    console.log(`NativeFrame Shop running at http://localhost:${PORT}`);
  });

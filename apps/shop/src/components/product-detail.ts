import { component, ssrRender } from "@nativeframe/core";
import { products } from "../db/products.js";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export const ProductDetail = component<{ id: string }>(
  "product-detail",
  ({ id }) => {
    const product = products.findById(id);

    if (!product) {
      return `
        ${ssrRender("shop-header", {})}
        <div class="detail-wrap">
          <p class="detail-missing">Product not found.</p>
          <a href="/" class="detail-back">← Back to shop</a>
        </div>
      `;
    }

    const stockLabel = product.stock > 0
      ? `${product.stock} in stock`
      : `<span class="out-of-stock">Out of stock</span>`;

    return `
      ${ssrRender("shop-header", {})}
      <div class="detail-wrap">
        <a href="/" class="detail-back">← Back to shop</a>
        <article class="detail-card">
          <div class="detail-badge">${product.category}</div>
          <h1 class="detail-name">${product.name}</h1>
          <div class="detail-meta">
            <span class="detail-price">${formatPrice(product.price)}</span>
            <span class="detail-stock">${stockLabel}</span>
          </div>
          <p class="detail-desc">${product.description}</p>
        </article>
      </div>
      <style>
        body { margin: 0; font-family: system-ui, sans-serif; background: #f9fafb; }
        .detail-wrap {
          max-width: 720px;
          margin: 2rem auto;
          padding: 0 1rem;
        }
        .detail-back {
          display: inline-block;
          margin-bottom: 1.25rem;
          color: #6366f1;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 600;
        }
        .detail-back:hover { text-decoration: underline; }
        .detail-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 2rem;
        }
        .detail-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #6366f1;
          background: #eef2ff;
          border-radius: 4px;
          padding: 3px 10px;
          margin-bottom: 1rem;
        }
        .detail-name {
          font-size: 2rem;
          font-weight: 800;
          color: #111;
          margin: 0 0 1rem;
        }
        .detail-meta {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 1.25rem;
        }
        .detail-price {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111;
        }
        .detail-stock {
          font-size: 0.9rem;
          color: #555;
        }
        .out-of-stock { color: #dc2626; font-weight: 600; }
        .detail-desc {
          font-size: 1rem;
          line-height: 1.7;
          color: #374151;
          margin: 0;
        }
        .detail-missing { color: #dc2626; }
      </style>
    `;
  },
  { shadow: false },
);

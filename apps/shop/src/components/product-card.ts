import { component } from "@nativeframe/core";
import { products } from "../db/products.js";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export const ProductCard = component<{ id: string }>(
  "product-card",
  ({ id }) => {
    const product = products.findById(id);
    if (!product) return `<div class="product-card product-card--missing">Product not found</div>`;

    const snippet = product.description.length > 100
      ? product.description.slice(0, 97) + "…"
      : product.description;

    return `
      <article class="product-card">
        <div class="product-card__badge">${product.category}</div>
        <h2 class="product-card__name">${product.name}</h2>
        <p class="product-card__desc">${snippet}</p>
        <div class="product-card__footer">
          <span class="product-card__price">${formatPrice(product.price)}</span>
          <a class="product-card__link" href="/product/${product.slug}">View →</a>
        </div>
      </article>
    `;
  },
  {
    shadow: false,
    island: true,
    styles: `
      :scope {
        display: block;
      }
      .product-card {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        height: 100%;
        box-sizing: border-box;
        transition: box-shadow 0.15s;
      }
      .product-card:hover {
        box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      }
      .product-card__badge {
        display: inline-block;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #6366f1;
        background: #eef2ff;
        border-radius: 4px;
        padding: 2px 8px;
        align-self: flex-start;
      }
      .product-card__name {
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
        color: #111;
      }
      .product-card__desc {
        font-size: 0.85rem;
        color: #555;
        line-height: 1.5;
        margin: 0;
        flex: 1;
      }
      .product-card__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 0.5rem;
      }
      .product-card__price {
        font-size: 1.1rem;
        font-weight: 700;
        color: #111;
      }
      .product-card__link {
        font-size: 0.85rem;
        color: #6366f1;
        text-decoration: none;
        font-weight: 600;
      }
      .product-card__link:hover {
        text-decoration: underline;
      }
    `,
  },
);

import { component, ssrRender } from "@nativedom/core";
import { products } from "../db/products.js";

export const ProductGrid = component(
  "product-grid",
  () => {
    const all = products.find();
    const cards = all.map(p => ssrRender("product-card", { id: p._id })).join("");
    return `
      <section class="product-grid">
        <h2 class="product-grid__title">All Products</h2>
        <div class="product-grid__grid">${cards}</div>
      </section>
    `;
  },
  {
    shadow: false,
    island: true,
    styles: `
      :scope {
        display: block;
      }
      .product-grid {
        max-width: 1100px;
        margin: 0 auto;
        padding: 2rem 1rem;
      }
      .product-grid__title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #111;
        margin: 0 0 1.25rem;
      }
      .product-grid__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 1.25rem;
      }
    `,
  },
);
